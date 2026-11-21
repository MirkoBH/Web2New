import { html } from '../nucleo/dom.js';

export const MINIMO_FOTOS = 3;
export const MAXIMO_FOTOS = 10;
const TAMANIO_MAXIMO = 10 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Conecta un <input type="file"> de fotos: muestra la vista previa y valida
 * cantidad, tipo y peso. El servidor vuelve a validar el contenido real.
 */
export function campoFotos(input, previa, { obligatorio = true } = {}) {
  const urls = [];

  input.addEventListener('change', () => {
    urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    const archivos = [...input.files];
    for (const archivo of archivos) urls.push(URL.createObjectURL(archivo));
    previa.innerHTML = html`${urls.map((url, i) => html`<img src="${url}" alt="Foto ${i + 1} elegida">`)}`;
    validar();
  });

  /** Devuelve el mensaje de error o '' si las fotos están bien. */
  function validar() {
    const archivos = [...input.files];
    let mensaje = '';
    if (archivos.length === 0 && obligatorio) mensaje = `Subí al menos ${MINIMO_FOTOS} fotos del auto.`;
    else if (archivos.length > 0 && archivos.length < MINIMO_FOTOS) mensaje = `Elegiste ${archivos.length}; hacen falta al menos ${MINIMO_FOTOS} fotos.`;
    else if (archivos.length > MAXIMO_FOTOS) mensaje = `Podés subir hasta ${MAXIMO_FOTOS} fotos; elegiste ${archivos.length}.`;
    else if (archivos.some((a) => a.type && !TIPOS.includes(a.type))) mensaje = 'Las fotos tienen que ser JPG, PNG, WEBP o HEIC.';
    else if (archivos.some((a) => a.size > TAMANIO_MAXIMO)) mensaje = 'Cada foto puede pesar hasta 10 MB.';
    input.setCustomValidity(mensaje);
    input.dataset.error = mensaje;
    return mensaje;
  }

  return { validar, archivos: () => [...input.files] };
}
