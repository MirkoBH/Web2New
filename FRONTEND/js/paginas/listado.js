import { selectorBuscable } from '../componentes/selector-buscable.js';
import { renderizarGrilla } from '../componentes/tarjeta-auto.js';
import { autosApi } from '../nucleo/api.js';
import { cargarCatalogos, modelosDe } from '../nucleo/catalogos.js';
import { $, formatearNumero, formatearUsd, html, mostrarAviso } from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';

iniciarPagina({ actual: 'autos' });

const formulario = $('#filtros');
const PRECIO_TOPE = 100000;
const ANIO_MINIMO = 1950;
// Igual que la API: hasta el año actual + 1 (modelos del año siguiente).
const ANIO_MAXIMO = new Date().getFullYear() + 1;
for (const campo of [formulario.anioMin, formulario.anioMax]) campo.max = String(ANIO_MAXIMO);
const CAMPOS = ['texto', 'marca', 'modelo', 'precioMin', 'precioMax', 'anioMin', 'anioMax', 'kmMin', 'kmMax', 'ubicacion', 'combustible', 'transmision', 'orden'];
let pagina = Number(new URLSearchParams(location.search).get('pagina')) || 1;

prepararCatalogos();
cargarDesdeUrl();
actualizarTextosPrecio();
buscar();

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  pagina = 1;
  buscar();
  alternarFiltros(false);
});

// En pantallas chicas los filtros se abren y cierran con un botón.
$('#mostrar-filtros').addEventListener('click', () => alternarFiltros());

function alternarFiltros(abrir) {
  const boton = $('#mostrar-filtros');
  const abierto = abrir ?? boton.getAttribute('aria-expanded') !== 'true';
  $('#filtros-cuerpo').classList.toggle('show', abierto);
  boton.setAttribute('aria-expanded', String(abierto));
  boton.textContent = abierto ? 'Ocultar filtros' : 'Mostrar filtros';
}
formulario.addEventListener('reset', () => {
  setTimeout(() => {
    actualizarTextosPrecio();
    pagina = 1;
    buscar();
  });
});
$('#orden').addEventListener('change', () => {
  pagina = 1;
  buscar();
});
for (const deslizador of formulario.querySelectorAll('.deslizador')) {
  deslizador.addEventListener('input', () => {
    // El mínimo nunca supera al máximo.
    const minimo = $('#f-precio-min');
    const maximo = $('#f-precio-max');
    if (Number(minimo.value) > Number(maximo.value)) {
      if (deslizador === minimo) maximo.value = minimo.value;
      else minimo.value = maximo.value;
    }
    actualizarTextosPrecio();
  });
}
$('#paginacion').addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-pagina]');
  if (!boton) return;
  pagina += boton.dataset.pagina === 'siguiente' ? 1 : -1;
  buscar();
  $('#contenido').scrollIntoView({ behavior: 'smooth' });
});

async function prepararCatalogos() {
  try {
    const catalogos = await cargarCatalogos();
    const selectProvincia = $('#f-ubicacion');
    const elegida = new URLSearchParams(location.search).get('ubicacion') ?? '';
    for (const provincia of catalogos.provincias) {
      selectProvincia.add(new Option(provincia, provincia, false, provincia === elegida));
    }
    selectorBuscable($('#f-marca'), () => catalogos.marcas.map((m) => m.marca), {
      alElegir: () => { $('#f-modelo').value = ''; },
    });
    selectorBuscable($('#f-modelo'), () => modelosDe(catalogos, $('#f-marca').value));
  } catch {
    // Sin catálogos los campos siguen funcionando como texto libre.
  }
}

function cargarDesdeUrl() {
  const parametros = new URLSearchParams(location.search);
  for (const nombre of CAMPOS) {
    const valor = parametros.get(nombre);
    if (valor === null) continue;
    if (nombre === 'transmision') {
      const radio = formulario.querySelector(`input[name="transmision"][value="${CSS.escape(valor)}"]`);
      if (radio) radio.checked = true;
    } else if (nombre === 'orden') {
      $('#orden').value = valor;
    } else {
      const campo = formulario.elements[nombre];
      if (campo) campo.value = valor;
    }
  }
}

