import { initAppShell } from "../app-init.js";
import { getCars } from "../data/mock-data.js";
import { requireAuth } from "../utils/auth.js";
import { renderCards } from "../utils/cards.js";
import { getKey, readJson } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

const session = requireAuth(["comprador"]);
if (!session) {
  // redirected
} else {
  initAppShell();

  const grid = qs("#wishlist-grid");
  const wishlistIds = new Set(readJson(getKey("WISHLIST"), []).filter((x) => x.userId === session.userId).map((x) => x.carId));
  const cars = getCars().filter((car) => wishlistIds.has(car.id));

  if (cars.length === 0) {
    grid.innerHTML = '<p class="text-secondary">Aun no tienes autos en la lista de deseos.</p>';
  } else {
    renderCards(grid, cars);
  }
}
