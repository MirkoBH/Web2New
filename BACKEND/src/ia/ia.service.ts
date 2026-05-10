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

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GROQ_API_KEY');

    if (apiKey && apiKey.trim().length > 0) {
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
    const completion = await this.groq!.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Eres un experto tasador de autos usados argentinos. 
Analizás vehículos y devolvés un JSON con esta estructura exacta:
{
  "estado": "Excelente" | "Buen estado" | "Regular" | "Requiere reparacion",
  "puntaje": número del 1 al 10 con un decimal,
  "danios": "descripción breve de daños detectados o Sin daños detectados",
  "rangoPrecioMin": número entero en USD,
  "rangoPrecioMax": número entero en USD,
  "resumen": "resumen de 1-2 oraciones en español argentino",
  "aprobado": true o false
}
Respondé SOLO con el JSON, sin texto adicional.`,
        },
        {
          role: 'user',
          content: `Analizá este vehículo:
- Marca: ${auto.marca}
- Modelo: ${auto.modelo}
- Año: ${auto.anio}
- Kilometraje: ${auto.kilometraje} km
- Combustible: ${auto.combustible}
- Transmisión: ${auto.transmision}
- Precio solicitado: USD ${auto.precio}
- Ubicación: ${auto.ubicacion}
- Descripción del vendedor: ${auto.descripcion}
- Daños declarados: ${auto.detallesDanios || 'Ninguno'}`,
        },
      ],
    });

    const texto = completion.choices[0]?.message?.content?.trim() || '{}';
    this.logger.log(`Respuesta Groq: ${texto.substring(0, 150)}`);

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
