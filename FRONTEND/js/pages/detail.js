import { drawRanges, appraisalPanel } from '../components/appraisal.js';
import { bindCardActions } from '../components/car-card.js';
import { carsApi, inquiriesApi } from '../core/api.js';
import {
  $,
  raw,
  formatDate,
  formatKm,
  formatUsd,
  html,
  ICONS,
  clearNotice,
  showNotice,
  queryParam,
  validateForm,
} from '../core/dom.js';
import { initPage } from '../core/page.js';
import { getCompared, getFavorites, getMode, getSession } from '../core/session.js';

initPage({ current: 'cars' });

const id = queryParam('id');
const session = getSession();
const LABELS = { Automatic: 'Automático', Hybrid: 'Híbrido', Electric: 'Eléctrico', Diesel: 'Diésel' };
const name = (value) => LABELS[value] ?? value;

load();

async function load() {
  const container = $('#detail');
  if (!id) {
    container.innerHTML = html`<div class="empty"><h1 class="h3">No encontramos ese auto</h1><p><a class="link" href="listing.html">Ver autos</a></p></div>`;
    return;
  }
  try {
    const [car, inquiries] = await Promise.all([carsApi.get(id), inquiriesApi.listByCar(id)]);
    document.title = `${car.brand} ${car.model} ${car.year}: AutoPulse`;
    renderCar(container, car, inquiries);
  } catch (error) {
    container.innerHTML = html`<div class="empty"><h1 class="h3">${error.status === 404 ? 'Esta publicación ya no existe' : 'No pudimos cargar el auto'}</h1>
      <p>${error.status === 404 ? 'El vendedor la borró.' : error.message}</p><p class="mt-3"><a class="link" href="listing.html">Ver autos</a></p></div>`;
  } finally {
    container.removeAttribute('aria-busy');
  }
}

function renderCar(container, car, inquiries) {
  const title = `${car.brand} ${car.model}`;
  const isOwn = session?.id === car.sellerId;

  container.innerHTML = html`
    <nav aria-label="Ruta" class="mb-4"><a class="link" href="listing.html">Autos</a> <span class="muted">/ ${title}</span></nav>
    <div class="row g-5">
      <div class="col-lg-7">${gallery(car)}</div>
      <div class="col-lg-5">
        <p class="label">${car.year} · ${formatKm(car.mileage)} · ${car.location}</p>
        <h1 class="h2 mt-2">${title}</h1>
        <p class="detail__price">${formatUsd(car.price)}</p>
        ${actions(car, isOwn)}
        <ul class="rows mt-s6">
          ${row('Año', car.year)}
          ${row('Kilometraje', formatKm(car.mileage))}
          ${row('Fuel', name(car.fuel))}
          ${row('Transmisión', name(car.transmission))}
          ${car.color ? row('Color', car.color) : ''}
          ${row('Ubicación', car.location)}
          ${row('Vendedor', car.seller.name)}
          ${row('Publicado', formatDate(car.createdAt))}
        </ul>
      </div>
    </div>

    <div class="row g-5 block">
      <div class="col-lg-7">
        <section aria-labelledby="description-title">
          <h2 id="description-title" class="h3 mb-3">Descripción del vendedor</h2>
          <p class="measure">${car.description}</p>
          <h3 class="h5 mt-s6 mb-2">Daños declarados</h3>
          <p class="measure">${car.damageDetails || 'El vendedor no declaró daños.'}</p>
        </section>
        <section class="block" aria-labelledby="inquiries-title">
          <h2 id="inquiries-title">Preguntas al vendedor</h2>
          <div id="inquiry-zone">${inquiryForm(car, isOwn)}</div>
          <div id="inquiry-list">${inquiryList(inquiries, isOwn)}</div>
        </section>
      </div>
      <div class="col-lg-5">${appraisalPanel(car)}</div>
    </div>`;

  drawRanges(container);
  bindGallery(container);
  bindCardActions(container);
  bindInquiries(car, isOwn);
  bindDelete(car);
}

