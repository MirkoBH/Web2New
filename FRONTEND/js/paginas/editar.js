import { campoFotos } from '../componentes/campo-fotos.js';
import { autosApi } from '../nucleo/api.js';
import { $, html, limpiarAviso, mostrarAviso, parametro, validarFormulario } from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';
import { exigirSesion } from '../nucleo/sesion.js';

const sesion = exigirSesion();
const id = parametro('id');
if (sesion) {
  iniciarPagina({ actual: 'panel' });
  cargar();
}

async function cargar() {
  const formulario = $('#formulario');
  let auto;
  try {
    if (!id) throw new Error('Falta indicar qué publicación editar.');
    auto = await autosApi.obtener(id);
  } catch (error) {
    $('#editar-auto').textContent = '';
    mostrarAviso($('#avisos'), error.estado === 404 ? 'Esta publicación ya no existe.' : error.message);
    return;
  }
  if (auto.vendedorId !== sesion.id) {
    $('#editar-auto').textContent = '';
    mostrarAviso($('#avisos'), 'Solo el vendedor puede editar esta publicación.');
    return;
  }

  $('#editar-auto').textContent = `${auto.marca} ${auto.modelo} ${auto.anio}`;
  $('#cancelar').href = `detalle.html?id=${encodeURIComponent(auto.id)}`;
  formulario.precio.value = auto.precio;
  formulario.kilometraje.value = auto.kilometraje;
  formulario.descripcion.value = auto.descripcion;
  formulario.detallesDanios.value = auto.detallesDanios ?? '';
  $('#fotos-actuales').innerHTML = html`${auto.imagenes.map((foto, i) => html`<img src="${foto.url}" alt="Foto actual ${i + 1}">`)}`;
  formulario.hidden = false;

  const fotos = campoFotos(formulario.imagenes, $('#previa'), { obligatorio: false });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiarAviso($('#avisos'));
    fotos.validar();
    if (!validarFormulario(formulario)) return;

    // Solo se mandan los campos que cambiaron, más las fotos nuevas si hay.
    const datos = new FormData();
    const cambios = {
      precio: [formulario.precio.value, String(auto.precio)],
      kilometraje: [formulario.kilometraje.value, String(auto.kilometraje)],
      descripcion: [formulario.descripcion.value.trim(), auto.descripcion],
      detallesDanios: [formulario.detallesDanios.value.trim(), auto.detallesDanios ?? ''],
    };
    for (const [campo, [nuevo, anterior]] of Object.entries(cambios)) {
      if (nuevo !== anterior) datos.set(campo, nuevo);
    }
    for (const archivo of fotos.archivos()) datos.append('imagenes', archivo);
    if ([...datos.keys()].length === 0) {
      mostrarAviso($('#avisos'), 'No cambiaste ningún dato.', 'info');
      return;
    }

    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;
    $('#estado').textContent = 'Guardando y volviendo a tasar con IA…';
    try {
      await autosApi.editar(auto.id, datos);
      location.href = `detalle.html?id=${encodeURIComponent(auto.id)}`;
    } catch (error) {
      $('#estado').textContent = '';
      mostrarAviso($('#avisos'), error.message);
      boton.disabled = false;
    }
  });
}
