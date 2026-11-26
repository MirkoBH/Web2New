import { $, raw, html, ICONS } from '../core/dom.js';
import { setMode, logout, getMode, getSession } from '../core/session.js';

/**
 * Encabezado fijo. Muestra el botón principal ("Publicar mi auto"), los
 * enlaces y, con sesión, el interruptor de modo comprador/vendedor.
 * @param {string} current  clave de la página actual para marcarla (cars, publish, panel)
 */
export function renderHeader(current) {
  const mount = $('#header');
  if (!mount) return;

  const session = getSession();
  const mode = getMode();
  const links = [
    { key: 'cars', text: 'Autos', href: 'listing.html' },
    { key: 'appraisal', text: 'Tasación', href: 'index.html#appraisal' },
    { key: 'faq', text: 'Preguntas', href: 'index.html#faq' },
  ];
  if (session) links.push({ key: 'panel', text: 'Mi panel', href: 'profile.html' });

  const linkItems = links.map(
    (e) =>
      html`<li><a href="${e.href}"${raw(e.key === current ? ' aria-current="page"' : '')}>${e.text}</a></li>`,
  );

  const modeSwitch = session
    ? html`<div class="mode-switch" role="group" aria-label="Modo de uso">
        <button type="button" data-mode="buyer" aria-pressed="${mode === 'buyer'}">Comprador</button>
        <button type="button" data-mode="seller" aria-pressed="${mode === 'seller'}">Vendedor</button>
      </div>`
    : '';

  const account = session
    ? html`<button type="button" class="nav-ap__word desktop-only" data-logout>Salir</button>`
    : html`<a class="nav-ap__word desktop-only" href="login.html">Ingresar</a>`;

  mount.innerHTML = html`
    <header class="nav-ap">
      <div class="wrap">
        <a class="skip-link" href="#content">Saltar al contenido</a>
        <a class="brand" href="index.html" aria-label="AutoPulse, inicio">${raw(ICONS.logo)}AutoPulse</a>
        <nav aria-label="Principal"><ul class="nav-ap__links">${linkItems}</ul></nav>
        <div class="nav-ap__actions">
          <span class="desktop-only">${modeSwitch}</span>
          ${account}
          <a class="btn-ap btn-ap--primary" href="publish.html">Publicar mi auto</a>
          <button type="button" class="btn-icon nav-ap__menu" data-bs-toggle="offcanvas"
            data-bs-target="#mobile-menu" aria-controls="mobile-menu" aria-expanded="false"
            aria-label="Abrir menú">${raw(ICONS.menu)}</button>
        </div>
      </div>
    </header>

    <div class="offcanvas offcanvas-top mobile-menu h-100" tabindex="-1" id="mobile-menu" aria-label="Menú">
      <div class="offcanvas-header">
        <span class="brand">${raw(ICONS.logo)}AutoPulse</span>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar menú"></button>
      </div>
      <div class="offcanvas-body">
        <a class="btn-ap btn-ap--primary mobile-menu__action" href="publish.html">Publicar mi auto</a>
        <ul class="mobile-menu__list">
          ${links.map((e) => html`<li><a href="${e.href}">${e.text}</a></li>`)}
          <li>${session ? html`<button type="button" data-logout>Salir</button>` : html`<a href="login.html">Ingresar</a>`}</li>
        </ul>
        ${session ? html`<p class="label mb-2">Modo de uso</p>${modeSwitch}` : ''}
      </div>
    </div>`;

  for (const button of mount.querySelectorAll('[data-mode]')) {
    button.addEventListener('click', () => {
      if (button.dataset.mode === getMode()) return;
      setMode(button.dataset.mode);
      location.reload();
    });
  }
  for (const button of mount.querySelectorAll('[data-logout]')) {
    button.addEventListener('click', () => {
      logout();
      location.href = 'index.html';
    });
  }
  // Cerrar el menú al tocar un enlace (anclas de la misma página).
  $('#mobile-menu')?.addEventListener('click', (event) => {
    if (event.target.closest('a')) window.bootstrap?.Offcanvas.getInstance('#mobile-menu')?.hide();
  });
}
