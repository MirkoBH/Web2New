import { crudo, formatearKm, formatearUsd, html, ICONOS } from '../nucleo/dom.js';
import {
  alternarComparado,
  alternarFavorito,
  MAXIMO_COMPARAR,
  obtenerComparados,
  obtenerFavoritos,
  obtenerModo,
  obtenerSesion,
} from '../nucleo/sesion.js';
import { etiquetaEstado } from './tasacion.js';

/**
 * Tarjeta de un auto del listado. El título es el enlace al detalle y cubre
 * toda la tarjeta; los botones de favorito y comparar quedan por encima.
 */
export function tarjetaAuto(auto) {
  const sesion = obtenerSesion();
  const esPropio = sesion?.id === auto.vendedorId;
  const titulo = `${auto.marca} ${auto.modelo} ${auto.anio}`;

  const favorito =
    !esPropio && obtenerModo() === 'comprador'
      ? html`<button type="button" class="btn-icono" data-favorito="${auto.id}"
          aria-pressed="${obtenerFavoritos().includes(auto.id)}"
          aria-label="Guardar ${titulo} en favoritos">${crudo(ICONOS.corazon)}</button>`
      : '';
  const comparar = !esPropio
    ? html`<button type="button" class="btn-icono" data-comparar="${auto.id}"
        aria-pressed="${obtenerComparados().includes(auto.id)}"
        aria-label="Comparar ${titulo}">${crudo(ICONOS.comparar)}</button>`
    : '';

  const foto = auto.imagenPrincipal
    ? html`<img src="${auto.imagenPrincipal}" alt="${titulo}" loading="lazy" width="400" height="300">`
    : '';

  return html`
    <article class="tarjeta">
      <div class="tarjeta__foto">${foto}</div>
      <div class="tarjeta__acciones">${favorito}${comparar}</div>
      <div class="tarjeta__cuerpo">
        <h3 class="tarjeta__titulo">
          <a class="tarjeta__enlace" href="detalle.html?id=${auto.id}">${titulo}</a>
        </h3>
        <p class="tarjeta__datos">${formatearKm(auto.kilometraje)} · ${auto.transmision === 'Automatico' ? 'Automático' : 'Manual'} · ${auto.ubicacion}</p>
        <div class="tarjeta__pie">
          <span class="precio">${formatearUsd(auto.precio)}</span>
          ${etiquetaEstado(auto.analisisIa.estado)}
        </div>
      </div>
    </article>`;
}

/** Dibuja una grilla de tarjetas y conecta los botones. */
export function renderizarGrilla(contenedor, autos, { columnas = 'col-sm-6 col-lg-4' } = {}) {
  contenedor.innerHTML = html`${autos.map((auto) => html`<div class="${columnas}">${tarjetaAuto(auto)}</div>`)}`;
  conectarAcciones(contenedor);
}

/**
 * Favoritos y comparador requieren cuenta: sin sesión se va a ingresar.
 * Se usa delegación de eventos para no registrar un listener por botón.
 */
export function conectarAcciones(contenedor) {
  if (contenedor.dataset.acciones) return;
  contenedor.dataset.acciones = 'si';
  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-favorito], [data-comparar]');
    if (!boton) return;

    if (!obtenerSesion()) {
      const volver = encodeURIComponent(location.pathname.split('/').pop() + location.search);
      location.href = `login.html?volver=${volver}`;
      return;
    }

    if (boton.dataset.favorito) {
      alternarFavorito(boton.dataset.favorito);
      boton.setAttribute('aria-pressed', String(obtenerFavoritos().includes(boton.dataset.favorito)));
      return;
    }

    const id = boton.dataset.comparar;
    if (!alternarComparado(id)) {
      document.dispatchEvent(
        new CustomEvent('comparador:lleno', { detail: `Podés comparar hasta ${MAXIMO_COMPARAR} autos. Quitá uno para sumar otro.` }),
      );
      return;
    }
    boton.setAttribute('aria-pressed', String(obtenerComparados().includes(id)));
    document.dispatchEvent(new CustomEvent('comparador:cambio'));
  });
}
