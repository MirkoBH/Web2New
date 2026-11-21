import { autenticacionApi } from '../nucleo/api.js';
import { $, limpiarAviso, mostrarAviso, validarFormulario } from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';
import { paginaDeVuelta } from '../nucleo/redireccion.js';
import { iniciarSesion, obtenerSesion } from '../nucleo/sesion.js';

if (obtenerSesion()) location.replace(paginaDeVuelta());
iniciarPagina();

const formulario = $('#formulario');
formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarAviso($('#avisos'));
  if (!validarFormulario(formulario)) return;

  const boton = formulario.querySelector('button');
  boton.disabled = true;
  $('#estado').textContent = 'Ingresando…';
  try {
    const respuesta = await autenticacionApi.iniciarSesion({
      email: formulario.email.value.trim(),
      password: formulario.password.value,
    });
    iniciarSesion(respuesta);
    location.replace(paginaDeVuelta());
  } catch (error) {
    $('#estado').textContent = '';
    mostrarAviso($('#avisos'), error.message);
    boton.disabled = false;
  }
});
