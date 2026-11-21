import { renderizarComparador } from '../componentes/comparador.js';
import { renderizarEncabezado } from '../componentes/encabezado.js';
import { renderizarPie } from '../componentes/pie.js';

/** Arma las partes comunes de cada página: encabezado, pie y comparador. */
export function iniciarPagina({ actual = '', conPie = true } = {}) {
  renderizarEncabezado(actual);
  if (conPie) renderizarPie();
  renderizarComparador();
}
