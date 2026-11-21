import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import type {
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
} from 'groq-sdk/resources/chat/completions';
import type { VariablesEntorno } from '../configuracion/validar-entorno';
import type {
  DatosTasacion,
  ImagenParaTasar,
  ResultadoTasacion,
} from './ia.types';
import { armarMensajeUsuario, PROMPT_SISTEMA } from './prompt-tasacion';
import { validarTasacion } from './validar-tasacion';

/** El modelo solo mira las primeras fotos: alcanza para tasar y limita el costo. */
const MAXIMO_IMAGENES = 4;
const TIEMPO_MAXIMO_MS = 45_000;
export const MENSAJE_IA_NO_DISPONIBLE =
  'El análisis de IA no está disponible, intentá en unos minutos';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly groq: Groq;
  private readonly modelo: string;

  constructor(configuracion: ConfigService<VariablesEntorno, true>) {
    this.groq = new Groq({
      apiKey: configuracion.get('GROQ_API_KEY', { infer: true }),
      timeout: TIEMPO_MAXIMO_MS,
      maxRetries: 1,
    });
    this.modelo = configuracion.get('GROQ_MODELO', { infer: true });
  }

  /**
   * Tasa el vehículo a partir de sus datos y fotos.
   * Si la IA falla o responde algo inválido, lanza 503: la publicación no se
   * guarda sin un análisis real.
   */
  async tasar(
    datos: DatosTasacion,
    imagenes: ImagenParaTasar[],
  ): Promise<ResultadoTasacion> {
    const contenido: ChatCompletionContentPart[] = [
      ...imagenes.slice(0, MAXIMO_IMAGENES).map(aParteImagen),
      { type: 'text', text: armarMensajeUsuario(datos) },
    ];

    let respuesta: string;
    try {
      const completado = await this.groq.chat.completions.create({
        model: this.modelo,
        temperature: 0.1,
        max_completion_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PROMPT_SISTEMA },
          { role: 'user', content: contenido },
        ],
      });
      respuesta = completado.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error(`Groq no respondió: ${describirError(error)}`);
      throw new ServiceUnavailableException(MENSAJE_IA_NO_DISPONIBLE);
    }

    const resultado = validarTasacion(leerJson(respuesta));
    if (!resultado) {
      this.logger.error(`Respuesta de IA inválida: ${respuesta.slice(0, 300)}`);
      throw new ServiceUnavailableException(MENSAJE_IA_NO_DISPONIBLE);
    }
    return resultado;
  }
}

function aParteImagen(imagen: ImagenParaTasar): ChatCompletionContentPartImage {
  const url =
    imagen.tipo === 'url'
      ? imagen.url
      : `data:${imagen.mime};base64,${imagen.datos.toString('base64')}`;
  return { type: 'image_url', image_url: { url } };
}

function leerJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

function describirError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
