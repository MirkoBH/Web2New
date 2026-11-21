import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

/** Mínimo de fotos por publicación: varias vistas para que la IA vea los daños. */
export const MINIMO_IMAGENES = 3;
export const MAXIMO_IMAGENES = 10;
export const TAMANIO_MAXIMO_BYTES = 10 * 1024 * 1024;
const FORMATOS_ACEPTADOS = new Set(['jpeg', 'png', 'webp', 'heif', 'avif']);
const LADO_MINIMO_PX = 200;
const LADO_GUARDADO_PX = 1600;
/** Tamaño de la copia para la IA; después se arma el mosaico (ia/mosaico.ts). */
const LADO_IA_PX = 768;

export interface ImagenProcesada {
  /** Versión que se guarda en el bucket. */
  guardado: Buffer;
  /** Versión más chica que se manda a la IA. */
  paraIa: Buffer;
}

/**
 * Valida que cada archivo sea realmente una imagen (se lee el contenido, no
 * se confía en la extensión ni en el MIME que manda el navegador), corrige la
 * orientación, quita los metadatos (EXIF con GPS, etc.) y la achica.
 */
export async function procesarImagenes(
  archivos: Express.Multer.File[],
): Promise<ImagenProcesada[]> {
  return Promise.all(archivos.map(procesarImagen));
}

async function procesarImagen(
  archivo: Express.Multer.File,
): Promise<ImagenProcesada> {
  let metadatos: sharp.Metadata;
  try {
    metadatos = await sharp(archivo.buffer).metadata();
  } catch {
    throw new BadRequestException(
      `"${archivo.originalname}" no es una imagen válida`,
    );
  }

  if (!metadatos.format || !FORMATOS_ACEPTADOS.has(metadatos.format)) {
    throw new BadRequestException(
      `"${archivo.originalname}" debe ser JPG, PNG, WEBP o HEIC`,
    );
  }
  if (
    (metadatos.width ?? 0) < LADO_MINIMO_PX ||
    (metadatos.height ?? 0) < LADO_MINIMO_PX
  ) {
    throw new BadRequestException(
      `"${archivo.originalname}" es muy chica (mínimo ${LADO_MINIMO_PX}×${LADO_MINIMO_PX} px)`,
    );
  }

  const [guardado, paraIa] = await Promise.all([
    achicar(archivo.buffer, LADO_GUARDADO_PX, 82),
    achicarParaIa(archivo.buffer),
  ]);
  return { guardado, paraIa };
}

/** Achica una foto (nueva o ya guardada) al tamaño que se le manda a la IA. */
export function achicarParaIa(buffer: Buffer): Promise<Buffer> {
  return achicar(buffer, LADO_IA_PX, 75);
}

function achicar(
  buffer: Buffer,
  lado: number,
  calidad: number,
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(lado, lado, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: calidad, mozjpeg: true })
    .toBuffer();
}
