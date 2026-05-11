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

  private readonly MODELO_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';
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
      this.logger.log(`Iniciando análisis IA para: ${auto.marca} ${auto.modelo} ${auto.anio}`);
      const resultado = await this.analizarConGroq(auto);
      this.logger.log(`✅ Análisis completado — ${resultado.estado} | Puntaje: ${resultado.puntaje} | Precio sugerido: USD ${resultado.rangoPrecioMin}–${resultado.rangoPrecioMax} | Aprobado: ${resultado.aprobado}`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Error Groq: ${error?.message}`);
      return this.analisisSimulado(auto);
    }
  }

  private async analizarConGroq(auto: Auto): Promise<ResultadoAnalisisIA> {
    const urlsImagenes: string[] = (auto.imagenes || [])
      .sort((a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((img: any) => img.urlPublica || img)
      .filter((url: string) => typeof url === 'string' && url.startsWith('http'))
      .slice(0, 4);

    const tieneImagenes = urlsImagenes.length > 0;
    const modelo = tieneImagenes ? this.MODELO_VISION : this.MODELO_TEXTO;

    this.logger.log(`Modelo: ${modelo} | Imágenes: ${urlsImagenes.length}`);

    const contenidoUsuario: any[] = [];

    if (tieneImagenes) {
      for (const url of urlsImagenes) {
        contenidoUsuario.push({ type: 'image_url', image_url: { url } });
      }
    }

    contenidoUsuario.push({
      type: 'text',
      text: `Analizá ${tieneImagenes ? 'las imágenes y ' : ''}los datos de este vehículo:

DATOS DEL VEHÍCULO:
- Marca y modelo: ${auto.marca} ${auto.modelo}
- Año: ${auto.anio}
- Kilometraje: ${auto.kilometraje} km
- Combustible: ${auto.combustible}
- Transmisión: ${auto.transmision}
- Precio pedido por el vendedor: USD ${auto.precio}
- Ubicación: ${auto.ubicacion}
- Descripción del vendedor: "${auto.descripcion}"
- Daños declarados por el vendedor: "${auto.detallesDanios || 'Ninguno'}"
${tieneImagenes ? '\nExaminá cada foto buscando: rayones, abolladuras, golpes, óxido, vidrios rotos, deformaciones, pintura en mal estado, o cualquier daño no declarado.' : ''}

Completá el JSON solicitado.`,
    });

    const completion = await this.groq!.chat.completions.create({
      model: modelo,
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Sos un perito tasador experto en el mercado de autos usados de Argentina con más de 20 años de experiencia.
Tu tarea es analizar vehículos y devolver una tasación profesional basada en:
1. El valor real de mercado en Argentina (precios en USD, mercado informal/blue)
2. El estado físico del vehículo según las imágenes y la descripción
3. El kilometraje y año del vehículo
4. Los daños visibles o declarados

CRITERIOS DE PRECIO DE MERCADO ARGENTINO (referencias orientativas en USD):
- Autos compactos (Fiat Argo, VW Polo, Peugeot 208) 2020+: USD 14.000–22.000
- Sedanes medianos (Toyota Corolla, VW Vento) 2018+: USD 18.000–28.000
- SUVs compactas (Jeep Renegade, Renault Duster, VW T-Cross) 2019+: USD 20.000–32.000
- SUVs medianas (Toyota RAV4, VW Tiguan, Jeep Compass) 2018+: USD 30.000–50.000
- SUVs premium (BMW X3/X5, Mercedes GLC, Audi Q5) 2016+: USD 40.000–80.000
- Pickups (Ford Ranger, Toyota Hilux) 2018+: USD 30.000–55.000
- Autos de lujo (BMW Serie 3/5, Mercedes Clase C/E) 2016+: USD 35.000–70.000
- Autos económicos (VW Gol, Chevrolet Classic) 2015–2018: USD 8.000–14.000

AJUSTE POR KILOMETRAJE:
- Menos de 30.000 km: +8% sobre precio base
- 30.001–60.000 km: precio base (sin ajuste)
- 60.001–100.000 km: -8% sobre precio base
- 100.001–150.000 km: -18% sobre precio base
- Más de 150.000 km: -30% sobre precio base

CRITERIOS DE DAÑOS Y APROBACIÓN:
- Sin daños o daños mínimos (rayón superficial): estado "Excelente" o "Buen estado", aprobado: true
- Daños leves (golpe menor, rayón profundo): restar 5–10% al precio, aprobado: true
- Daños moderados (abolladura visible, pintura dañada en panel): restar 15–25% al precio, aprobado: true
- Daños graves (choque estructural, múltiples paneles dañados, óxido extendido): restar 30–50% al precio, aprobado: false
- Inconsistencia grave (descripción no coincide con imágenes, posible fraude): aprobado: false

IMPORTANTE: El precio sugerido debe reflejar el VALOR REAL DE MERCADO en Argentina, 
independientemente del precio pedido por el vendedor. Si el vendedor pide mucho menos 
o mucho más del valor real, el rangoPrecioMin y rangoPrecioMax deben reflejar el precio 
justo de mercado, no el precio del vendedor.

Devolvés SIEMPRE este JSON exacto sin texto adicional:
{
  "estado": "Excelente" | "Buen estado" | "Regular" | "Requiere reparacion",
  "puntaje": número del 1.0 al 10.0,
  "danios": "descripción detallada de daños encontrados en las imágenes, o Sin daños detectados",
  "rangoPrecioMin": precio mínimo justo en USD según mercado argentino real,
  "rangoPrecioMax": precio máximo justo en USD según mercado argentino real,
  "resumen": "resumen profesional de 2-3 oraciones en español argentino explicando el estado, el precio sugerido y por qué",
  "aprobado": true o false según criterios de daños
}`,
        },
        {
          role: 'user',
          content: contenidoUsuario,
        },
      ],
    });

    const texto = completion.choices[0]?.message?.content?.trim() || '{}';
    this.logger.log(`Respuesta Groq: ${texto.substring(0, 300)}`);

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
