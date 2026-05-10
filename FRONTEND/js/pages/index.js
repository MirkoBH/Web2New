import { initAppShell } from "../app-init.js";
import { carsApi } from "../utils/api.js";
import { qs } from "../utils/dom.js";
import { renderCards } from "../utils/cards.js";

initAppShell();

function mapearAuto(auto) {
  return {
    ...auto,
    imagenes: (auto.imagenes || []).map((img) => (typeof img === "string" ? img : img.urlPublica)),
    ia: auto.iaEstado ? {
      estado: auto.iaEstado, score: auto.iaPuntaje, danios: auto.iaDanios,
      rangoPrecioMin: auto.iaRangoPrecioMin, rangoPrecioMax: auto.iaRangoPrecioMax, resumen: auto.iaResumen,
    } : null,
  };
}

const featuredGrid = qs("#featured-cars");
if (featuredGrid) {
  carsApi.listar({ limite: 6, orden: "reciente" })
    .then(({ datos }) => renderCards(featuredGrid, datos.map(mapearAuto)))
    .catch(() => {
      featuredGrid.innerHTML = `<p class="text-secondary small">No se pudieron cargar los autos destacados.</p>`;
    });
}
