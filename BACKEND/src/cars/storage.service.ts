import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebSocket = require('ws');

export interface ArchivoSubido {
  storagePath: string;
  urlPublica: string;
  nombre: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly BUCKET = 'imagenes-autos';
  private readonly supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const projectRef = this.config.get<string>('SUPABASE_PROJECT_REF') ?? '';
    const anonKey   = this.config.get<string>('SUPABASE_ANON_KEY') ?? '';
    const url       = `https://${projectRef}.supabase.co`;

    this.supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: WebSocket },
    });
  }

  async subirImagen(
    autoId: string,
    buffer: Buffer,
    mimetype: string,
    nombreOriginal: string,
  ): Promise<ArchivoSubido> {
    const ext = extname(nombreOriginal) || `.${mimetype.split('/')[1]}`;
    const nombreArchivo = `${uuidv4()}${ext}`;
    const storagePath = `${autoId}/${nombreArchivo}`;

    const { error } = await this.supabase.storage
      .from(this.BUCKET)
      .upload(storagePath, buffer, { contentType: mimetype, upsert: false });

    if (error) {
      this.logger.error(`Error subiendo imagen: ${error.message}`);
      throw new InternalServerErrorException(`Error al subir imagen: ${error.message}`);
    }

    const { data } = this.supabase.storage.from(this.BUCKET).getPublicUrl(storagePath);
    return { storagePath, urlPublica: data.publicUrl, nombre: nombreOriginal };
  }

  async eliminarImagen(storagePath: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.BUCKET).remove([storagePath]);
    if (error) this.logger.warn(`No se pudo eliminar imagen: ${error.message}`);
  }

  async eliminarCarpetaAuto(autoId: string): Promise<void> {
    const { data, error } = await this.supabase.storage.from(this.BUCKET).list(autoId);
    if (error || !data?.length) return;
    const paths = data.map((f) => `${autoId}/${f.name}`);
    const { error: delError } = await this.supabase.storage.from(this.BUCKET).remove(paths);
    if (delError) this.logger.warn(`Error eliminando carpeta ${autoId}: ${delError.message}`);
  }
}
