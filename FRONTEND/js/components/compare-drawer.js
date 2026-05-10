import { getCars } from "../data/mock-data.js";
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
        <h5 class="offcanvas-title" id="compareDrawerLabel">Comparador rapido</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <div id="compare-content" class="small text-secondary">Selecciona hasta 2 autos para comparar.</div>
      </div>
    </div>
  `;
}

export function refreshCompareDrawer() {
  const content = document.querySelector("#compare-content");
  if (!content) return;

  const comparedIds = readJson(getKey("COMPARE"), []);
  const cars = getCars();
  const selected = cars.filter((c) => comparedIds.includes(c.id));

  if (selected.length < 2) {
    setSafeHtml(content, "Seleccioná 2 autos para ver la comparación.");
    return;
  }

  const [a, b] = selected;

  setSafeHtml(
    content,
    `
      <div class="table-responsive">
        <table class="table table-dark table-striped align-middle">
          <thead>
            <tr>
              <th>Atributo</th>
              <th>${a.marca} ${a.modelo}</th>
              <th>${b.marca} ${b.modelo}</th>
            </tr>
          </thead>
          <tbody>
            ${row("Precio", formatUsd(a.precio), formatUsd(b.precio))}
            ${row("Daños", a.detallesDanios, b.detallesDanios)}
            ${row("Kilometraje", formatKm(a.kilometraje), formatKm(b.kilometraje))}
            ${row("Año", a.anio, b.anio)}
            ${row("Combustible", a.combustible, b.combustible)}
            ${row("IA", a.ia?.resumen || "Sin datos", b.ia?.resumen || "Sin datos")}
          </tbody>
        </table>
      </div>
      <a class="btn btn-outline-light btn-sm" href="wishlist.html">Ver desde lista de deseos</a>
    `
  );
}
