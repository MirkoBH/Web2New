import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
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
    this.gemini = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  // ── Análisis principal de un auto ──────────────────────────
  async analizarAuto(auto: Auto): Promise<ResultadoAnalisisIA> {
    if (!this.gemini) {
      this.logger.warn('GEMINI_API_KEY no configurada — usando análisis simulado');
      return this.analisisSimulado(auto);
    }

    try {
      return await this.analizarConGemini(auto);
    } catch (error) {
      this.logger.error('Error al llamar a Gemini, usando análisis simulado', error);
      return this.analisisSimulado(auto);
    }
  }

  // ── Llamada real a Google Gemini ───────────────────────────
  private async analizarConGemini(auto: Auto): Promise<ResultadoAnalisisIA> {
    const modelo = this.gemini!.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Eres un experto tasador de autos usados argentinos. Analizá el siguiente vehículo y respondé ÚNICAMENTE con un JSON válido sin markdown.

Vehículo:
- Marca: ${auto.marca}
- Modelo: ${auto.modelo}
- Año: ${auto.anio}
- Kilometraje: ${auto.kilometraje} km
- Combustible: ${auto.combustible}
- Transmisión: ${auto.transmision}
- Precio solicitado: USD ${auto.precio}
- Ubicación: ${auto.ubicacion}
- Descripción del vendedor: ${auto.descripcion}
- Daños declarados: ${auto.detallesDanios || 'Ninguno'}

Respondé con este JSON exacto:
{
  "estado": "Excelente" | "Buen estado" | "Regular" | "Requiere reparacion",
  "puntaje": (número del 1 al 10 con un decimal),
  "danios": "(descripción breve de daños detectados o 'Sin daños detectados')",
  "rangoPrecioMin": (número entero en USD),
  "rangoPrecioMax": (número entero en USD),
  "resumen": "(resumen de 1-2 oraciones en español)",
  "aprobado": true | false
}
`;

    const resultado = await modelo.generateContent(prompt);
    const texto = resultado.response.text().trim();

    // Limpiar posibles bloques de código markdown
    const jsonLimpio = texto.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonLimpio);

    return {
      estado: parsed.estado || 'Regular',
      puntaje: Number(parsed.puntaje) || 6,
      danios: parsed.danios || 'No determinado',
      rangoPrecioMin: Number(parsed.rangoPrecioMin) || auto.precio * 0.85,
      rangoPrecioMax: Number(parsed.rangoPrecioMax) || auto.precio * 1.1,
      resumen: parsed.resumen || 'Análisis completado.',
      aprobado: parsed.aprobado !== false,
    };
  }

  // ── Análisis simulado cuando no hay API key ────────────────
  private analisisSimulado(auto: Auto): ResultadoAnalisisIA {
    const puntaje = parseFloat(
      (Math.random() * 3 + 6.5).toFixed(1), // entre 6.5 y 9.5
    );
    let estado: string;
    if (puntaje >= 9) estado = 'Excelente';
    else if (puntaje >= 7.5) estado = 'Buen estado';
    else if (puntaje >= 6) estado = 'Regular';
    else estado = 'Requiere reparacion';

    return {
      estado,
      puntaje,
      danios: 'Análisis simulado — sin API key configurada.',
      rangoPrecioMin: Math.round(auto.precio * 0.9),
      rangoPrecioMax: Math.round(auto.precio * 1.08),
      resumen: `Vehículo ${auto.marca} ${auto.modelo} analizado en modo de simulación. Configurá GEMINI_API_KEY para análisis real.`,
      aprobado: puntaje >= 6,
    };
  }
}
