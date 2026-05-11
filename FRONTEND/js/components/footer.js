import { readSession, getModo, setModo } from "../utils/storage.js";

export function renderFooter(containerSelector = "#app-footer") {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;

  mount.innerHTML = `
    <footer class="footer-glass mt-5">
      <div class="container py-4">
        <div class="row g-3 align-items-start">
          <div class="col-md-4">
            <h5 class="mb-2">AutoPulse</h5>
            <p class="text-secondary small mb-0">
              Plataforma inteligente para compra y venta de autos usados en Argentina, con análisis de IA.
            </p>
          </div>
          <div class="col-md-4">
            <h6>Navegación</h6>
            <ul class="list-unstyled small">
              <li><a class="link-light text-decoration-none" href="index.html">Inicio</a></li>
              <li><a class="link-light text-decoration-none" href="listado.html">Ver autos</a></li>
              <li><a class="link-light text-decoration-none" href="publicar.html">Publicar auto</a></li>
              <li><a class="link-light text-decoration-none" href="perfil.html">Mi panel</a></li>
            </ul>
          </div>
          <div class="col-md-4">
            <h6>Legal</h6>
            <ul class="list-unstyled small text-secondary mb-0">
              <li>Términos y condiciones</li>
              <li>Política de privacidad</li>
              <li>Contacto: soporte@autopulse.app</li>
            </ul>
          </div>
        </div>
        <hr class="border-secondary mt-4 mb-3" />
        <p class="text-secondary small mb-0 text-center">
          © 2026 AutoPulse — Ingeniería Web II
        </p>
      </div>
    </footer>`;
}
