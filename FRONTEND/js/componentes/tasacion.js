import { formatearUsd, html } from '../nucleo/dom.js';

/** Texto corto que compara el precio pedido con el rango de la IA. */
export function veredictoPrecio(precio, minimo, maximo) {
  if (precio < minimo) return 'Precio por debajo del rango estimado';
  if (precio > maximo) return 'Precio por encima del rango estimado';
  return 'Precio dentro del rango estimado';
}

/** Punto de color + estado de la IA. */
export function etiquetaEstado(estado) {
  const texto = estado === 'Requiere reparacion' ? 'Requiere reparación' : estado;
  return html`<span class="estado" data-estado="${estado}">${texto}</span>`;
}

/**
 * Panel con la tasación completa de un auto (detalle y portada).
 * La barra muestra el rango de la IA y una marca roja en el precio pedido.
 */
export function panelTasacion(auto, { titulo = 'Tasación por IA', nivel = 'h2' } = {}) {
  const { analisisIa: ia, precio } = auto;
  const encabezado =
    nivel === 'h3' ? html`<h3>${titulo}</h3>` : html`<h2 class="h3">${titulo}</h2>`;

  return html`
    <section class="panel tasacion" aria-label="${titulo}">
      <div class="tasacion__cabecera">
        <div>
          ${encabezado}
          <p class="mt-2">${etiquetaEstado(ia.estado)}</p>
        </div>
        <p class="puntaje" aria-label="Puntaje ${ia.puntaje} de 10">${ia.puntaje}<small>/10</small></p>
      </div>

      <div class="rango" data-rango data-min="${ia.precioMin}" data-max="${ia.precioMax}" data-precio="${precio}">
        <p class="label">Rango de precio de mercado</p>
        <div class="rango__barra" aria-hidden="true">
          <span class="rango__tramo"></span><span class="rango__marca"></span>
        </div>
        <div class="rango__extremos"><span>${formatearUsd(ia.precioMin)}</span><span>${formatearUsd(ia.precioMax)}</span></div>
        <p class="mt-3">${veredictoPrecio(precio, ia.precioMin, ia.precioMax)}: se piden ${formatearUsd(precio)}.</p>
        <div class="leyenda mt-2"><span>Rango de la IA</span><span class="leyenda__pedido">Precio pedido</span></div>
      </div>

      ${ia.danios !== undefined ? html`<p class="label">Daños detectados</p><p class="mb-4">${ia.danios}</p>` : ''}
      ${ia.resumen !== undefined ? html`<p class="label">Resumen</p><p>${ia.resumen}</p>` : ''}
    </section>`;
}

/**
 * Ubica el tramo y la marca de cada barra de rango. Se hace por CSSOM
 * (setProperty) porque la política de seguridad no permite estilos en línea.
 */
export function dibujarRangos(raiz = document) {
  for (const rango of raiz.querySelectorAll('[data-rango]')) {
    const minimo = Number(rango.dataset.min);
    const maximo = Number(rango.dataset.max);
    const precio = Number(rango.dataset.precio);
    // La escala va de un 20% por debajo del menor a un 20% por encima del mayor.
    const desde = Math.min(minimo, precio) * 0.8;
    const hasta = Math.max(maximo, precio) * 1.2;
    const posicion = (valor) => `${(((valor - desde) / (hasta - desde)) * 100).toFixed(2)}%`;
    const barra = rango.querySelector('.rango__barra');
    barra.style.setProperty('--desde', posicion(minimo));
    barra.style.setProperty('--ancho', `${(((maximo - minimo) / (hasta - desde)) * 100).toFixed(2)}%`);
    barra.style.setProperty('--pedido', posicion(precio));
  }
}
