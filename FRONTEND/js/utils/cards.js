import { carCardTemplate, toggleCompare, toggleWishlist } from "../components/car-card.js";
import { refreshCompareDrawer } from "../components/compare-drawer.js";

export function renderCards(container, cars) {
  container.innerHTML = cars.map(carCardTemplate).join("");

  container.querySelectorAll(".btn-compare").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleCompare(btn.dataset.id);
      refreshCompareDrawer();
      window.location.reload();
    });
  });

  container.querySelectorAll(".btn-wishlist").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleWishlist(btn.dataset.id);
      window.location.reload();
    });
  });
}
