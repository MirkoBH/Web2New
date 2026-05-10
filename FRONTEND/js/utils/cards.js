import { carCardTemplate, toggleCompare, toggleWishlist } from "../components/car-card.js";
import { refreshCompareDrawer } from "../components/compare-drawer.js";

// ── Renderizar grilla de tarjetas de autos ────────────────────
export function renderCards(contenedor, autos) {
  contenedor.innerHTML = autos.map(carCardTemplate).join("");

  // Botones de comparador
  contenedor.querySelectorAll(".btn-compare").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleCompare(btn.dataset.id);
      refreshCompareDrawer();
      window.location.reload();
    });
  });

  // Botones de favoritos
  contenedor.querySelectorAll(".btn-favorito").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleWishlist(btn.dataset.id);
      window.location.reload();
    });
  });
}
