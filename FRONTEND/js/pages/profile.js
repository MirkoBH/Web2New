import { conditionBadge } from '../components/appraisal.js';
import { renderGrid } from '../components/car-card.js';
import { carsApi, inquiriesApi, usersApi } from '../core/api.js';
import {
  $,
  $$,
  formatDate,
  formatKm,
  formatUsd,
  html,
  showNotice,
  queryParam,
  validateForm,
} from '../core/dom.js';
import { initPage } from '../core/page.js';
import { updateSession, requireSession, getFavorites, getMode, removeFavorite } from '../core/session.js';

const session = requireSession();
const INQUIRIES_REFRESH_MS = 60_000;
const loadingSkeleton = html`<div class="skeleton" aria-label="Cargando"></div>`;
const loadError = (error) => html`<div class="alert alert-danger" role="alert">${error.message}</div>`;

if (session) {
  initPage({ current: 'panel' });
  const mode = getMode();
  $('#panel-mode').textContent = mode === 'seller' ? 'Modo vendedor' : 'Modo comprador';
  $('#panel-title').textContent = `Hola, ${session.name.split(' ')[0]}`;
  if (queryParam('deleted')) showNotice($('#alerts'), 'La publicación se eliminó.', 'success');

  const tabs =
    mode === 'seller'
      ? [
          { id: 'listings', title: 'Mis publicaciones', load: loadListings },
          { id: 'inquiries', title: 'Consultas recibidas', load: loadInquiries },
          { id: 'account', title: 'Mis datos', load: loadAccount },
        ]
      : [
          { id: 'favorites', title: 'Favoritos', load: loadFavorites },
          { id: 'account', title: 'Mis datos', load: loadAccount },
        ];
  buildTabs(tabs);
}

// ── Pestañas accesibles (role tablist) ──────────────────────────────

function buildTabs(tabs) {
  $('#tabs').innerHTML = html`${tabs.map((p, i) => html`<button type="button" role="tab" id="tab-${p.id}"
    aria-controls="panel-${p.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${p.title}</button>`)}`;
  $('#panels').innerHTML = html`${tabs.map((p, i) => html`<section role="tabpanel" id="panel-${p.id}"
    aria-labelledby="tab-${p.id}" ${i === 0 ? '' : html`hidden`}></section>`)}`;

  const loaded = new Set();
  const show = (id) => {
    for (const button of $$('[role="tab"]')) {
      const activeIndex = button.id === `tab-${id}`;
      button.setAttribute('aria-selected', String(activeIndex));
      button.tabIndex = activeIndex ? 0 : -1;
    }
    for (const panel of $$('[role="tabpanel"]')) panel.hidden = panel.id !== `panel-${id}`;
    if (!loaded.has(id)) {
      loaded.add(id);
      tabs.find((p) => p.id === id).load($(`#panel-${id}`));
    }
  };

  $('#tabs').addEventListener('click', (event) => {
    const button = event.target.closest('[role="tab"]');
    if (button) show(button.id.replace('tab-', ''));
  });
  $('#tabs').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const buttons = $$('[role="tab"]');
    const current = buttons.indexOf(document.activeElement);
    const next = buttons[(current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
    next.focus();
    show(next.id.replace('tab-', ''));
  });

  const initialTab = tabs.some((p) => p.id === location.hash.slice(1)) ? location.hash.slice(1) : tabs[0].id;
  show(initialTab);
}

// ── Vendedor: publicaciones ─────────────────────────────────────────

async function loadListings(panel) {
  panel.innerHTML = loadingSkeleton;
  try {
    const cars = await carsApi.listMine();
    if (cars.length === 0) {
      panel.innerHTML = html`<div class="empty"><h2 class="h3">Todavía no publicaste autos</h2>
        <p class="mb-4">Subí 3 fotos o más y la IA tasa tu auto al publicarlo.</p>
        <a class="btn-ap btn-ap--primary" href="publish.html">Publicar mi auto</a></div>`;
      return;
    }
    panel.innerHTML = html`<h2 class="visually-hidden">Mis publicaciones</h2>
      ${cars.map((car) => html`<article class="my-car">
        ${car.mainImage ? html`<img src="${car.mainImage}" alt="" loading="lazy">` : html`<span></span>`}
        <div>
          <h3 class="car-card__title"><a class="link" href="detail.html?id=${car.id}">${car.brand} ${car.model} ${car.year}</a></h3>
          <p class="car-card__meta mt-1">${formatUsd(car.price)} · ${formatKm(car.mileage)} · Publicado el ${formatDate(car.createdAt)}</p>
          <p class="mt-1">${conditionBadge(car.aiAnalysis.condition)}</p>
        </div>
        <div class="button-row">
          <a class="btn-ap btn-ap--secondary btn-ap--small" href="edit.html?id=${car.id}">Editar</a>
          <a class="btn-ap btn-ap--secondary btn-ap--small" href="detail.html?id=${car.id}">Ver aviso</a>
        </div>
      </article>`)}
      <p class="mt-s6"><a class="btn-ap btn-ap--primary" href="publish.html">Publicar mi auto</a></p>`;
  } catch (error) {
    panel.innerHTML = loadError(error);
  }
}

// ── Vendedor: consultas recibidas (se actualizan cada minuto) ──────

async function loadInquiries(panel) {
  panel.innerHTML = loadingSkeleton;
  panel.addEventListener('submit', answer);
  await refreshInquiries(panel);
  setInterval(() => {
    // No se refresca mientras el vendedor está escribiendo una respuesta.
    if (!panel.hidden && !panel.contains(document.activeElement)) refreshInquiries(panel);
  }, INQUIRIES_REFRESH_MS);
}

