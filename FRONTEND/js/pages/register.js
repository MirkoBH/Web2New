import { authApi } from '../core/api.js';
import { $, clearNotice, showNotice, validateForm } from '../core/dom.js';
import { initPage } from '../core/page.js';
import { returnPage } from '../core/redirect.js';
import { getSession, saveSession } from '../core/session.js';

if (getSession()) location.replace('profile.html');
initPage();

const form = $('#form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice($('#alerts'));
  // La confirmación se valida a mano: el navegador no compara dos campos.
  form.confirm.setCustomValidity(
    form.confirm.value === form.password.value ? '' : 'no coincide',
  );
  if (!validateForm(form)) return;

  const button = form.querySelector('button');
  button.disabled = true;
  $('#status').textContent = 'Creando la cuenta…';
  try {
    const response = await authApi.register({
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim() || undefined,
      password: form.password.value,
    });
    saveSession(response);
    location.replace(returnPage() === 'index.html' ? 'profile.html' : returnPage());
  } catch (error) {
    $('#status').textContent = '';
    showNotice($('#alerts'), error.message);
    button.disabled = false;
  }
});
