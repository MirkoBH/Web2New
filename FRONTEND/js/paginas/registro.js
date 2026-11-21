import { autenticacionApi } from '../nucleo/api.js';
import { $, limpiarAviso, mostrarAviso, validarFormulario } from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';
import { paginaDeVuelta } from '../nucleo/redireccion.js';
import { iniciarSesion, obtenerSesion } from '../nucleo/sesion.js';

if (obtenerSesion()) location.replace('perfil.html');
iniciarPagina();

const formulario = $('#formulario');
formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarAviso($('#avisos'));
  // La confirmación se valida a mano: el navegador no compara dos campos.
  formulario.confirmar.setCustomValidity(
    formulario.confirmar.value === formulario.password.value ? '' : 'no coincide',
  );
  if (!validarFormulario(formulario)) return;

  const boton = formulario.querySelector('button');
  boton.disabled = true;
  $('#estado').textContent = 'Creando la cuenta…';
  try {
    const respuesta = await autenticacionApi.registrar({
      nombre: formulario.nombre.value.trim(),
      email: formulario.email.value.trim(),
      telefono: formulario.telefono.value.trim() || undefined,
      password: formulario.password.value,
    });
    iniciarSesion(respuesta);
    location.replace(paginaDeVuelta() === 'index.html' ? 'perfil.html' : paginaDeVuelta());
  } catch (error) {
    $('#estado').textContent = '';
    mostrarAviso($('#avisos'), error.message);
    boton.disabled = false;
  }
});
