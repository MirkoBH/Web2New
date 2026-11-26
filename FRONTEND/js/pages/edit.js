import { photoField } from '../components/photo-field.js';
import { carsApi } from '../core/api.js';
import { $, html, clearNotice, showNotice, queryParam, validateForm } from '../core/dom.js';
import { initPage } from '../core/page.js';
import { requireSession } from '../core/session.js';

const session = requireSession();
const id = queryParam('id');
if (session) {
  initPage({ current: 'panel' });
  load();
}

async function load() {
  const form = $('#form');
  let car;
  try {
    if (!id) throw new Error('Falta indicar qué publicación editar.');
    car = await carsApi.get(id);
  } catch (error) {
    $('#edit-car').textContent = '';
    showNotice($('#alerts'), error.status === 404 ? 'Esta publicación ya no existe.' : error.message);
    return;
  }
  if (car.sellerId !== session.id) {
    $('#edit-car').textContent = '';
    showNotice($('#alerts'), 'Solo el vendedor puede editar esta publicación.');
    return;
  }

  $('#edit-car').textContent = `${car.brand} ${car.model} ${car.year}`;
  $('#cancel').href = `detail.html?id=${encodeURIComponent(car.id)}`;
  form.price.value = car.price;
  form.mileage.value = car.mileage;
  form.description.value = car.description;
  form.damageDetails.value = car.damageDetails ?? '';
  $('#current-photos').innerHTML = html`${car.images.map((photo, i) => html`<img src="${photo.url}" alt="Foto actual ${i + 1}">`)}`;
  form.hidden = false;

  const photos = photoField(form.images, $('#preview'), { required: false });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotice($('#alerts'));
    photos.validate();
    if (!validateForm(form)) return;

    // Solo se mandan los campos que cambiaron, más las fotos nuevas si hay.
    const data = new FormData();
    const changes = {
      price: [form.price.value, String(car.price)],
      mileage: [form.mileage.value, String(car.mileage)],
      description: [form.description.value.trim(), car.description],
      damageDetails: [form.damageDetails.value.trim(), car.damageDetails ?? ''],
    };
    for (const [field, [newValue, previous]] of Object.entries(changes)) {
      if (newValue !== previous) data.set(field, newValue);
    }
    for (const file of photos.files()) data.append('images', file);
    if ([...data.keys()].length === 0) {
      showNotice($('#alerts'), 'No cambiaste ningún dato.', 'info');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    $('#status').textContent = 'Guardando y volviendo a tasar con IA…';
    try {
      await carsApi.update(car.id, data);
      location.href = `detail.html?id=${encodeURIComponent(car.id)}`;
    } catch (error) {
      $('#status').textContent = '';
      showNotice($('#alerts'), error.message);
      button.disabled = false;
    }
  });
}
