import { html } from '../core/dom.js';

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 10;
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Conecta un <input type="file"> de fotos: muestra la vista previa y valida
 * cantidad, tipo y peso. El servidor vuelve a validar el contenido real.
 */
export function photoField(input, preview, { required = true } = {}) {
  const urls = [];

  input.addEventListener('change', () => {
    urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
    const files = [...input.files];
    for (const file of files) urls.push(URL.createObjectURL(file));
    preview.innerHTML = html`${urls.map((url, i) => html`<img src="${url}" alt="Foto ${i + 1} elegida">`)}`;
    validate();
  });

  /** Devuelve el mensaje de error o '' si las fotos están bien. */
  function validate() {
    const files = [...input.files];
    let message = '';
    if (files.length === 0 && required) message = `Subí al menos ${MIN_PHOTOS} fotos del auto.`;
    else if (files.length > 0 && files.length < MIN_PHOTOS) message = `Elegiste ${files.length}; hacen falta al menos ${MIN_PHOTOS} fotos.`;
    else if (files.length > MAX_PHOTOS) message = `Podés subir hasta ${MAX_PHOTOS} fotos; elegiste ${files.length}.`;
    else if (files.some((a) => a.type && !ACCEPTED_TYPES.includes(a.type))) message = 'Las fotos tienen que ser JPG, PNG, WEBP o HEIC.';
    else if (files.some((a) => a.size > MAX_SIZE)) message = 'Cada foto puede pesar hasta 10 MB.';
    input.setCustomValidity(message);
    input.dataset.error = message;
    return message;
  }

  return { validate, files: () => [...input.files] };
}