async function refreshInquiries(panel) {
  try {
    const inquiries = await inquiriesApi.listReceived();
    const pending = inquiries.filter((c) => !c.answer).length;
    $('#tab-inquiries').textContent = pending ? `Consultas recibidas (${pending})` : 'Consultas recibidas';
    if (inquiries.length === 0) {
      panel.innerHTML = html`<div class="empty"><h2 class="h3">Sin consultas por ahora</h2><p>Cuando un comprador pregunte por uno de tus autos, aparece acá.</p></div>`;
      return;
    }
    panel.innerHTML = html`<h2 class="visually-hidden">Consultas recibidas</h2>
      <p class="muted mb-4" aria-live="polite">${pending === 1 ? '1 consulta sin responder' : `${pending} consultas sin responder`}. La lista se actualiza sola cada minuto.</p>
      ${inquiries.map((c) => html`<article class="inquiry">
        <p class="inquiry__meta"><a class="link" href="detail.html?id=${c.car.id}">${c.car.brand} ${c.car.model} ${c.car.year}</a> · ${c.buyer.name} · ${formatDate(c.createdAt)}</p>
        <p>${c.question}</p>
        ${c.answer
          ? html`<p class="inquiry__answer"><span class="label d-block">Tu respuesta</span>${c.answer}</p>`
          : html`<form class="mt-3" data-answer="${c.id}" novalidate>
              <label class="form-label" for="answer-${c.id}">Tu respuesta</label>
              <textarea class="form-control" id="answer-${c.id}" name="answer" rows="2" required minlength="2" maxlength="500"
                aria-describedby="answer-${c.id}-error" data-error="Escribí una respuesta."></textarea>
              <p class="invalid-feedback" id="answer-${c.id}-error"></p>
              <button class="btn-ap btn-ap--secondary btn-ap--small mt-2" type="submit">Responder</button>
            </form>`}
      </article>`)}`;
  } catch (error) {
    panel.innerHTML = loadError(error);
  }
}

async function answer(event) {
  const form = event.target.closest('[data-answer]');
  if (!form) return;
  event.preventDefault();
  if (!validateForm(form)) return;
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    await inquiriesApi.answer(form.dataset.answer, form.answer.value.trim());
    await refreshInquiries($('#panel-inquiries'));
  } catch (error) {
    form.querySelector('.invalid-feedback').textContent = error.message;
    button.disabled = false;
  }
}

// ── Comprador: favoritos ────────────────────────────────────────────

async function loadFavorites(panel) {
  const ids = getFavorites();
  if (ids.length === 0) {
    panel.innerHTML = html`<div class="empty"><h2 class="h3">No guardaste favoritos</h2>
      <p class="mb-4">Tocá el corazón de un auto para guardarlo acá y compararlo después.</p>
      <a class="btn-ap btn-ap--secondary" href="listing.html">Ver autos</a></div>`;
    return;
  }
  panel.innerHTML = loadingSkeleton;
  const cars = await Promise.all(ids.map((id) => carsApi.get(id).catch(() => null)));
  // Los autos que el vendedor borró se sacan de la lista.
  cars.forEach((car, i) => { if (!car) removeFavorite(ids[i]); });
  const available = cars.filter(Boolean).map((car) => ({ ...car, mainImage: car.images[0]?.url ?? null }));
  if (available.length === 0) return loadFavorites(panel);

  panel.innerHTML = html`<h2 class="visually-hidden">Favoritos</h2><p class="muted mb-4">Usá el botón de comparar de dos autos para verlos lado a lado.</p><div class="row g-4"></div>`;
  renderGrid(panel.querySelector('.row'), available);
}

// ── Datos de la cuenta ──────────────────────────────────────────────

async function loadAccount(panel) {
  panel.innerHTML = loadingSkeleton;
  let profile;
  try {
    profile = await usersApi.getProfile();
  } catch (error) {
    panel.innerHTML = loadError(error);
    return;
  }
  panel.innerHTML = html`<div class="form-narrow">
    <h2 class="h3 mb-4">Mis datos</h2>
    <form id="account-form" novalidate>
      <div class="mb-4">
        <label class="form-label" for="email">Email</label>
        <input class="form-control" id="email" type="email" value="${profile.email}" readonly aria-describedby="email-help">
        <p class="form-text" id="email-help">El email no se puede cambiar.</p>
      </div>
      <div class="mb-4">
        <label class="form-label" for="name">Nombre y apellido</label>
        <input class="form-control" id="name" name="name" type="text" value="${profile.name}" required minlength="3" maxlength="80"
          autocomplete="name" aria-describedby="name-error" data-error="Escribí tu nombre (al menos 3 letras).">
        <p class="invalid-feedback" id="name-error"></p>
      </div>
      <div class="mb-4">
        <label class="form-label" for="phone">Teléfono (opcional)</label>
        <input class="form-control" id="phone" name="phone" type="tel" value="${profile.phone ?? ''}" maxlength="30"
          pattern="[+0-9 \\(\\)\\-]{8,30}" autocomplete="tel" aria-describedby="phone-error" data-error="Usá solo números, espacios y + ( ) -, mínimo 8.">
        <p class="invalid-feedback" id="phone-error"></p>
      </div>
      <button class="btn-ap btn-ap--primary" type="submit">Guardar datos</button>
      <p class="form-status" id="account-status" role="status"></p>
    </form></div>`;

  $('#account-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;
    const button = form.querySelector('button');
    button.disabled = true;
    $('#account-status').textContent = 'Guardando…';
    try {
      const updated = await usersApi.updateProfile({
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
      });
      updateSession({ name: updated.name, phone: updated.phone });
      $('#account-status').textContent = 'Tus datos se guardaron.';
    } catch (error) {
      $('#account-status').textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}