function leerFiltros() {
  const datos = new FormData(formulario);
  const filtros = {};
  for (const nombre of CAMPOS) {
    const valor = String(datos.get(nombre) ?? '').trim();
    if (valor) filtros[nombre] = valor;
  }
  // Los extremos del deslizador significan "sin límite".
  if (filtros.precioMin === '0') delete filtros.precioMin;
  if (Number(filtros.precioMax) >= PRECIO_TOPE) delete filtros.precioMax;
  if (filtros.orden === 'reciente') delete filtros.orden;
  return filtros;
}

function validarRangos(filtros) {
  for (const clave of ['anioMin', 'anioMax']) {
    const anio = Number(filtros[clave]);
    if (filtros[clave] && (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO)) {
      return `El año tiene que estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`;
    }
  }
  const pares = [['anioMin', 'anioMax', 'año'], ['kmMin', 'kmMax', 'kilometraje']];
  for (const [desde, hasta, nombre] of pares) {
    if (filtros[desde] && filtros[hasta] && Number(filtros[desde]) > Number(filtros[hasta])) {
      return `En ${nombre}, el valor "desde" no puede ser mayor que "hasta".`;
    }
  }
  return '';
}

function actualizarTextosPrecio() {
  const minimo = Number($('#f-precio-min').value);
  const maximo = Number($('#f-precio-max').value);
  $('#precio-min-texto').textContent = formatearUsd(minimo);
  $('#precio-max-texto').textContent = maximo >= PRECIO_TOPE ? 'Sin límite' : formatearUsd(maximo);
}

async function buscar() {
  const filtros = leerFiltros();
  const error = validarRangos(filtros);
  $('#filtros-error').textContent = error;
  if (error) return;

  // Los filtros quedan en la URL para poder compartir la búsqueda.
  const parametros = new URLSearchParams({ ...filtros, ...(pagina > 1 ? { pagina } : {}) });
  history.replaceState(null, '', `${location.pathname}${parametros.size ? `?${parametros}` : ''}`);

  const resultados = $('#resultados');
  resultados.setAttribute('aria-busy', 'true');
  resultados.innerHTML = html`${[1, 2, 3].map(() => html`<div class="col-sm-6 col-lg-4"><div class="esqueleto"></div></div>`)}`;
  $('#avisos').innerHTML = '';

  try {
    const respuesta = await autosApi.listar({ ...filtros, pagina, limite: 12 });
    mostrarResultados(respuesta);
  } catch (errorApi) {
    resultados.innerHTML = '';
    $('#resumen-resultados').textContent = '';
    mostrarAviso($('#avisos'), errorApi.message);
  } finally {
    resultados.removeAttribute('aria-busy');
  }
}

function mostrarResultados({ datos, total, paginas }) {
  $('#resumen-resultados').textContent =
    total === 1 ? '1 auto encontrado' : `${formatearNumero(total)} autos encontrados`;

  if (datos.length === 0) {
    $('#resultados').innerHTML = html`<div class="col-12"><div class="vacio">
      <h2 class="h3">No hay autos con esos filtros</h2>
      <p>Probá ampliar el rango de precio o de kilometraje, o limpiá los filtros.</p></div></div>`;
  } else {
    renderizarGrilla($('#resultados'), datos);
  }

  const navegacion = $('#paginacion');
  navegacion.hidden = paginas <= 1;
  $('#pagina-actual').textContent = `Página ${pagina} de ${paginas}`;
  navegacion.querySelector('[data-pagina="anterior"]').disabled = pagina <= 1;
  navegacion.querySelector('[data-pagina="siguiente"]').disabled = pagina >= paginas;
}
