// Utilidades de interfaz. Todo texto que viene del usuario o de la API pasa
// por `escapar` antes de insertarse como HTML, para evitar inyección de código (XSS).

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

/** Fragmento de HTML ya escapado. `innerHTML = fragmento` lo convierte a texto. */
class SafeHtml {
  constructor(text) {
    this.text = text;
  }

  toString() {
    return this.text;
  }
}

function toHtml(value) {
  if (value instanceof SafeHtml) return value.text;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  if (value === null || value === undefined) return '';
  return escapeHtml(value);
}

/**
 * Plantilla etiquetada: escapa cada valor interpolado. Los fragmentos hechos
 * con `html` se pueden anidar sin escaparse dos veces; `null` y `undefined`
 * no imprimen nada. Los booleanos se imprimen como texto (para aria-pressed).
 */
export function html(strings, ...values) {
  let result = strings[0];
  values.forEach((value, i) => {
    result += toHtml(value) + strings[i + 1];
  });
  return new SafeHtml(result);
}

/** Inserta un ícono o markup fijo del código (nunca datos del usuario). */
export const raw = (text) => new SafeHtml(text);

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const usd = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numberFormat = new Intl.NumberFormat('es-AR');
const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatUsd = (value) => usd.format(Number(value) || 0).replace(/US\$\s?/, 'USD\u00a0');
export const formatKm = (value) => `${numberFormat.format(Number(value) || 0)} km`;
export const formatNumber = (value) => numberFormat.format(Number(value) || 0);
export const formatDate = (value) => dateFormat.format(new Date(value));

/** Muestra un aviso de Bootstrap dentro de `contenedor`. */
export function showNotice(container, message, type = 'danger') {
  if (!container) return;
  container.innerHTML = html`<div class="alert alert-${type}" role="${type === 'danger' ? 'alert' : 'status'}">${message}</div>`;
  container.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function clearNotice(container) {
  if (container) container.innerHTML = '';
}

/** Lee un parámetro de la URL. */
export function queryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/** Valida los campos con la API de validación del navegador y marca los errores. */
export function validateForm(form) {
  let firstInvalid = null;
  for (const field of form.querySelectorAll('input, select, textarea')) {
    if (!field.name) continue;
    const error = form.querySelector(`#${field.id}-error`);
    const isValid = field.checkValidity();
    field.classList.toggle('is-invalid', !isValid);
    field.setAttribute('aria-invalid', String(!isValid));
    if (error) error.textContent = isValid ? '' : (field.dataset.error || field.validationMessage);
    if (!isValid && !firstInvalid) firstInvalid = field;
  }
  firstInvalid?.focus();
  return !firstInvalid;
}

export const ICONS = {
  arrow:
    '<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  compare:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4v16M16 4v16M4 8h8M12 16h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  menu:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  logo:
    '<svg class="brand__logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 15.5 6.2 8h11.6l4.2 7.5v3H2v-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 12.5h5.5l2-3 3 7 2.5-4H22" fill="none" stroke="#d1001c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
