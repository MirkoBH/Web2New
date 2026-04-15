export function renderFooter(containerSelector = "#app-footer") {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;

  mount.innerHTML = `
    <footer class="footer-glass mt-5">
      <div class="container py-4">
        <div class="row g-3 align-items-start">
          <div class="col-md-4">
            <h5 class="mb-2">AutoPulse</h5>
            <p class="text-secondary small mb-0">Plataforma inteligente para compra y venta de autos usados en Argentina.</p>
          </div>
          <div class="col-md-4">
            <h6>Navegacion</h6>
            <ul class="list-unstyled small">
              <li><a class="link-light text-decoration-none" href="index.html">Inicio</a></li>
              <li><a class="link-light text-decoration-none" href="listado.html">Autos</a></li>
              <li><a class="link-light text-decoration-none" href="publicar.html">Publicar</a></li>
            </ul>
          </div>
          <div class="col-md-4">
            <h6>Legal</h6>
            <ul class="list-unstyled small text-secondary mb-0">
              <li>Terminos y condiciones</li>
              <li>Politica de privacidad</li>
              <li>Contacto: soporte@autopulse.app</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  `;
}