function row(key, value) {
  return html`<li><span class="rows__key">${key}</span><span class="rows__value">${value}</span></li>`;
}

function gallery(car) {
  const photos = car.images;
  if (photos.length === 0) return html`<div class="gallery__main"></div>`;
  const title = `${car.brand} ${car.model} ${car.year}`;
  return html`
    <div class="gallery">
      <div class="gallery__main"><img id="main-photo" src="${photos[0].url}" alt="${title}, foto 1 de ${photos.length}" width="1200" height="900"></div>
      ${photos.length > 1
        ? html`<div class="gallery__thumbnails" role="group" aria-label="Fotos del auto">
            ${photos.map((photo, i) => html`<button type="button" data-photo="${i}" aria-current="${i === 0}" aria-label="Ver foto ${i + 1} de ${photos.length}">
              <img src="${photo.url}" alt="" loading="lazy" width="160" height="120"></button>`)}
          </div>`
        : ''}
    </div>`;
}

function bindGallery(container) {
  const mainPhoto = $('#main-photo', container);
  container.querySelector('.gallery__thumbnails')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-photo]');
    if (!button) return;
    const index = Number(button.dataset.photo);
    const thumbnails = container.querySelectorAll('[data-photo]');
    mainPhoto.src = button.querySelector('img').src;
    mainPhoto.alt = mainPhoto.alt.replace(/foto \d+/, `foto ${index + 1}`);
    thumbnails.forEach((b) => b.setAttribute('aria-current', String(b === button)));
  });
}

function actions(car, isOwn) {
  if (isOwn) {
    return html`<div class="button-row">
      <a class="btn-ap btn-ap--primary" href="edit.html?id=${car.id}">Editar publicación</a>
      <button type="button" class="btn-ap btn-ap--secondary" id="delete">Eliminar</button>
    </div>
    <p class="form-status" id="delete-status" role="status"></p>`;
  }
  const inFavorites = getFavorites().includes(car.id);
  const inCompare = getCompared().includes(car.id);
  const canFavorite = !session || getMode() === 'buyer';
  return html`<div class="button-row">
    <a class="btn-ap btn-ap--primary" href="#inquiries-title">Preguntar al vendedor</a>
    ${canFavorite ? html`<button type="button" class="btn-icon" data-favorite="${car.id}" aria-pressed="${inFavorites}" aria-label="Guardar en favoritos">${raw(ICONS.heart)}</button>` : ''}
    <button type="button" class="btn-icon" data-compare="${car.id}" aria-pressed="${inCompare}" aria-label="Agregar al comparador">${raw(ICONS.compare)}</button>
  </div>`;
}

function bindDelete(car) {
  const button = $('#delete');
  if (!button) return;
  button.addEventListener('click', async () => {
    if (!confirmDelete(button)) return;
    button.disabled = true;
    try {
      await carsApi.remove(car.id);
      location.href = 'profile.html?deleted=1';
    } catch (error) {
      button.disabled = false;
      $('#delete-status').textContent = error.message;
    }
  });
}

/** Pide un segundo clic para confirmar, sin usar ventanas emergentes del navegador. */
function confirmDelete(button) {
  if (button.dataset.confirm) return true;
  button.dataset.confirm = 'yes';
  button.textContent = 'Confirmar: eliminar para siempre';
  $('#delete-status').textContent = 'Se borran el auto, sus fotos y sus consultas. Volvé a tocar para confirmar.';
  return false;
}

// ── Consultas públicas ───────────────────────────────────────────────

