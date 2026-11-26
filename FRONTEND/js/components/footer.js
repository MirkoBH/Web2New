import { $, html } from '../core/dom.js';

const CURRENT_YEAR = new Date().getFullYear();

/** Pie del sitio: directorio de enlaces y línea legal. */
export function footerDirectory() {
  return html`
    <div class="row g-4 directory">
      <div class="col-6 col-md-3">
        <h3>Autos</h3>
        <ul>
          <li><a href="listing.html">Ver autos</a></li>
          <li><a href="publish.html">Publicar mi auto</a></li>
          <li><a href="index.html#appraisal">Cómo tasa la IA</a></li>
        </ul>
      </div>
      <div class="col-6 col-md-3">
        <h3>Cuenta</h3>
        <ul>
          <li><a href="login.html">Ingresar</a></li>
          <li><a href="register.html">Crear cuenta</a></li>
          <li><a href="profile.html">Mi panel</a></li>
        </ul>
      </div>
      <div class="col-12 col-md-6">
        <h3>Proyecto</h3>
        <p class="measure">Trabajo práctico de Ingeniería Web II. Frontend en HTML, CSS y JavaScript con Bootstrap; API en NestJS; datos en Supabase.</p>
        <ul class="mt-s5">
          <li><a href="https://github.com/MirkoBH/Web2New" rel="noopener">Código en GitHub</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__legal">
      <span>AutoPulse © ${CURRENT_YEAR}</span>
      <span>Los rangos de precio son estimaciones de una IA, no una tasación oficial.</span>
    </div>`;
}

export function renderFooter() {
  const mount = $('#footer');
  if (!mount) return;
  mount.innerHTML = html`<footer class="footer"><div class="wrap">${footerDirectory()}</div></footer>`;
}
