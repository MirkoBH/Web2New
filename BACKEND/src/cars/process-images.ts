import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

/** Mínimo de fotos por publicación: varias vistas para que la IA vea los daños. */
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 10;
export const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif', 'avif']);
const MIN_SIDE_PX = 200;
const STORED_SIDE_PX = 1600;
/** Tamaño de la copia para la IA; después se arma el mosaico (ai/mosaic.ts). */
const AI_SIDE_PX = 768;

export interface ProcessedImage {
  /** Versión que se guarda en el bucket. */
  stored: Buffer;
  /** Versión más chica que se manda a la IA. */
  forAi: Buffer;
}

/**
 * Valida que cada archivo sea realmente una imagen (se lee el contenido, no
 * se confía en la extensión ni en el MIME que manda el navegador), corrige la
 * orientación, quita los metadatos (EXIF con GPS, etc.) y la achica.
 */
export async function processImages(
  files: Express.Multer.File[],
): Promise<ProcessedImage[]> {
  return Promise.all(files.map(processImage));
}

async function processImage(
  file: Express.Multer.File,
): Promise<ProcessedImage> {
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(file.buffer).metadata();
  } catch {
    throw new BadRequestException(
      `"${file.originalname}" no es una imagen válida`,
    );
  }

  if (!metadata.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new BadRequestException(
      `"${file.originalname}" debe ser JPG, PNG, WEBP o HEIC`,
    );
  }
  if (
    (metadata.width ?? 0) < MIN_SIDE_PX ||
    (metadata.height ?? 0) < MIN_SIDE_PX
  ) {
    throw new BadRequestException(
      `"${file.originalname}" es muy chica (mínimo ${MIN_SIDE_PX}×${MIN_SIDE_PX} px)`,
    );
  }

  const [stored, forAi] = await Promise.all([
    shrink(file.buffer, STORED_SIDE_PX, 82),
    shrinkForAi(file.buffer),
  ]);
  return { stored, forAi };
}

/** Achica una foto (nueva o ya guardada) al tamaño que se le manda a la IA. */
export function shrinkForAi(buffer: Buffer): Promise<Buffer> {
  return shrink(buffer, AI_SIDE_PX, 75);
}

function shrink(
  buffer: Buffer,
  side: number,
  quality: number,
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(side, side, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: quality, mozjpeg: true })
    .toBuffer();
}
