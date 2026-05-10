import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { refreshCompareDrawer, renderCompareDrawer } from "./components/compare-drawer.js";

export function initAppShell() {
  renderNavbar();
  renderFooter();
  renderCompareDrawer();
  refreshCompareDrawer();
}
