import { searchableSelect } from '../components/searchable-select.js';
import { renderGrid } from '../components/car-card.js';
import { carsApi } from '../core/api.js';
import { loadCatalogs, modelsOf } from '../core/catalogs.js';
import { $, formatNumber, formatUsd, html, showNotice } from '../core/dom.js';
import { initPage } from '../core/page.js';

initPage({ current: 'cars' });

const form = $('#filters');
const PRICE_CAP = 100000;
const MIN_YEAR = 1950;
// Igual que la API: hasta el año actual + 1 (modelos del año siguiente).
const MAX_YEAR = new Date().getFullYear() + 1;
for (const field of [form.minYear, form.maxYear]) field.max = String(MAX_YEAR);
const FIELDS = ['search', 'brand', 'model', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'minKm', 'maxKm', 'location', 'fuel', 'transmission', 'sort'];
let page = Number(new URLSearchParams(location.search).get('page')) || 1;

setupCatalogs();
loadFromUrl();
updatePriceLabels();
runSearch();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  page = 1;
  runSearch();
  toggleFilters(false);
});

// En pantallas chicas los filtros se abren y cierran con un botón.
$('#toggle-filters').addEventListener('click', () => toggleFilters());

function toggleFilters(shouldOpen) {
  const button = $('#toggle-filters');
  const isOpen = shouldOpen ?? button.getAttribute('aria-expanded') !== 'true';
  $('#filters-body').classList.toggle('show', isOpen);
  button.setAttribute('aria-expanded', String(isOpen));
  button.textContent = isOpen ? 'Ocultar filtros' : 'Mostrar filtros';
}
form.addEventListener('reset', () => {
  setTimeout(() => {
    updatePriceLabels();
    page = 1;
    runSearch();
  });
});
$('#sort').addEventListener('change', () => {
  page = 1;
  runSearch();
});
for (const slider of form.querySelectorAll('.slider')) {
  slider.addEventListener('input', () => {
    // El mínimo nunca supera al máximo.
    const min = $('#f-min-price');
    const max = $('#f-max-price');
    if (Number(min.value) > Number(max.value)) {
      if (slider === min) max.value = min.value;
      else min.value = max.value;
    }
    updatePriceLabels();
  });
}
$('#pager').addEventListener('click', (event) => {
  const button = event.target.closest('[data-page]');
  if (!button) return;
  page += button.dataset.page === 'next' ? 1 : -1;
  runSearch();
  $('#content').scrollIntoView({ behavior: 'smooth' });
});

async function setupCatalogs() {
  try {
    const catalogs = await loadCatalogs();
    const provinceSelect = $('#f-location');
    const selectedProvince = new URLSearchParams(location.search).get('location') ?? '';
    for (const province of catalogs.provinces) {
      provinceSelect.add(new Option(province, province, false, province === selectedProvince));
    }
    searchableSelect($('#f-brand'), () => catalogs.brands.map((m) => m.brand), {
      onSelect: () => { $('#f-model').value = ''; },
    });
    searchableSelect($('#f-model'), () => modelsOf(catalogs, $('#f-brand').value));
  } catch {
    // Sin catálogos los campos siguen funcionando como texto libre.
  }
}

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  for (const name of FIELDS) {
    const value = params.get(name);
    if (value === null) continue;
    if (name === 'transmission') {
      const radio = form.querySelector(`input[name="transmission"][value="${CSS.escape(value)}"]`);
      if (radio) radio.checked = true;
    } else if (name === 'sort') {
      $('#sort').value = value;
    } else {
      const field = form.elements[name];
      if (field) field.value = value;
    }
  }
}

function readFilters() {
  const data = new FormData(form);
  const filters = {};
  for (const name of FIELDS) {
    const value = String(data.get(name) ?? '').trim();
    if (value) filters[name] = value;
  }
  // Los extremos del deslizador significan "sin límite".
  if (filters.minPrice === '0') delete filters.minPrice;
  if (Number(filters.maxPrice) >= PRICE_CAP) delete filters.maxPrice;
  if (filters.sort === 'newest') delete filters.sort;
  return filters;
}

function validateRanges(filters) {
  for (const key of ['minYear', 'maxYear']) {
    const year = Number(filters[key]);
    if (filters[key] && (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR)) {
      return `El año tiene que estar entre ${MIN_YEAR} y ${MAX_YEAR}.`;
    }
  }
  const pairs = [['minYear', 'maxYear', 'año'], ['minKm', 'maxKm', 'kilometraje']];
  for (const [rangeStart, rangeEnd, name] of pairs) {
    if (filters[rangeStart] && filters[rangeEnd] && Number(filters[rangeStart]) > Number(filters[rangeEnd])) {
      return `En ${name}, el valor "desde" no puede ser mayor que "hasta".`;
    }
  }
  return '';
}

function updatePriceLabels() {
  const min = Number($('#f-min-price').value);
  const max = Number($('#f-max-price').value);
  $('#min-price-text').textContent = formatUsd(min);
  $('#max-price-text').textContent = max >= PRICE_CAP ? 'Sin límite' : formatUsd(max);
}

async function runSearch() {
  const filters = readFilters();
  const error = validateRanges(filters);
  $('#filters-error').textContent = error;
  if (error) return;

  // Los filtros quedan en la URL para poder compartir la búsqueda.
  const params = new URLSearchParams({ ...filters, ...(page > 1 ? { page } : {}) });
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);

  const results = $('#results');
  results.setAttribute('aria-busy', 'true');
  results.innerHTML = html`${[1, 2, 3].map(() => html`<div class="col-sm-6 col-lg-4"><div class="skeleton"></div></div>`)}`;
  $('#alerts').innerHTML = '';

  try {
    const response = await carsApi.list({ ...filters, page, limit: 12 });
    renderResults(response);
  } catch (apiError) {
    results.innerHTML = '';
    $('#results-summary').textContent = '';
    showNotice($('#alerts'), apiError.message);
  } finally {
    results.removeAttribute('aria-busy');
  }
}

function renderResults({ data, total, pages }) {
  $('#results-summary').textContent =
    total === 1 ? '1 auto encontrado' : `${formatNumber(total)} autos encontrados`;

  if (data.length === 0) {
    $('#results').innerHTML = html`<div class="col-12"><div class="empty">
      <h2 class="h3">No hay autos con esos filtros</h2>
      <p>Probá ampliar el rango de precio o de kilometraje, o limpiá los filtros.</p></div></div>`;
  } else {
    renderGrid($('#results'), data);
  }

  const pager = $('#pager');
  pager.hidden = pages <= 1;
  $('#current-page').textContent = `Página ${page} de ${pages}`;
  pager.querySelector('[data-page="previous"]').disabled = page <= 1;
  pager.querySelector('[data-page="next"]').disabled = page >= pages;
}
