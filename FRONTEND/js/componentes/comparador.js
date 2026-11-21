import { autosApi } from '../nucleo/api.js';
import { $, crudo, formatearKm, formatearUsd, html, ICONOS } from '../nucleo/dom.js';
import { MAXIMO_COMPARAR, obtenerComparados, obtenerSesion, quitarComparado } from '../nucleo/sesion.js';
import { etiquetaEstado } from './tasacion.js';

/**
 * Panel lateral del comparador (offcanvas de Bootstrap) y el botón flotante
 * que lo abre. Solo existe con sesión iniciada.
 */
export function renderizarComparador() {
  if (!obtenerSesion()) return;
  const montaje = document.createElement('div');
  montaje.innerHTML = html`
    <button type="button" class="btn-ap btn-ap--secundario boton-comparar" data-bs-toggle="offcanvas"
      data-bs-target="#comparador" aria-controls="comparador" hidden>
      ${crudo(ICONOS.comparar.replace('<svg', '<svg width="18" height="18"'))}<span data-cantidad>Comparar</span>
    </button>
    <div class="offcanvas offcanvas-end comparador" tabindex="-1" id="comparador" aria-labelledby="comparador-titulo">
      <div class="offcanvas-header">
        <h2 class="h3" id="comparador-titulo">Comparar autos</h2>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar comparador"></button>
      </div>
      <div class="offcanvas-body" id="comparador-contenido" aria-live="polite"></div>
    </div>`;
  document.body.append(...montaje.children);

  $('#comparador').addEventListener('show.bs.offcanvas', cargarComparacion);
  $('#comparador-contenido').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-quitar]');
    if (!boton) return;
    quitarComparado(boton.dataset.quitar);
    document.dispatchEvent(new CustomEvent('comparador:cambio'));
    for (const b of document.querySelectorAll(`[data-comparar="${CSS.escape(boton.dataset.quitar)}"]`)) {
      b.setAttribute('aria-pressed', 'false');
    }
    cargarComparacion();
  });
  document.addEventListener('comparador:cambio', actualizarBoton);
  document.addEventListener('comparador:lleno', (evento) => {
    actualizarBoton();
    window.bootstrap?.Offcanvas.getOrCreateInstance('#comparador').show();
    const aviso = $('#comparador-aviso');
    if (aviso) aviso.textContent = evento.detail;
  });
  actualizarBoton();
}

function actualizarBoton() {
  const boton = $('.boton-comparar');
  if (!boton) return;
  const cantidad = obtenerComparados().length;
  boton.hidden = cantidad === 0;
  boton.querySelector('[data-cantidad]').textContent = `Comparar (${cantidad}/${MAXIMO_COMPARAR})`;
}

async function cargarComparacion() {
  const contenido = $('#comparador-contenido');
  const ids = obtenerComparados();
  if (ids.length < MAXIMO_COMPARAR) {
    contenido.innerHTML = html`<p id="comparador-aviso" class="mb-4"></p>
      <p>Elegí ${MAXIMO_COMPARAR - ids.length === 1 ? 'un auto más' : `${MAXIMO_COMPARAR} autos`} con el botón de comparar de cada tarjeta.</p>
      ${ids.length ? html`<p class="mt-3"><button type="button" class="link border-0" data-quitar="${ids[0]}">Quitar el auto elegido</button></p>` : ''}
      <p class="mt-s6"><a class="btn-ap btn-ap--secundario" href="listado.html">Ver autos</a></p>`;
    return;
  }

  contenido.innerHTML = html`<div class="esqueleto" aria-label="Cargando comparación"></div>`;
  const autos = (await Promise.all(ids.map((id) => autosApi.obtener(id).catch(() => null))));
  // Un auto borrado por su vendedor se saca de la lista.
  autos.forEach((auto, i) => { if (!auto) quitarComparado(ids[i]); });
  const validos = autos.filter(Boolean);
  if (validos.length < MAXIMO_COMPARAR) {
    actualizarBoton();
    return cargarComparacion();
  }

  const fila = (titulo, valor) =>
    html`<tr><th scope="row">${titulo}</th>${validos.map((a) => html`<td>${valor(a)}</td>`)}</tr>`;

  contenido.innerHTML = html`
    <p id="comparador-aviso" class="mb-3"></p>
    <table class="tabla-comparar">
      <thead><tr><th scope="col"><span class="visually-hidden">Dato</span></th>
        ${validos.map((a) => html`<th scope="col"><a class="link" href="detalle.html?id=${a.id}">${a.marca} ${a.modelo}</a></th>`)}
      </tr></thead>
      <tbody>
        ${fila('Precio', (a) => formatearUsd(a.precio))}
        ${fila('Año', (a) => a.anio)}
        ${fila('Kilometraje', (a) => formatearKm(a.kilometraje))}
        ${fila('Combustible', (a) => (a.combustible === 'Hibrido' ? 'Híbrido' : a.combustible === 'Electrico' ? 'Eléctrico' : a.combustible))}
        ${fila('Transmisión', (a) => (a.transmision === 'Automatico' ? 'Automático' : 'Manual'))}
        ${fila('Ubicación', (a) => a.ubicacion)}
        ${fila('Daños declarados', (a) => a.detallesDanios || 'Ninguno')}
        ${fila('Estado según la IA', (a) => etiquetaEstado(a.analisisIa.estado))}
        ${fila('Puntaje IA', (a) => `${a.analisisIa.puntaje}/10`)}
        ${fila('Rango IA', (a) => `${formatearUsd(a.analisisIa.precioMin)} – ${formatearUsd(a.analisisIa.precioMax)}`)}
        ${fila('Daños detectados', (a) => a.analisisIa.danios)}
        <tr><th scope="row"></th>${validos.map((a) => html`<td><button type="button" class="btn-ap btn-ap--secundario btn-ap--chico" data-quitar="${a.id}">Quitar</button></td>`)}</tr>
      </tbody>
    </table>`;
}
