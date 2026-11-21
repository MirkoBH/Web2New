import { $, html } from '../nucleo/dom.js';

const ANIO = new Date().getFullYear();

/** Pie del sitio: directorio de enlaces y línea legal. */
export function directorio() {
  return html`
    <div class="row g-4 directorio">
      <div class="col-6 col-md-3">
        <h3>Autos</h3>
        <ul>
          <li><a href="listado.html">Ver autos</a></li>
          <li><a href="publicar.html">Publicar mi auto</a></li>
          <li><a href="index.html#tasacion">Cómo tasa la IA</a></li>
        </ul>
      </div>
      <div class="col-6 col-md-3">
        <h3>Cuenta</h3>
        <ul>
          <li><a href="login.html">Ingresar</a></li>
          <li><a href="registro.html">Crear cuenta</a></li>
          <li><a href="perfil.html">Mi panel</a></li>
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
    <div class="pie__legal">
      <span>AutoPulse © ${ANIO}</span>
      <span>Los rangos de precio son estimaciones de una IA, no una tasación oficial.</span>
    </div>`;
}

export function renderizarPie() {
  const montaje = $('#pie');
  if (!montaje) return;
  montaje.innerHTML = html`<footer class="pie"><div class="wrap">${directorio()}</div></footer>`;
}
