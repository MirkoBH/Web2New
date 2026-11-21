import sharp from 'sharp';

const COLUMNAS = 3;
const ANCHO_CELDA = 512;
const ALTO_CELDA = 384;
export const MAXIMO_FOTOS_MOSAICO = 9;

/**
 * Une las fotos en una sola imagen (grilla de hasta 3×3).
 * Groq cobra una cantidad fija de tokens por imagen y la cuenta gratuita
 * admite ~7.000 por minuto: mandar las fotos sueltas no entra, pero un
 * mosaico sí, y así la IA ve todas las fotos del auto a la vez.
 */
export async function armarMosaico(fotos: Buffer[]): Promise<Buffer> {
  const elegidas = fotos.slice(0, MAXIMO_FOTOS_MOSAICO);
  const columnas = Math.min(COLUMNAS, elegidas.length);
  const filas = Math.ceil(elegidas.length / columnas);

  const celdas = await Promise.all(
    elegidas.map((foto) =>
      sharp(foto)
        .resize(ANCHO_CELDA, ALTO_CELDA, {
          fit: 'contain',
          background: '#000000',
        })
        .jpeg()
        .toBuffer(),
    ),
  );

  return sharp({
    create: {
      width: columnas * ANCHO_CELDA,
      height: filas * ALTO_CELDA,
      channels: 3,
      background: '#000000',
    },
  })
    .composite(
      celdas.map((celda, i) => ({
        input: celda,
        left: (i % columnas) * ANCHO_CELDA,
        top: Math.floor(i / columnas) * ALTO_CELDA,
      })),
    )
    .jpeg({ quality: 80 })
    .toBuffer();
}
