import { carsApi } from "../utils/api.js";
import { formatKm, formatUsd, setSafeHtml } from "../utils/dom.js";
import { getKey, readJson } from "../utils/storage.js";

function row(label, left, right) {
  return `<tr><th>${label}</th><td>${left}</td><td>${right}</td></tr>`;
}

export function renderCompareDrawer(containerSelector = "#compare-drawer-mount") {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;
  mount.innerHTML = `
    <div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="compareDrawer" aria-labelledby="compareDrawerLabel">
      <div class="offcanvas-header border-bottom border-secondary-subtle">
        <h5 class="offcanvas-title" id="compareDrawerLabel">Comparador rápido</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
      </div>
      <div class="offcanvas-body">
        <div id="compare-content" class="small text-secondary">Seleccioná hasta 2 autos para comparar.</div>
      </div>
    </div>`;
}

export function refreshCompareDrawer() {
  const content = document.querySelector("#compare-content");
  if (!content) return;

  const ids = readJson(getKey("COMPARE"), []);
  if (ids.length < 2) {
    setSafeHtml(content, "Seleccioná 2 autos para ver la comparación.");
    return;
  }

  Promise.all(ids.map((id) => carsApi.obtener(id).catch(() => null)))
    .then((autos) => {
      const validos = autos.filter(Boolean);
      if (validos.length < 2) { setSafeHtml(content, "No se pudieron cargar los autos."); return; }
      const [a, b] = validos;
      setSafeHtml(content, `
        <div class="table-responsive">
          <table class="table table-dark table-striped align-middle">
            <thead><tr><th>Atributo</th><th>${a.marca} ${a.modelo}</th><th>${b.marca} ${b.modelo}</th></tr></thead>
            <tbody>
              ${row("Precio",      formatUsd(a.precio),      formatUsd(b.precio))}
              ${row("Año",         a.anio,                   b.anio)}
              ${row("Kilometraje", formatKm(a.kilometraje),  formatKm(b.kilometraje))}
              ${row("Combustible", a.combustible,             b.combustible)}
              ${row("Transmisión", a.transmision,             b.transmision)}
              ${row("Estado IA",   a.iaEstado || "Sin datos", b.iaEstado || "Sin datos")}
            </tbody>
          </table>
        </div>
        <a class="btn btn-outline-light btn-sm" href="listado.html">Ver listado</a>`);
    });
}
