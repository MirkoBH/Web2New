import { raw, formatKm, formatUsd, html, ICONS } from '../core/dom.js';
import {
  toggleCompared,
  toggleFavorite,
  MAX_COMPARE,
  getCompared,
  getFavorites,
  getMode,
  getSession,
} from '../core/session.js';
import { conditionBadge } from './appraisal.js';

/**
 * Tarjeta de un auto del listado. El título es el enlace al detalle y cubre
 * toda la tarjeta; los botones de favorito y comparar quedan por encima.
 */
export function carCard(car) {
  const session = getSession();
  const isOwn = session?.id === car.sellerId;
  const title = `${car.brand} ${car.model} ${car.year}`;

  const favorite =
    !isOwn && getMode() === 'buyer'
      ? html`<button type="button" class="btn-icon" data-favorite="${car.id}"
          aria-pressed="${getFavorites().includes(car.id)}"
          aria-label="Guardar ${title} en favoritos">${raw(ICONS.heart)}</button>`
      : '';
  const compare = !isOwn
    ? html`<button type="button" class="btn-icon" data-compare="${car.id}"
        aria-pressed="${getCompared().includes(car.id)}"
        aria-label="Comparar ${title}">${raw(ICONS.compare)}</button>`
    : '';

  const photo = car.mainImage
    ? html`<img src="${car.mainImage}" alt="${title}" loading="lazy" width="400" height="300">`
    : '';

  return html`
    <article class="car-card">
      <div class="car-card__photo">${photo}</div>
      <div class="car-card__actions">${favorite}${compare}</div>
      <div class="car-card__body">
        <h3 class="car-card__title">
          <a class="car-card__link" href="detail.html?id=${car.id}">${title}</a>
        </h3>
        <p class="car-card__meta">${formatKm(car.mileage)} · ${car.transmission === 'Automatico' ? 'Automático' : 'Manual'} · ${car.location}</p>
        <div class="car-card__footer">
          <span class="price">${formatUsd(car.price)}</span>
          ${conditionBadge(car.aiAnalysis.condition)}
        </div>
      </div>
    </article>`;
}

/** Dibuja una grilla de tarjetas y conecta los botones. */
export function renderGrid(container, cars, { columns = 'col-sm-6 col-lg-4' } = {}) {
  container.innerHTML = html`${cars.map((car) => html`<div class="${columns}">${carCard(car)}</div>`)}`;
  bindCardActions(container);
}

/**
 * Favoritos y comparador requieren cuenta: sin sesión se va a ingresar.
 * Se usa delegación de eventos para no registrar un listener por botón.
 */
export function bindCardActions(container) {
  if (container.dataset.actions) return;
  container.dataset.actions = 'yes';
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-favorite], [data-compare]');
    if (!button) return;

    if (!getSession()) {
      const returnTo = encodeURIComponent(location.pathname.split('/').pop() + location.search);
      location.href = `login.html?returnTo=${returnTo}`;
      return;
    }

    if (button.dataset.favorite) {
      toggleFavorite(button.dataset.favorite);
      button.setAttribute('aria-pressed', String(getFavorites().includes(button.dataset.favorite)));
      return;
    }

    const id = button.dataset.compare;
    if (!toggleCompared(id)) {
      document.dispatchEvent(
        new CustomEvent('compare:full', { detail: `Podés comparar hasta ${MAX_COMPARE} autos. Quitá uno para sumar otro.` }),
      );
      return;
    }
    button.setAttribute('aria-pressed', String(getCompared().includes(id)));
    document.dispatchEvent(new CustomEvent('compare:change'));
  });
}
