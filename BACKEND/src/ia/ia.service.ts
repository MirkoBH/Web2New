import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface DatosAnalisisAuto {
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  combustible: string;
  transmision: string;
  precio: number;
  ubicacion: string;
  descripcion: string;
  detallesDanios?: string;
}

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

  // ── Analizar con buffers de imágenes (antes de guardar en DB) ─
  async analizarConImagenes(
    datos: DatosAnalisisAuto,
    imagenes: Express.Multer.File[],
  ): Promise<ResultadoAnalisisIA> {
    if (!this.groq) {
      this.logger.warn('Groq no disponible — usando análisis simulado');
      return this.analisisSimulado(datos);
    }

    try {
      this.logger.log(`Analizando: ${datos.marca} ${datos.modelo} ${datos.anio} | Imágenes: ${imagenes.length}`);
      const resultado = await this.llamarGroq(datos, imagenes);
      this.logger.log(`✅ ${resultado.estado} | Puntaje: ${resultado.puntaje} | USD ${resultado.rangoPrecioMin}–${resultado.rangoPrecioMax} | Aprobado: ${resultado.aprobado}`);
      return resultado;
    } catch (error) {
      this.logger.error(`❌ Error Groq: ${error?.message}`);
      return this.analisisSimulado(datos);
    }
  }

  private async llamarGroq(
    datos: DatosAnalisisAuto,
    imagenes: Express.Multer.File[],
  ): Promise<ResultadoAnalisisIA> {
    const tieneImagenes = imagenes.length > 0;
    const modelo = tieneImagenes ? this.MODELO_VISION : this.MODELO_TEXTO;

    // Convertir buffers a base64 para enviar directamente al modelo
    const contenidoUsuario: any[] = [];

    if (tieneImagenes) {
      for (const archivo of imagenes.slice(0, 4)) {
        const base64 = archivo.buffer.toString('base64');
        const mimeType = archivo.mimetype;
        contenidoUsuario.push({
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        });
      }
    }

    contenidoUsuario.push({
      type: 'text',
      text: `${tieneImagenes ? 'Analizá las imágenes y los datos del vehículo:' : 'Analizá los datos del vehículo:'}

DATOS:
- Marca y modelo: ${datos.marca} ${datos.modelo}
- Año: ${datos.anio}
- Kilometraje: ${datos.kilometraje} km
- Combustible: ${datos.combustible}
- Transmisión: ${datos.transmision}
- Precio pedido por el vendedor: USD ${datos.precio}
- Ubicación: ${datos.ubicacion}
- Descripción: "${datos.descripcion}"
- Daños declarados: "${datos.detallesDanios || 'Ninguno'}"
${tieneImagenes ? '\nExaminá cada foto buscando: rayones, abolladuras, golpes, óxido, vidrios rotos, pintura en mal estado, o daños no declarados.' : ''}

Completá el JSON.`,
    });

    const completion = await this.groq!.chat.completions.create({
      model: modelo,
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Sos un perito tasador experto en el mercado de autos usados de Argentina.
Analizás vehículos y devolvés una tasación profesional basada en el valor real de mercado argentino.

PRECIOS DE REFERENCIA EN ARGENTINA (USD, mercado actual):
- Autos compactos (Fiat Argo, VW Polo, Peugeot 208) 2020+: USD 14.000–22.000
- Sedanes medianos (Toyota Corolla, VW Vento) 2018+: USD 18.000–28.000
- SUVs compactas (Jeep Renegade, Renault Duster, VW T-Cross) 2019+: USD 20.000–32.000
- SUVs medianas (Toyota RAV4, VW Tiguan, Jeep Compass) 2018+: USD 30.000–50.000
- SUVs premium (BMW X3/X5, Mercedes GLC, Audi Q5) 2016+: USD 40.000–80.000
- Pickups (Ford Ranger, Toyota Hilux) 2018+: USD 30.000–55.000
- Autos de lujo (BMW Serie 3/5, Mercedes Clase C/E) 2016+: USD 35.000–70.000
- Autos económicos (VW Gol, Chevrolet Classic) 2015–2018: USD 8.000–14.000

AJUSTE POR KILOMETRAJE:
- Menos de 30.000 km: +8%
- 30.001–60.000 km: sin ajuste
- 60.001–100.000 km: -8%
- 100.001–150.000 km: -18%
- Más de 150.000 km: -30%

CRITERIOS DE ESTADO Y PRECIO:
- Sin daños o mínimos (rayón superficial): estado "Excelente", sin descuento al precio
- Daños leves (golpe menor, rayón profundo): estado "Buen estado", -5% a -10% al precio
- Daños moderados (abolladura visible, panel dañado): estado "Regular", -15% a -25%
- Daños graves (choque estructural, múltiples paneles, óxido extendido): estado "Requiere reparacion", -30% a -50%

TODAS LAS PUBLICACIONES SE APRUEBAN. El campo aprobado siempre es true.
El estado "Requiere reparacion" no implica rechazo — significa que el auto tiene daños
graves pero igual puede publicarse con el precio ajustado correspondientemente.

IMPORTANTE: El precio sugerido debe ser el VALOR REAL de mercado en Argentina,
ajustado según el estado real del vehículo.

Devolvés SIEMPRE este JSON sin texto adicional:
{
  "estado": "Excelente" | "Buen estado" | "Regular" | "Requiere reparacion",
  "puntaje": número del 1.0 al 10.0,
  "danios": "descripción detallada de daños visibles o Sin daños detectados",
  "rangoPrecioMin": precio mínimo justo en USD ajustado por daños,
  "rangoPrecioMax": precio máximo justo en USD ajustado por daños,
  "resumen": "2-3 oraciones explicando el estado, los daños detectados y el precio justo",
  "aprobado": true
}`,
        },
        {
          role: 'user',
          content: contenidoUsuario,
        },
      ],
    });

    const texto = completion.choices[0]?.message?.content?.trim() || '{}';
    this.logger.log(`Respuesta: ${texto.substring(0, 200)}`);
    const parsed = JSON.parse(texto);

    return {
      estado:         parsed.estado         || 'Regular',
      puntaje:        Number(parsed.puntaje) || 6,
      danios:         parsed.danios          || 'No determinado',
      rangoPrecioMin: Number(parsed.rangoPrecioMin) || Math.round(datos.precio * 0.85),
      rangoPrecioMax: Number(parsed.rangoPrecioMax) || Math.round(datos.precio * 1.10),
      resumen:        parsed.resumen         || 'Análisis completado.',
      aprobado:       parsed.aprobado !== false,
    };
  }

  private analisisSimulado(datos: DatosAnalisisAuto): ResultadoAnalisisIA {
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
      rangoPrecioMin: Math.round(datos.precio * 0.9),
      rangoPrecioMax: Math.round(datos.precio * 1.08),
      resumen:        `Vehículo ${datos.marca} ${datos.modelo} analizado en modo de simulación.`,
      aprobado:       true, // siempre se publica
    };
  }
}
