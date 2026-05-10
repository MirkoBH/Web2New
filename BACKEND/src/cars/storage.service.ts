import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

export interface ArchivoSubido {
  storagePath: string;
  urlPublica: string;
  nombre: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly BUCKET = 'imagenes-autos';

  // Cliente con service_role para operaciones del backend (bypass RLS)
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = `https://${this.config.get<string>('SUPABASE_PROJECT_REF')}.supabase.co`;
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY') ?? '';

    this.supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  // ── Subir una imagen al bucket ─────────────────────────────
  async subirImagen(
    autoId: string,
    buffer: Buffer,
    mimetype: string,
    nombreOriginal: string,
  ): Promise<ArchivoSubido> {
    const ext = extname(nombreOriginal) || `.${mimetype.split('/')[1]}`;
    const nombreArchivo = `${uuidv4()}${ext}`;
    // Estructura: imagenes-autos/{autoId}/{uuid}.ext
    const storagePath = `${autoId}/${nombreArchivo}`;

    const { error } = await this.supabaseAdmin.storage
      .from(this.BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Error subiendo imagen: ${error.message}`);
      throw new InternalServerErrorException(`Error al subir imagen: ${error.message}`);
    }

    // URL pública permanente del bucket público
    const { data } = this.supabaseAdmin.storage
      .from(this.BUCKET)
      .getPublicUrl(storagePath);

    return {
      storagePath,
      urlPublica: data.publicUrl,
      nombre: nombreOriginal,
    };
  }

  // ── Eliminar una imagen del bucket por su path ─────────────
  async eliminarImagen(storagePath: string): Promise<void> {
    const { error } = await this.supabaseAdmin.storage
      .from(this.BUCKET)
      .remove([storagePath]);

    if (error) {
      this.logger.warn(`No se pudo eliminar imagen del bucket: ${error.message}`);
    }
  }

  // ── Eliminar toda la carpeta de un auto en el bucket ───────
  async eliminarCarpetaAuto(autoId: string): Promise<void> {
    const { data, error } = await this.supabaseAdmin.storage
      .from(this.BUCKET)
      .list(autoId);

    if (error || !data?.length) return;

    const paths = data.map((f) => `${autoId}/${f.name}`);
    const { error: delError } = await this.supabaseAdmin.storage
      .from(this.BUCKET)
      .remove(paths);

    if (delError) {
      this.logger.warn(`Error eliminando carpeta del auto ${autoId}: ${delError.message}`);
    }
  }
}
