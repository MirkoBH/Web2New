import { renderComparator } from '../components/comparator.js';
import { renderHeader } from '../components/header.js';
import { renderFooter } from '../components/footer.js';

/** Arma las partes comunes de cada página: encabezado, pie y comparador. */
export function initPage({ current = '', withFooter = true } = {}) {
  renderHeader(current);
  if (withFooter) renderFooter();
  renderComparator();
}
