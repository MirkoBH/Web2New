import { initAppShell } from "../app-init.js";
import { getCars } from "../data/mock-data.js";
import { qs } from "../utils/dom.js";
import { renderCards } from "../utils/cards.js";

initAppShell();

const featuredGrid = qs("#featured-cars");
if (featuredGrid) {
  renderCards(featuredGrid, getCars().slice(0, 3));
}