function inquiryForm(car, isOwn) {
  if (isOwn) return html`<p class="muted mb-4">Respondé las preguntas de los compradores desde acá o desde tu panel.</p>`;
  if (!session) {
    const returnTo = encodeURIComponent(`detail.html?id=${car.id}`);
    return html`<p class="mb-4"><a class="link" href="login.html?returnTo=${returnTo}">Ingresá</a> para preguntarle al vendedor.</p>`;
  }
  if (getMode() !== 'buyer') return html`<p class="muted mb-4">Cambiá a modo comprador, desde el encabezado, para hacer una pregunta.</p>`;
  return html`
    <form id="inquiry-form" class="mb-5" novalidate>
      <label class="form-label" for="question">Tu pregunta</label>
      <textarea class="form-control" id="question" name="question" rows="3" required minlength="8" maxlength="500"
        aria-describedby="question-error question-help" data-error="Escribí una pregunta de al menos 8 caracteres."></textarea>
      <p class="form-text" id="question-help">La pregunta y la respuesta quedan a la vista de todos. Podés hacer una por aviso.</p>
      <p class="invalid-feedback" id="question-error"></p>
      <button class="btn-ap btn-ap--secondary mt-3" type="submit">Enviar pregunta</button>
      <div id="inquiry-notice" class="mt-3"></div>
    </form>`;
}

function inquiryList(inquiries, isOwn) {
  if (inquiries.length === 0) return html`<p class="muted">Todavía nadie preguntó por este auto.</p>`;
  return html`<div>${inquiries.map((c) => html`
    <article class="inquiry">
      <p class="inquiry__meta">${c.buyer.name} · ${formatDate(c.createdAt)}</p>
      <p>${c.question}</p>
      ${c.answer
        ? html`<p class="inquiry__answer"><span class="label d-block">Respuesta del vendedor</span>${c.answer}</p>`
        : isOwn
          ? html`<form class="mt-3" data-answer="${c.id}" novalidate>
              <label class="form-label" for="answer-${c.id}">Tu respuesta</label>
              <textarea class="form-control" id="answer-${c.id}" name="answer" rows="2" required minlength="2" maxlength="500"
                aria-describedby="answer-${c.id}-error" data-error="Escribí una respuesta."></textarea>
              <p class="invalid-feedback" id="answer-${c.id}-error"></p>
              <button class="btn-ap btn-ap--secondary btn-ap--small mt-2" type="submit">Responder</button>
            </form>`
          : html`<p class="inquiry__meta mt-2">Sin respuesta todavía.</p>`}
    </article>`)}</div>`;
}

function bindInquiries(car, isOwn) {
  bindInquiryForm(car, isOwn);

  // Respuestas del vendedor: un solo listener delegado en la lista.
  $('#inquiry-list').addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-answer]');
    if (!form) return;
    event.preventDefault();
    if (!validateForm(form)) return;
    form.querySelector('button').disabled = true;
    try {
      await inquiriesApi.answer(form.dataset.answer, form.answer.value.trim());
      await refreshInquiries(car, isOwn);
    } catch (error) {
      form.querySelector('.invalid-feedback').textContent = error.message;
      form.querySelector('button').disabled = false;
    }
  });
}

function bindInquiryForm(car, isOwn) {
  $('#inquiry-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateForm(form)) return;
    const button = form.querySelector('button');
    button.disabled = true;
    clearNotice($('#inquiry-notice'));
    try {
      await inquiriesApi.create({ carId: car.id, question: form.question.value.trim() });
      await refreshInquiries(car, isOwn);
      showNotice($('#inquiry-zone'), 'Tu pregunta se publicó. El vendedor responde acá mismo.', 'success');
    } catch (error) {
      showNotice($('#inquiry-notice'), error.message);
      button.disabled = false;
    }
  });
}

async function refreshInquiries(car, isOwn) {
  const inquiries = await inquiriesApi.listByCar(car.id);
  $('#inquiry-zone').innerHTML = inquiryForm(car, isOwn);
  $('#inquiry-list').innerHTML = inquiryList(inquiries, isOwn);
  bindInquiryForm(car, isOwn);
}
