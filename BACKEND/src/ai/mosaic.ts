import sharp from 'sharp';

const COLUMNS = 3;
const CELL_WIDTH = 512;
const CELL_HEIGHT = 384;
export const MAX_MOSAIC_PHOTOS = 9;

/**
 * Une las fotos en una sola imagen (grilla de hasta 3×3).
 * Groq cobra una cantidad fija de tokens por imagen y la cuenta gratuita
 * admite ~7.000 por minuto: mandar las fotos sueltas no entra, pero un
 * mosaico sí, y así la IA ve todas las fotos del auto a la vez.
 */
export async function buildMosaic(photos: Buffer[]): Promise<Buffer> {
  const selectedPhotos = photos.slice(0, MAX_MOSAIC_PHOTOS);
  const columns = Math.min(COLUMNS, selectedPhotos.length);
  const rows = Math.ceil(selectedPhotos.length / columns);

  const cells = await Promise.all(
    selectedPhotos.map((photo) =>
      sharp(photo)
        .resize(CELL_WIDTH, CELL_HEIGHT, {
          fit: 'contain',
          background: '#000000',
        })
        .jpeg()
        .toBuffer(),
    ),
  );

  return sharp({
    create: {
      width: columns * CELL_WIDTH,
      height: rows * CELL_HEIGHT,
      channels: 3,
      background: '#000000',
    },
  })
    .composite(
      cells.map((cell, i) => ({
        input: cell,
        left: (i % columns) * CELL_WIDTH,
        top: Math.floor(i / columns) * CELL_HEIGHT,
      })),
    )
    .jpeg({ quality: 80 })
    .toBuffer();
}
