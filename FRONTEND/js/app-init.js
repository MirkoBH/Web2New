import { ensureSeedData } from "./data/mock-data.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { refreshCompareDrawer, renderCompareDrawer } from "./components/compare-drawer.js";

export function initAppShell() {
  ensureSeedData();
  renderNavbar();
  renderFooter();
  renderCompareDrawer();
  refreshCompareDrawer();
}
