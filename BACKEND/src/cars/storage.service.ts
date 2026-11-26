import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClient } from '@supabase/storage-js';
import { randomUUID } from 'node:crypto';
import type { EnvironmentVariables } from '../config/validate-environment';

const BUCKET = 'imagenes-autos';

export interface StoredFile {
  filePath: string;
  publicUrl: string;
}

/**
 * Sube y borra fotos en Supabase Storage con la clave secreta del servidor.
 * El navegador nunca escribe en el bucket: solo lee las URLs públicas.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: StorageClient;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const url = config.get('SUPABASE_URL', { infer: true });
    const key = config.get('SUPABASE_SECRET_KEY', { infer: true });
    this.client = new StorageClient(`${url}/storage/v1`, {
      apikey: key,
      Authorization: `Bearer ${key}`,
    });
  }

  async upload(carId: string, content: Buffer): Promise<StoredFile> {
    const filePath = `${carId}/${randomUUID()}.jpg`;
    const { error } = await this.client.from(BUCKET).upload(filePath, content, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) {
      throw new Error(`No se pudo subir la imagen: ${error.message}`);
    }
    const { data } = this.client.from(BUCKET).getPublicUrl(filePath);
    return { filePath, publicUrl: data.publicUrl };
  }

  /** Borra archivos del bucket. Si falla solo lo registra: no es crítico. */
  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.client.from(BUCKET).remove(paths);
    if (error) {
      this.logger.warn(
        `No se pudieron borrar ${paths.length} archivos: ${error.message}`,
      );
    }
  }
}
