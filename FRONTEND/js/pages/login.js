import { authApi } from '../core/api.js';
import { $, clearNotice, showNotice, validateForm } from '../core/dom.js';
import { initPage } from '../core/page.js';
import { returnPage } from '../core/redirect.js';
import { getSession, saveSession } from '../core/session.js';

if (getSession()) location.replace(returnPage());
initPage();

const form = $('#form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice($('#alerts'));
  if (!validateForm(form)) return;

  const button = form.querySelector('button');
  button.disabled = true;
  $('#status').textContent = 'Ingresando…';
  try {
    const response = await authApi.login({
      email: form.email.value.trim(),
      password: form.password.value,
    });
    saveSession(response);
    location.replace(returnPage());
  } catch (error) {
    $('#status').textContent = '';
    showNotice($('#alerts'), error.message);
    button.disabled = false;
  }
});
