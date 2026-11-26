import { carsApi } from '../core/api.js';
import { $, raw, formatKm, formatUsd, html, ICONS } from '../core/dom.js';
import { MAX_COMPARE, getCompared, getSession, removeCompared } from '../core/session.js';
import { conditionBadge } from './appraisal.js';

/**
 * Panel lateral del comparador (offcanvas de Bootstrap) y el botón flotante
 * que lo abre. Solo existe con sesión iniciada.
 */
export function renderComparator() {
  if (!getSession()) return;
  const mount = document.createElement('div');
  mount.innerHTML = html`
    <button type="button" class="btn-ap btn-ap--secondary compare-button" data-bs-toggle="offcanvas"
      data-bs-target="#comparator" aria-controls="comparator" hidden>
      ${raw(ICONS.compare.replace('<svg', '<svg width="18" height="18"'))}<span data-count>Comparar</span>
    </button>
    <div class="offcanvas offcanvas-end comparator" tabindex="-1" id="comparator" aria-labelledby="comparator-title">
      <div class="offcanvas-header">
        <h2 class="h3" id="comparator-title">Comparar autos</h2>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar comparador"></button>
      </div>
      <div class="offcanvas-body" id="comparator-content" aria-live="polite"></div>
    </div>`;
  document.body.append(...mount.children);

  $('#comparator').addEventListener('show.bs.offcanvas', loadComparison);
  $('#comparator-content').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    removeCompared(button.dataset.remove);
    document.dispatchEvent(new CustomEvent('compare:change'));
    for (const b of document.querySelectorAll(`[data-compare="${CSS.escape(button.dataset.remove)}"]`)) {
      b.setAttribute('aria-pressed', 'false');
    }
    loadComparison();
  });
  document.addEventListener('compare:change', updateButton);
  document.addEventListener('compare:full', (event) => {
    updateButton();
    window.bootstrap?.Offcanvas.getOrCreateInstance('#comparator').show();
    const notice = $('#comparator-notice');
    if (notice) notice.textContent = event.detail;
  });
  updateButton();
}

function updateButton() {
  const button = $('.compare-button');
  if (!button) return;
  const count = getCompared().length;
  button.hidden = count === 0;
  button.querySelector('[data-count]').textContent = `Comparar (${count}/${MAX_COMPARE})`;
}

async function loadComparison() {
  const content = $('#comparator-content');
  const ids = getCompared();
  if (ids.length < MAX_COMPARE) {
    content.innerHTML = html`<p id="comparator-notice" class="mb-4"></p>
      <p>Elegí ${MAX_COMPARE - ids.length === 1 ? 'un auto más' : `${MAX_COMPARE} autos`} con el botón de comparar de cada tarjeta.</p>
      ${ids.length ? html`<p class="mt-3"><button type="button" class="link border-0" data-remove="${ids[0]}">Quitar el auto elegido</button></p>` : ''}
      <p class="mt-s6"><a class="btn-ap btn-ap--secondary" href="listing.html">Ver autos</a></p>`;
    return;
  }

  content.innerHTML = html`<div class="skeleton" aria-label="Cargando comparación"></div>`;
  const cars = (await Promise.all(ids.map((id) => carsApi.get(id).catch(() => null))));
  // Un auto borrado por su vendedor se saca de la lista.
  cars.forEach((car, i) => { if (!car) removeCompared(ids[i]); });
  const validCars = cars.filter(Boolean);
  if (validCars.length < MAX_COMPARE) {
    updateButton();
    return loadComparison();
  }

  const row = (title, value) =>
    html`<tr><th scope="row">${title}</th>${validCars.map((a) => html`<td>${value(a)}</td>`)}</tr>`;

  content.innerHTML = html`
    <p id="comparator-notice" class="mb-3"></p>
    <table class="compare-table">
      <thead><tr><th scope="col"><span class="visually-hidden">Dato</span></th>
        ${validCars.map((a) => html`<th scope="col"><a class="link" href="detail.html?id=${a.id}">${a.brand} ${a.model}</a></th>`)}
      </tr></thead>
      <tbody>
        ${row('Precio', (a) => formatUsd(a.price))}
        ${row('Año', (a) => a.year)}
        ${row('Kilometraje', (a) => formatKm(a.mileage))}
        ${row('Fuel', (a) => (a.fuel === 'Hybrid' ? 'Híbrido' : a.fuel === 'Electric' ? 'Eléctrico' : a.fuel))}
        ${row('Transmisión', (a) => (a.transmission === 'Automatic' ? 'Automático' : 'Manual'))}
        ${row('Ubicación', (a) => a.location)}
        ${row('Daños declarados', (a) => a.damageDetails || 'Ninguno')}
        ${row('Estado según la IA', (a) => conditionBadge(a.aiAnalysis.condition))}
        ${row('Puntaje IA', (a) => `${a.aiAnalysis.score}/10`)}
        ${row('Rango IA', (a) => `${formatUsd(a.aiAnalysis.minPrice)} – ${formatUsd(a.aiAnalysis.maxPrice)}`)}
        ${row('Daños detectados', (a) => a.aiAnalysis.damages)}
        <tr><th scope="row"></th>${validCars.map((a) => html`<td><button type="button" class="btn-ap btn-ap--secondary btn-ap--small" data-remove="${a.id}">Quitar</button></td>`)}</tr>
      </tbody>
    </table>`;
}
