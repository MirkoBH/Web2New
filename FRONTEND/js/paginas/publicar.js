import { campoFotos } from '../componentes/campo-fotos.js';
import { selectorBuscable } from '../componentes/selector-buscable.js';
import { autosApi } from '../nucleo/api.js';
import { cargarCatalogos, modelosDe } from '../nucleo/catalogos.js';
import { $, html, limpiarAviso, mostrarAviso, validarFormulario } from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';
import { cambiarModo, exigirSesion, obtenerModo } from '../nucleo/sesion.js';

const sesion = exigirSesion();
if (sesion) {
  iniciarPagina({ actual: 'publicar' });
  if (obtenerModo() === 'vendedor') prepararFormulario();
  else pedirModoVendedor();
}

/** Publicar es una acción del modo vendedor: se ofrece cambiar de modo. */
function pedirModoVendedor() {
  const formulario = $('#formulario');
  formulario.hidden = true;
  $('#avisos').innerHTML = html`<div class="panel">
    <h2 class="h3 mb-3">Estás en modo comprador</h2>
    <p class="mb-4">Para publicar tu auto, pasá a modo vendedor. Podés volver a modo comprador cuando quieras desde el encabezado.</p>
    <button type="button" class="btn-ap btn-ap--primario" id="pasar-a-vendedor">Pasar a modo vendedor</button>
  </div>`;
  $('#pasar-a-vendedor').addEventListener('click', () => {
    cambiarModo('vendedor');
    location.reload();
  });
}

async function prepararFormulario() {
  const formulario = $('#formulario');
  formulario.anio.max = String(new Date().getFullYear() + 1);
  formulario.anio.dataset.error = `Escribí un año entre 1950 y ${formulario.anio.max}.`;
  const fotos = campoFotos(formulario.imagenes, $('#previa'));

  try {
    const catalogos = await cargarCatalogos();
    for (const provincia of catalogos.provincias) formulario.ubicacion.add(new Option(provincia, provincia));
    selectorBuscable(formulario.marca, () => catalogos.marcas.map((m) => m.marca), {
      alElegir: () => { formulario.modelo.value = ''; },
    });
    selectorBuscable(formulario.modelo, () => modelosDe(catalogos, formulario.marca.value));
  } catch {
    mostrarAviso($('#avisos'), 'No se pudo cargar la lista de provincias. Recargá la página.');
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limpiarAviso($('#avisos'));
    fotos.validar();
    if (!validarFormulario(formulario)) return;

    const datos = new FormData(formulario);
    // Se quitan los opcionales vacíos para no mandar texto en blanco.
    for (const opcional of ['color', 'detallesDanios']) {
      if (!String(datos.get(opcional)).trim()) datos.delete(opcional);
    }

    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;
    $('#estado').textContent = 'Subiendo fotos y tasando con IA. Puede tardar hasta un minuto…';
    try {
      const auto = await autosApi.publicar(datos);
      location.href = `detalle.html?id=${encodeURIComponent(auto.id)}`;
    } catch (error) {
      $('#estado').textContent = '';
      mostrarAviso($('#avisos'), error.message);
      boton.disabled = false;
    }
  });
}
