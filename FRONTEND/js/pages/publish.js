import { photoField } from '../components/photo-field.js';
import { searchableSelect } from '../components/searchable-select.js';
import { carsApi } from '../core/api.js';
import { loadCatalogs, modelsOf } from '../core/catalogs.js';
import { $, html, clearNotice, showNotice, validateForm } from '../core/dom.js';
import { initPage } from '../core/page.js';
import { setMode, requireSession, getMode } from '../core/session.js';

const session = requireSession();
if (session) {
  initPage({ current: 'publish' });
  if (getMode() === 'seller') setupForm();
  else askSellerMode();
}

/** Publicar es una acción del modo vendedor: se ofrece cambiar de modo. */
function askSellerMode() {
  const form = $('#form');
  form.hidden = true;
  $('#alerts').innerHTML = html`<div class="panel">
    <h2 class="h3 mb-3">Estás en modo comprador</h2>
    <p class="mb-4">Para publicar tu auto, pasá a modo vendedor. Podés volver a modo comprador cuando quieras desde el encabezado.</p>
    <button type="button" class="btn-ap btn-ap--primary" id="switch-to-seller">Pasar a modo vendedor</button>
  </div>`;
  $('#switch-to-seller').addEventListener('click', () => {
    setMode('seller');
    location.reload();
  });
}

async function setupForm() {
  const form = $('#form');
  form.year.max = String(new Date().getFullYear() + 1);
  form.year.dataset.error = `Escribí un año entre 1950 y ${form.year.max}.`;
  const photos = photoField(form.images, $('#preview'));

  try {
    const catalogs = await loadCatalogs();
    for (const province of catalogs.provinces) form.location.add(new Option(province, province));
    searchableSelect(form.brand, () => catalogs.brands.map((m) => m.brand), {
      onSelect: () => { form.model.value = ''; },
    });
    searchableSelect(form.model, () => modelsOf(catalogs, form.brand.value));
  } catch {
    showNotice($('#alerts'), 'No se pudo cargar la lista de provincias. Recargá la página.');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotice($('#alerts'));
    photos.validate();
    if (!validateForm(form)) return;

    const data = new FormData(form);
    // Se quitan los opcionales vacíos para no mandar texto en blanco.
    for (const optional of ['color', 'damageDetails']) {
      if (!String(data.get(optional)).trim()) data.delete(optional);
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    $('#status').textContent = 'Subiendo fotos y tasando con IA. Puede tardar hasta un minuto…';
    try {
      const car = await carsApi.publish(data);
      location.href = `detail.html?id=${encodeURIComponent(car.id)}`;
    } catch (error) {
      $('#status').textContent = '';
      showNotice($('#alerts'), error.message);
      button.disabled = false;
    }
  });
}
