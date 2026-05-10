import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  private readonly gemini: GoogleGenerativeAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GEMINI_API_KEY');

    if (apiKey && apiKey.trim().length > 0) {
      this.gemini = new GoogleGenerativeAI(apiKey.trim());
      this.logger.log(`✅ Gemini inicializado (key: ...${apiKey.slice(-6)})`);
    } else {
      this.gemini = null;
      this.logger.warn('⚠️  GEMINI_API_KEY no configurada — se usará análisis simulado');
    }
  }

  async analizarAuto(auto: Auto): Promise<ResultadoAnalisisIA> {
    if (!this.gemini) {
      return this.analisisSimulado(auto);
    }
    try {
      this.logger.log(`Iniciando análisis Gemini para: ${auto.marca} ${auto.modelo}`);
      const resultado = await this.analizarConGemini(auto);
      this.logger.log(`✅ Gemini completado — ${resultado.estado}, puntaje: ${resultado.puntaje}`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Error Gemini: ${error?.message}`);
      return this.analisisSimulado(auto);
    }
  }

  private async analizarConGemini(auto: Auto): Promise<ResultadoAnalisisIA> {
    // Usar v1 explícitamente — compatible con free tier
    const modelo = this.gemini!.getGenerativeModel(
      { model: 'gemini-1.5-flash' },
      { apiVersion: 'v1' },
    );

    const prompt = `Eres un experto tasador de autos usados argentinos. Analizá el siguiente vehículo y respondé ÚNICAMENTE con JSON válido sin markdown.

Vehículo:
- Marca: ${auto.marca}
- Modelo: ${auto.modelo}
- Año: ${auto.anio}
- Kilometraje: ${auto.kilometraje} km
- Combustible: ${auto.combustible}
- Transmisión: ${auto.transmision}
- Precio solicitado: USD ${auto.precio}
- Ubicación: ${auto.ubicacion}
- Descripción: ${auto.descripcion}
- Daños declarados: ${auto.detallesDanios || 'Ninguno'}

Respondé SOLO con este JSON sin texto extra:
{"estado":"Buen estado","puntaje":7.5,"danios":"descripción","rangoPrecioMin":10000,"rangoPrecioMax":12000,"resumen":"resumen breve","aprobado":true}`;

    const resultado = await modelo.generateContent(prompt);
    const texto = resultado.response.text().trim()
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    this.logger.log(`Respuesta Gemini: ${texto.substring(0, 150)}`);
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
      danios:         'Análisis simulado — sin API key configurada.',
      rangoPrecioMin: Math.round(auto.precio * 0.9),
      rangoPrecioMax: Math.round(auto.precio * 1.08),
      resumen:        `Vehículo ${auto.marca} ${auto.modelo} analizado en modo de simulación.`,
      aprobado:       puntaje >= 6,
    };
  }
}
