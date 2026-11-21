import { directorio } from '../componentes/pie.js';
import { dibujarRangos, etiquetaEstado, panelTasacion } from '../componentes/tasacion.js';
import { renderizarGrilla } from '../componentes/tarjeta-auto.js';
import { autosApi } from '../nucleo/api.js';
import { $, formatearNumero, formatearUsd, html } from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';

iniciarPagina({ conPie: false });
$('#directorio').innerHTML = directorio();

cargarPortada();

async function cargarPortada() {
  let pagina;
  try {
    pagina = await autosApi.listar({ limite: 4, orden: 'reciente' });
  } catch {
    mostrarSinDatos('No pudimos cargar los autos en este momento.');
    return;
  }

  const { datos: autos, total } = pagina;
  if (total > 0) {
    $('#heroe-dato').innerHTML = html`<strong>${formatearNumero(total)} ${total === 1 ? 'auto publicado' : 'autos publicados'}</strong> en Argentina, precios en dólares`;
  }
  if (autos.length === 0) {
    mostrarSinDatos('Todavía no hay autos publicados.');
    return;
  }

  renderizarGrilla($('#recientes-grilla'), autos, { columnas: 'col-sm-6 col-lg-3' });

  // El héroe y el ejemplo de tasación muestran el último auto publicado.
  const ultimo = await autosApi.obtener(autos[0].id).catch(() => null);
  if (!ultimo) return;
  mostrarHeroe(ultimo);
  const ejemplo = $('#tasacion-ejemplo');
  ejemplo.innerHTML = panelTasacion(ultimo, {
    titulo: `Tasación de un ${ultimo.marca} ${ultimo.modelo} ${ultimo.anio} publicado`,
    nivel: 'h3',
  });
  dibujarRangos(ejemplo);
}

function mostrarHeroe(auto) {
  const contenedor = $('#heroe-auto');
  const titulo = `${auto.marca} ${auto.modelo} ${auto.anio}`;
  const enlace = document.createElement('a');
  enlace.className = 'heroe__auto';
  enlace.href = `detalle.html?id=${encodeURIComponent(auto.id)}`;
  enlace.innerHTML = html`
    <img src="${auto.imagenes[0]?.url ?? ''}" alt="${titulo}, último auto publicado" width="800" height="640" fetchpriority="high">
    <span class="heroe__tasacion">
      <span class="label">Último publicado · ${titulo}</span>
      <span class="d-flex justify-content-between align-items-center gap-3">
        <span class="precio">${formatearUsd(auto.precio)}</span>${etiquetaEstado(auto.analisisIa.estado)}
      </span>
      <span class="d-block mt-1 small muted">La IA estima ${formatearUsd(auto.analisisIa.precioMin)} – ${formatearUsd(auto.analisisIa.precioMax)}</span>
    </span>`;
  contenedor.replaceWith(enlace);
}

function mostrarSinDatos(mensaje) {
  const vacio = html`<div class="heroe__vacio"><p>${mensaje}</p></div>`;
  const heroe = $('#heroe-auto');
  heroe.classList.remove('esqueleto');
  heroe.removeAttribute('aria-busy');
  heroe.innerHTML = vacio;
  $('#tasacion-ejemplo').innerHTML = html`<div class="vacio"><p>${mensaje}</p></div>`;
  $('#recientes-grilla').innerHTML = html`<div class="col-12"><div class="vacio"><p>${mensaje}</p><p class="mt-3"><a class="link" href="publicar.html">Publicar mi auto</a></p></div></div>`;
}
