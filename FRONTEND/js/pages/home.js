import { footerDirectory } from '../components/footer.js';
import { drawRanges, conditionBadge, appraisalPanel } from '../components/appraisal.js';
import { renderGrid } from '../components/car-card.js';
import { carsApi } from '../core/api.js';
import { $, formatNumber, formatUsd, html } from '../core/dom.js';
import { initPage } from '../core/page.js';

initPage({ withFooter: false });
$('#directory').innerHTML = footerDirectory();

loadHome();

async function loadHome() {
  let page;
  try {
    page = await carsApi.list({ limit: 4, sort: 'newest' });
  } catch {
    renderEmpty('No pudimos cargar los autos en este momento.');
    return;
  }

  const { data: cars, total } = page;
  if (total > 0) {
    $('#hero-fact').innerHTML = html`<strong>${formatNumber(total)} ${total === 1 ? 'auto publicado' : 'autos publicados'}</strong> en Argentina, precios en dólares`;
  }
  if (cars.length === 0) {
    renderEmpty('Todavía no hay autos publicados.');
    return;
  }

  renderGrid($('#recent-grid'), cars, { columns: 'col-sm-6 col-lg-3' });

  // El héroe y el ejemplo de tasación muestran el último auto publicado.
  const latest = await carsApi.get(cars[0].id).catch(() => null);
  if (!latest) return;
  renderHero(latest);
  const example = $('#appraisal-example');
  example.innerHTML = appraisalPanel(latest, {
    title: `Tasación de un ${latest.brand} ${latest.model} ${latest.year} publicado`,
    level: 'h3',
  });
  drawRanges(example);
}

function renderHero(car) {
  const container = $('#hero-car');
  const title = `${car.brand} ${car.model} ${car.year}`;
  const link = document.createElement('a');
  link.className = 'heroe__auto';
  link.href = `detail.html?id=${encodeURIComponent(car.id)}`;
  link.innerHTML = html`
    <img src="${car.images[0]?.url ?? ''}" alt="${title}, último auto publicado" width="800" height="640" fetchpriority="high">
    <span class="hero__appraisal">
      <span class="label">Último publicado · ${title}</span>
      <span class="d-flex justify-content-between align-items-center gap-3">
        <span class="price">${formatUsd(car.price)}</span>${conditionBadge(car.aiAnalysis.condition)}
      </span>
      <span class="d-block mt-1 small muted">La IA estima ${formatUsd(car.aiAnalysis.minPrice)} – ${formatUsd(car.aiAnalysis.maxPrice)}</span>
    </span>`;
  container.replaceWith(link);
}

function renderEmpty(message) {
  const empty = html`<div class="hero__empty"><p>${message}</p></div>`;
  const hero = $('#hero-car');
  hero.classList.remove('esqueleto');
  hero.removeAttribute('aria-busy');
  hero.innerHTML = empty;
  $('#appraisal-example').innerHTML = html`<div class="empty"><p>${message}</p></div>`;
  $('#recent-grid').innerHTML = html`<div class="col-12"><div class="empty"><p>${message}</p><p class="mt-3"><a class="link" href="publish.html">Publicar mi auto</a></p></div></div>`;
}
