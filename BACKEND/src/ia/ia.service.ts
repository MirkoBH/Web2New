import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Auto } from '../cars/auto.entity';

export interface ResultadoAnalisisIA {
  estado: string;
  puntaje: number;
  danios: string;
  rangoPrecioMin: number;
  rangoPrecioMax: number;
  resumen: string;
  aprobado: boolean;
}

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly groq: Groq | null;

  // Modelo con visión para análisis de imágenes
  private readonly MODELO_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';
  // Modelo de texto como fallback si no hay imágenes
  private readonly MODELO_TEXTO  = 'llama-3.3-70b-versatile';

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GROQ_API_KEY');
    if (apiKey?.trim()) {
      this.groq = new Groq({ apiKey: apiKey.trim() });
      this.logger.log(`✅ Groq inicializado (key: ...${apiKey.slice(-6)})`);
    } else {
      this.groq = null;
      this.logger.warn('⚠️  GROQ_API_KEY no configurada — se usará análisis simulado');
    }
  }

  async analizarAuto(auto: Auto): Promise<ResultadoAnalisisIA> {
    if (!this.groq) {
      this.logger.warn('Groq no disponible — usando análisis simulado');
      return this.analisisSimulado(auto);
    }

    try {
      this.logger.log(`Iniciando análisis IA para: ${auto.marca} ${auto.modelo}`);
      const resultado = await this.analizarConGroq(auto);
      this.logger.log(`✅ Análisis completado — ${resultado.estado}, puntaje: ${resultado.puntaje}`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Error Groq: ${error?.message}`);
      return this.analisisSimulado(auto);
    }
  }

  private async analizarConGroq(auto: Auto): Promise<ResultadoAnalisisIA> {
    // Extraer URLs públicas de las imágenes del auto
    const urlsImagenes: string[] = (auto.imagenes || [])
      .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((img: any) => img.urlPublica || img)
      .filter((url: string) => typeof url === 'string' && url.startsWith('http'))
      .slice(0, 4); // máximo 4 imágenes para no superar límites

    const tieneImagenes = urlsImagenes.length > 0;
    const modelo = tieneImagenes ? this.MODELO_VISION : this.MODELO_TEXTO;

    this.logger.log(`Usando modelo: ${modelo} | Imágenes: ${urlsImagenes.length}`);

    // ── Construir el mensaje con o sin imágenes ───────────────
    const contenidoUsuario: any[] = [];

    // Agregar imágenes si las hay
    if (tieneImagenes) {
      for (const url of urlsImagenes) {
        contenidoUsuario.push({
          type: 'image_url',
          image_url: { url },
        });
      }
    }

    // Agregar texto con datos del vehículo
    contenidoUsuario.push({
      type: 'text',
      text: `${tieneImagenes ? 'Analizá las imágenes del vehículo y también los siguientes datos:' : 'Analizá este vehículo:'}

- Marca: ${auto.marca}
- Modelo: ${auto.modelo}
- Año: ${auto.anio}
- Kilometraje: ${auto.kilometraje} km
- Combustible: ${auto.combustible}
- Transmisión: ${auto.transmision}
- Precio solicitado: USD ${auto.precio}
- Ubicación: ${auto.ubicacion}
- Descripción del vendedor: ${auto.descripcion}
- Daños declarados por el vendedor: ${auto.detallesDanios || 'Ninguno'}

${tieneImagenes ? 'Examiná las fotos en busca de daños visibles, rayones, golpes, óxido o inconsistencias con la descripción.' : ''}

Respondé SOLO con el JSON solicitado.`,
    });

    const completion = await this.groq!.chat.completions.create({
      model: modelo,
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Sos un experto tasador de autos usados del mercado argentino.
${tieneImagenes ? 'Analizás imágenes de vehículos para detectar daños visibles y estimás su valor de mercado.' : 'Analizás datos de vehículos para estimar su valor de mercado.'}

Devolvés SIEMPRE un JSON con esta estructura exacta sin texto adicional:
{
  "estado": "Excelente" | "Buen estado" | "Regular" | "Requiere reparacion",
  "puntaje": número del 1.0 al 10.0,
  "danios": "descripción de daños visibles en las fotos, o Sin daños detectados",
  "rangoPrecioMin": número entero en USD según mercado argentino,
  "rangoPrecioMax": número entero en USD según mercado argentino,
  "resumen": "resumen de 1-2 oraciones en español argentino",
  "aprobado": true si el vehículo parece legítimo y en condición aceptable, false si hay inconsistencias graves
}`,
        },
        {
          role: 'user',
          content: contenidoUsuario,
        },
      ],
    });

    const texto = completion.choices[0]?.message?.content?.trim() || '{}';
    this.logger.log(`Respuesta Groq: ${texto.substring(0, 200)}`);

    const parsed = JSON.parse(texto);

    return {
      estado:         parsed.estado         || 'Regular',
      puntaje:        Number(parsed.puntaje) || 6,
      danios:         parsed.danios          || 'No determinado',
      rangoPrecioMin: Number(parsed.rangoPrecioMin) || Math.round(auto.precio * 0.85),
      rangoPrecioMax: Number(parsed.rangoPrecioMax) || Math.round(auto.precio * 1.10),
      resumen:        parsed.resumen         || 'Análisis completado.',
      aprobado:       parsed.aprobado !== false,
    };
  }

  private analisisSimulado(auto: Auto): ResultadoAnalisisIA {
    const puntaje = parseFloat((Math.random() * 3 + 6.5).toFixed(1));
    let estado: string;
    if (puntaje >= 9)        estado = 'Excelente';
    else if (puntaje >= 7.5) estado = 'Buen estado';
    else if (puntaje >= 6)   estado = 'Regular';
    else                     estado = 'Requiere reparacion';

    return {
      estado,
      puntaje,
      danios:         'Análisis simulado — configurá GROQ_API_KEY para análisis real.',
      rangoPrecioMin: Math.round(auto.precio * 0.9),
      rangoPrecioMax: Math.round(auto.precio * 1.08),
      resumen:        `Vehículo ${auto.marca} ${auto.modelo} analizado en modo de simulación.`,
      aprobado:       puntaje >= 6,
    };
  }
}
