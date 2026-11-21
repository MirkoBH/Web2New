import { $, crudo, html, ICONOS } from '../nucleo/dom.js';
import { cambiarModo, cerrarSesion, obtenerModo, obtenerSesion } from '../nucleo/sesion.js';

/**
 * Encabezado fijo. Muestra el botón principal ("Publicar mi auto"), los
 * enlaces y, con sesión, el interruptor de modo comprador/vendedor.
 * @param {string} actual  clave de la página actual para marcarla (autos, publicar, panel)
 */
export function renderizarEncabezado(actual) {
  const montaje = $('#encabezado');
  if (!montaje) return;

  const sesion = obtenerSesion();
  const modo = obtenerModo();
  const enlaces = [
    { clave: 'autos', texto: 'Autos', href: 'listado.html' },
    { clave: 'como', texto: 'Tasación', href: 'index.html#tasacion' },
    { clave: 'preguntas', texto: 'Preguntas', href: 'index.html#preguntas' },
  ];
  if (sesion) enlaces.push({ clave: 'panel', texto: 'Mi panel', href: 'perfil.html' });

  const listaEnlaces = enlaces.map(
    (e) =>
      html`<li><a href="${e.href}"${crudo(e.clave === actual ? ' aria-current="page"' : '')}>${e.texto}</a></li>`,
  );

  const interruptor = sesion
    ? html`<div class="modo" role="group" aria-label="Modo de uso">
        <button type="button" data-modo="comprador" aria-pressed="${modo === 'comprador'}">Comprador</button>
        <button type="button" data-modo="vendedor" aria-pressed="${modo === 'vendedor'}">Vendedor</button>
      </div>`
    : '';

  const cuenta = sesion
    ? html`<button type="button" class="nav-ap__palabra solo-escritorio" data-salir>Salir</button>`
    : html`<a class="nav-ap__palabra solo-escritorio" href="login.html">Ingresar</a>`;

  montaje.innerHTML = html`
    <header class="nav-ap">
      <div class="wrap">
        <a class="skip-link" href="#contenido">Saltar al contenido</a>
        <a class="marca" href="index.html" aria-label="AutoPulse, inicio">${crudo(ICONOS.simbolo)}AutoPulse</a>
        <nav aria-label="Principal"><ul class="nav-ap__enlaces">${listaEnlaces}</ul></nav>
        <div class="nav-ap__acciones">
          <span class="solo-escritorio">${interruptor}</span>
          ${cuenta}
          <a class="btn-ap btn-ap--primario" href="publicar.html">Publicar mi auto</a>
          <button type="button" class="btn-icono nav-ap__menu" data-bs-toggle="offcanvas"
            data-bs-target="#menu-movil" aria-controls="menu-movil" aria-expanded="false"
            aria-label="Abrir menú">${crudo(ICONOS.menu)}</button>
        </div>
      </div>
    </header>

    <div class="offcanvas offcanvas-top menu-movil h-100" tabindex="-1" id="menu-movil" aria-label="Menú">
      <div class="offcanvas-header">
        <span class="marca">${crudo(ICONOS.simbolo)}AutoPulse</span>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar menú"></button>
      </div>
      <div class="offcanvas-body">
        <a class="btn-ap btn-ap--primario menu-movil__accion" href="publicar.html">Publicar mi auto</a>
        <ul class="menu-movil__lista">
          ${enlaces.map((e) => html`<li><a href="${e.href}">${e.texto}</a></li>`)}
          <li>${sesion ? html`<button type="button" data-salir>Salir</button>` : html`<a href="login.html">Ingresar</a>`}</li>
        </ul>
        ${sesion ? html`<p class="label mb-2">Modo de uso</p>${interruptor}` : ''}
      </div>
    </div>`;

  for (const boton of montaje.querySelectorAll('[data-modo]')) {
    boton.addEventListener('click', () => {
      if (boton.dataset.modo === obtenerModo()) return;
      cambiarModo(boton.dataset.modo);
      location.reload();
    });
  }
  for (const boton of montaje.querySelectorAll('[data-salir]')) {
    boton.addEventListener('click', () => {
      cerrarSesion();
      location.href = 'index.html';
    });
  }
  // Cerrar el menú al tocar un enlace (anclas de la misma página).
  $('#menu-movil')?.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) window.bootstrap?.Offcanvas.getInstance('#menu-movil')?.hide();
  });
}
