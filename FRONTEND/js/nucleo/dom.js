// Utilidades de interfaz. Todo texto que viene del usuario o de la API pasa
// por `escapar` antes de insertarse como HTML, para evitar inyección de código (XSS).

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

/** Fragmento de HTML ya escapado. `innerHTML = fragmento` lo convierte a texto. */
class HtmlSeguro {
  constructor(texto) {
    this.texto = texto;
  }

  toString() {
    return this.texto;
  }
}

function convertir(valor) {
  if (valor instanceof HtmlSeguro) return valor.texto;
  if (Array.isArray(valor)) return valor.map(convertir).join('');
  if (valor === null || valor === undefined) return '';
  return escapar(valor);
}

/**
 * Plantilla etiquetada: escapa cada valor interpolado. Los fragmentos hechos
 * con `html` se pueden anidar sin escaparse dos veces; `null` y `undefined`
 * no imprimen nada. Los booleanos se imprimen como texto (para aria-pressed).
 */
export function html(partes, ...valores) {
  let resultado = partes[0];
  valores.forEach((valor, i) => {
    resultado += convertir(valor) + partes[i + 1];
  });
  return new HtmlSeguro(resultado);
}

/** Inserta un ícono o markup fijo del código (nunca datos del usuario). */
export const crudo = (texto) => new HtmlSeguro(texto);

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

const usd = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat('es-AR');
const fecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatearUsd = (valor) => usd.format(Number(valor) || 0).replace(/US\$\s?/, 'USD\u00a0');
export const formatearKm = (valor) => `${numero.format(Number(valor) || 0)} km`;
export const formatearNumero = (valor) => numero.format(Number(valor) || 0);
export const formatearFecha = (valor) => fecha.format(new Date(valor));

/** Muestra un aviso de Bootstrap dentro de `contenedor`. */
export function mostrarAviso(contenedor, mensaje, tipo = 'danger') {
  if (!contenedor) return;
  contenedor.innerHTML = html`<div class="alert alert-${tipo}" role="${tipo === 'danger' ? 'alert' : 'status'}">${mensaje}</div>`;
  contenedor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export function limpiarAviso(contenedor) {
  if (contenedor) contenedor.innerHTML = '';
}

/** Lee un parámetro de la URL. */
export function parametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

/** Valida los campos con la API de validación del navegador y marca los errores. */
export function validarFormulario(formulario) {
  let primero = null;
  for (const campo of formulario.querySelectorAll('input, select, textarea')) {
    if (!campo.name) continue;
    const error = formulario.querySelector(`#${campo.id}-error`);
    const valido = campo.checkValidity();
    campo.classList.toggle('is-invalid', !valido);
    campo.setAttribute('aria-invalid', String(!valido));
    if (error) error.textContent = valido ? '' : (campo.dataset.error || campo.validationMessage);
    if (!valido && !primero) primero = campo;
  }
  primero?.focus();
  return !primero;
}

export const ICONOS = {
  flecha:
    '<svg class="flecha" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  corazon:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  comparar:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4v16M16 4v16M4 8h8M12 16h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  menu:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  simbolo:
    '<svg class="marca__simbolo" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 15.5 6.2 8h11.6l4.2 7.5v3H2v-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 12.5h5.5l2-3 3 7 2.5-4H22" fill="none" stroke="#d1001c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
