import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClient } from '@supabase/storage-js';
import { randomUUID } from 'node:crypto';
import type { VariablesEntorno } from '../configuracion/validar-entorno';

const BUCKET = 'imagenes-autos';

export interface ArchivoSubido {
  rutaArchivo: string;
  urlPublica: string;
}

/**
 * Sube y borra fotos en Supabase Storage con la clave secreta del servidor.
 * El navegador nunca escribe en el bucket: solo lee las URLs públicas.
 */
@Injectable()
export class AlmacenamientoService {
  private readonly logger = new Logger(AlmacenamientoService.name);
  private readonly cliente: StorageClient;

  constructor(configuracion: ConfigService<VariablesEntorno, true>) {
    const url = configuracion.get('SUPABASE_URL', { infer: true });
    const clave = configuracion.get('SUPABASE_SECRET_KEY', { infer: true });
    this.cliente = new StorageClient(`${url}/storage/v1`, {
      apikey: clave,
      Authorization: `Bearer ${clave}`,
    });
  }

  async subir(autoId: string, contenido: Buffer): Promise<ArchivoSubido> {
    const rutaArchivo = `${autoId}/${randomUUID()}.jpg`;
    const { error } = await this.cliente
      .from(BUCKET)
      .upload(rutaArchivo, contenido, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (error) {
      throw new Error(`No se pudo subir la imagen: ${error.message}`);
    }
    const { data } = this.cliente.from(BUCKET).getPublicUrl(rutaArchivo);
    return { rutaArchivo, urlPublica: data.publicUrl };
  }

  /** Borra archivos del bucket. Si falla solo lo registra: no es crítico. */
  async eliminar(rutas: string[]): Promise<void> {
    if (rutas.length === 0) return;
    const { error } = await this.cliente.from(BUCKET).remove(rutas);
    if (error) {
      this.logger.warn(
        `No se pudieron borrar ${rutas.length} archivos: ${error.message}`,
      );
    }
  }
}
