import { formatUsd, html } from '../core/dom.js';

/** Texto corto que compara el precio pedido con el rango de la IA. */
export function priceVerdict(price, min, max) {
  if (price < min) return 'Precio por debajo del rango estimado';
  if (price > max) return 'Precio por encima del rango estimado';
  return 'Precio dentro del rango estimado';
}

/** Punto de color + estado de la IA. */
export function conditionBadge(condition) {
  const text = condition === 'Requiere reparacion' ? 'Requiere reparación' : condition;
  return html`<span class="condition" data-condition="${condition}">${text}</span>`;
}

/**
 * Panel con la tasación completa de un auto (detalle y portada).
 * La barra muestra el rango de la IA y una marca roja en el precio pedido.
 */
export function appraisalPanel(car, { title = 'Tasación por IA', level = 'h2' } = {}) {
  const { aiAnalysis: ai, price } = car;
  const header =
    level === 'h3' ? html`<h3>${title}</h3>` : html`<h2 class="h3">${title}</h2>`;

  return html`
    <section class="panel appraisal" aria-label="${title}">
      <div class="appraisal__header">
        <div>
          ${header}
          <p class="mt-2">${conditionBadge(ai.condition)}</p>
        </div>
        <p class="score" aria-label="Puntaje ${ai.score} de 10">${ai.score}<small>/10</small></p>
      </div>

      <div class="range" data-range data-min="${ai.minPrice}" data-max="${ai.maxPrice}" data-price="${price}">
        <p class="label">Rango de precio de mercado</p>
        <div class="range__bar" aria-hidden="true">
          <span class="range__band"></span><span class="range__marker"></span>
        </div>
        <div class="range__ends"><span>${formatUsd(ai.minPrice)}</span><span>${formatUsd(ai.maxPrice)}</span></div>
        <p class="mt-3">${priceVerdict(price, ai.minPrice, ai.maxPrice)}: se piden ${formatUsd(price)}.</p>
        <div class="legend mt-2"><span>Rango de la IA</span><span class="legend__asked">Precio pedido</span></div>
      </div>

      ${ai.damages !== undefined ? html`<p class="label">Daños detectados</p><p class="mb-4">${ai.damages}</p>` : ''}
      ${ai.summary !== undefined ? html`<p class="label">Resumen</p><p>${ai.summary}</p>` : ''}
    </section>`;
}

/**
 * Ubica el tramo y la marca de cada barra de rango. Se hace por CSSOM
 * (setProperty) porque la política de seguridad no permite estilos en línea.
 */
export function drawRanges(root = document) {
  for (const range of root.querySelectorAll('[data-range]')) {
    const min = Number(range.dataset.min);
    const max = Number(range.dataset.max);
    const price = Number(range.dataset.price);
    // La escala va de un 20% por debajo del menor a un 20% por encima del mayor.
    const rangeStart = Math.min(min, price) * 0.8;
    const rangeEnd = Math.max(max, price) * 1.2;
    const toPercent = (value) => `${(((value - rangeStart) / (rangeEnd - rangeStart)) * 100).toFixed(2)}%`;
    const bar = range.querySelector('.range__bar');
    bar.style.setProperty('--range-start', toPercent(min));
    bar.style.setProperty('--range-width', `${(((max - min) / (rangeEnd - rangeStart)) * 100).toFixed(2)}%`);
    bar.style.setProperty('--asked', toPercent(price));
  }
}
