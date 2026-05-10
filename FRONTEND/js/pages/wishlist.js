import { initAppShell } from "../app-init.js";
import { carsApi } from "../utils/api.js";
import { requireAuth } from "../utils/auth.js";
import { renderCards } from "../utils/cards.js";
import { getKey, readJson } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

const sesion = requireAuth(["comprador"]);
if (!sesion) {
  // redirigido
} else {
  initAppShell();

  const grid = qs("#wishlist-grid");
  const wishlistIds = [...new Set(readJson(getKey("WISHLIST"), [])
    .filter((x) => x.userId === sesion.userId)
    .map((x) => x.carId))];

  if (!wishlistIds.length) {
    grid.innerHTML = `<p class="text-secondary">Aún no tenés autos en favoritos. <a href="listado.html" class="text-danger">Explorá el listado.</a></p>`;
  } else {
    grid.innerHTML = `<p class="text-secondary small">Cargando favoritos...</p>`;
    Promise.all(wishlistIds.map((id) => carsApi.obtener(id).catch(() => null)))
      .then((autos) => {
        const validos = autos.filter(Boolean).map((auto) => ({
          ...auto,
          imagenes: (auto.imagenes || []).sort((a,b) => a.orden - b.orden).map((img) =>
            typeof img === "string" ? img : img.urlPublica),
          ia: auto.iaEstado ? { estado: auto.iaEstado, score: auto.iaPuntaje } : null,
        }));
        if (!validos.length) {
          grid.innerHTML = `<p class="text-secondary">No se pudieron cargar los favoritos.</p>`;
          return;
        }
        renderCards(grid, validos);
      });
  }
}
