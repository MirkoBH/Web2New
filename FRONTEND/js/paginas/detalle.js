import { dibujarRangos, panelTasacion } from '../componentes/tasacion.js';
import { conectarAcciones } from '../componentes/tarjeta-auto.js';
import { autosApi, consultasApi } from '../nucleo/api.js';
import {
  $,
  crudo,
  formatearFecha,
  formatearKm,
  formatearUsd,
  html,
  ICONOS,
  limpiarAviso,
  mostrarAviso,
  parametro,
  validarFormulario,
} from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';
import { obtenerComparados, obtenerFavoritos, obtenerModo, obtenerSesion } from '../nucleo/sesion.js';

iniciarPagina({ actual: 'autos' });

const id = parametro('id');
const sesion = obtenerSesion();
const NOMBRES = { Automatico: 'Automático', Hibrido: 'Híbrido', Electrico: 'Eléctrico', Diesel: 'Diésel' };
const nombre = (valor) => NOMBRES[valor] ?? valor;

cargar();

async function cargar() {
  const contenedor = $('#detalle');
  if (!id) {
    contenedor.innerHTML = html`<div class="vacio"><h1 class="h3">No encontramos ese auto</h1><p><a class="link" href="listado.html">Ver autos</a></p></div>`;
    return;
  }
  try {
    const [auto, consultas] = await Promise.all([autosApi.obtener(id), consultasApi.listarPorAuto(id)]);
    document.title = `${auto.marca} ${auto.modelo} ${auto.anio}: AutoPulse`;
    mostrarAuto(contenedor, auto, consultas);
  } catch (error) {
    contenedor.innerHTML = html`<div class="vacio"><h1 class="h3">${error.estado === 404 ? 'Esta publicación ya no existe' : 'No pudimos cargar el auto'}</h1>
      <p>${error.estado === 404 ? 'El vendedor la borró.' : error.message}</p><p class="mt-3"><a class="link" href="listado.html">Ver autos</a></p></div>`;
  } finally {
    contenedor.removeAttribute('aria-busy');
  }
}

function mostrarAuto(contenedor, auto, consultas) {
  const titulo = `${auto.marca} ${auto.modelo}`;
  const esPropio = sesion?.id === auto.vendedorId;

  contenedor.innerHTML = html`
    <nav aria-label="Ruta" class="mb-4"><a class="link" href="listado.html">Autos</a> <span class="muted">/ ${titulo}</span></nav>
    <div class="row g-5">
      <div class="col-lg-7">${galeria(auto)}</div>
      <div class="col-lg-5">
        <p class="label">${auto.anio} · ${formatearKm(auto.kilometraje)} · ${auto.ubicacion}</p>
        <h1 class="h2 mt-2">${titulo}</h1>
        <p class="detalle__precio">${formatearUsd(auto.precio)}</p>
        ${acciones(auto, esPropio)}
        <ul class="filas mt-s6">
          ${fila('Año', auto.anio)}
          ${fila('Kilometraje', formatearKm(auto.kilometraje))}
          ${fila('Combustible', nombre(auto.combustible))}
          ${fila('Transmisión', nombre(auto.transmision))}
          ${auto.color ? fila('Color', auto.color) : ''}
          ${fila('Ubicación', auto.ubicacion)}
          ${fila('Vendedor', auto.vendedor.nombre)}
          ${fila('Publicado', formatearFecha(auto.creadoEn))}
        </ul>
      </div>
    </div>

    <div class="row g-5 bloque">
      <div class="col-lg-7">
        <section aria-labelledby="descripcion-titulo">
          <h2 id="descripcion-titulo" class="h3 mb-3">Descripción del vendedor</h2>
          <p class="measure">${auto.descripcion}</p>
          <h3 class="h5 mt-s6 mb-2">Daños declarados</h3>
          <p class="measure">${auto.detallesDanios || 'El vendedor no declaró daños.'}</p>
        </section>
        <section class="bloque" aria-labelledby="consultas-titulo">
          <h2 id="consultas-titulo">Preguntas al vendedor</h2>
          <div id="consulta-zona">${formularioConsulta(auto, esPropio)}</div>
          <div id="consultas-lista">${listaConsultas(consultas, esPropio)}</div>
        </section>
      </div>
      <div class="col-lg-5">${panelTasacion(auto)}</div>
    </div>`;

  dibujarRangos(contenedor);
  conectarGaleria(contenedor);
  conectarAcciones(contenedor);
  conectarConsultas(auto, esPropio);
  conectarEliminar(auto);
}

function fila(clave, valor) {
  return html`<li><span class="filas__clave">${clave}</span><span class="filas__valor">${valor}</span></li>`;
}

function galeria(auto) {
  const fotos = auto.imagenes;
  if (fotos.length === 0) return html`<div class="galeria__principal"></div>`;
  const titulo = `${auto.marca} ${auto.modelo} ${auto.anio}`;
  return html`
    <div class="galeria">
      <div class="galeria__principal"><img id="foto-principal" src="${fotos[0].url}" alt="${titulo}, foto 1 de ${fotos.length}" width="1200" height="900"></div>
      ${fotos.length > 1
        ? html`<div class="galeria__miniaturas" role="group" aria-label="Fotos del auto">
            ${fotos.map((foto, i) => html`<button type="button" data-foto="${i}" aria-current="${i === 0}" aria-label="Ver foto ${i + 1} de ${fotos.length}">
              <img src="${foto.url}" alt="" loading="lazy" width="160" height="120"></button>`)}
          </div>`
        : ''}
    </div>`;
}

function conectarGaleria(contenedor) {
  const principal = $('#foto-principal', contenedor);
  contenedor.querySelector('.galeria__miniaturas')?.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-foto]');
    if (!boton) return;
    const indice = Number(boton.dataset.foto);
    const miniaturas = contenedor.querySelectorAll('[data-foto]');
    principal.src = boton.querySelector('img').src;
    principal.alt = principal.alt.replace(/foto \d+/, `foto ${indice + 1}`);
    miniaturas.forEach((b) => b.setAttribute('aria-current', String(b === boton)));
  });
}

function acciones(auto, esPropio) {
  if (esPropio) {
    return html`<div class="fila-botones">
      <a class="btn-ap btn-ap--primario" href="editar.html?id=${auto.id}">Editar publicación</a>
      <button type="button" class="btn-ap btn-ap--secundario" id="eliminar">Eliminar</button>
    </div>
    <p class="estado-form" id="eliminar-estado" role="status"></p>`;
  }
  const enFavoritos = obtenerFavoritos().includes(auto.id);
  const enComparador = obtenerComparados().includes(auto.id);
  const puedeFavorito = !sesion || obtenerModo() === 'comprador';
  return html`<div class="fila-botones">
    <a class="btn-ap btn-ap--primario" href="#consultas-titulo">Preguntar al vendedor</a>
    ${puedeFavorito ? html`<button type="button" class="btn-icono" data-favorito="${auto.id}" aria-pressed="${enFavoritos}" aria-label="Guardar en favoritos">${crudo(ICONOS.corazon)}</button>` : ''}
    <button type="button" class="btn-icono" data-comparar="${auto.id}" aria-pressed="${enComparador}" aria-label="Agregar al comparador">${crudo(ICONOS.comparar)}</button>
  </div>`;
}

function conectarEliminar(auto) {
  const boton = $('#eliminar');
  if (!boton) return;
  boton.addEventListener('click', async () => {
    if (!confirmarEliminar(boton)) return;
    boton.disabled = true;
    try {
      await autosApi.eliminar(auto.id);
      location.href = 'perfil.html?eliminado=1';
    } catch (error) {
      boton.disabled = false;
      $('#eliminar-estado').textContent = error.message;
    }
  });
}

/** Pide un segundo clic para confirmar, sin usar ventanas emergentes del navegador. */
function confirmarEliminar(boton) {
  if (boton.dataset.confirmar) return true;
  boton.dataset.confirmar = 'si';
  boton.textContent = 'Confirmar: eliminar para siempre';
  $('#eliminar-estado').textContent = 'Se borran el auto, sus fotos y sus consultas. Volvé a tocar para confirmar.';
  return false;
}

// ── Consultas públicas ───────────────────────────────────────────────

function formularioConsulta(auto, esPropio) {
  if (esPropio) return html`<p class="muted mb-4">Respondé las preguntas de los compradores desde acá o desde tu panel.</p>`;
  if (!sesion) {
    const volver = encodeURIComponent(`detalle.html?id=${auto.id}`);
    return html`<p class="mb-4"><a class="link" href="login.html?volver=${volver}">Ingresá</a> para preguntarle al vendedor.</p>`;
  }
  if (obtenerModo() !== 'comprador') return html`<p class="muted mb-4">Cambiá a modo comprador, desde el encabezado, para hacer una pregunta.</p>`;
  return html`
    <form id="form-consulta" class="mb-5" novalidate>
      <label class="form-label" for="pregunta">Tu pregunta</label>
      <textarea class="form-control" id="pregunta" name="pregunta" rows="3" required minlength="8" maxlength="500"
        aria-describedby="pregunta-error pregunta-ayuda" data-error="Escribí una pregunta de al menos 8 caracteres."></textarea>
      <p class="form-text" id="pregunta-ayuda">La pregunta y la respuesta quedan a la vista de todos. Podés hacer una por aviso.</p>
      <p class="invalid-feedback" id="pregunta-error"></p>
      <button class="btn-ap btn-ap--secundario mt-3" type="submit">Enviar pregunta</button>
      <div id="consulta-aviso" class="mt-3"></div>
    </form>`;
}

function listaConsultas(consultas, esPropio) {
  if (consultas.length === 0) return html`<p class="muted">Todavía nadie preguntó por este auto.</p>`;
  return html`<div>${consultas.map((c) => html`
    <article class="consulta">
      <p class="consulta__meta">${c.comprador.nombre} · ${formatearFecha(c.creadoEn)}</p>
      <p>${c.pregunta}</p>
      ${c.respuesta
        ? html`<p class="consulta__respuesta"><span class="label d-block">Respuesta del vendedor</span>${c.respuesta}</p>`
        : esPropio
          ? html`<form class="mt-3" data-responder="${c.id}" novalidate>
              <label class="form-label" for="respuesta-${c.id}">Tu respuesta</label>
              <textarea class="form-control" id="respuesta-${c.id}" name="respuesta" rows="2" required minlength="2" maxlength="500"
                aria-describedby="respuesta-${c.id}-error" data-error="Escribí una respuesta."></textarea>
              <p class="invalid-feedback" id="respuesta-${c.id}-error"></p>
              <button class="btn-ap btn-ap--secundario btn-ap--chico mt-2" type="submit">Responder</button>
            </form>`
          : html`<p class="consulta__meta mt-2">Sin respuesta todavía.</p>`}
    </article>`)}</div>`;
}

function conectarConsultas(auto, esPropio) {
  conectarFormularioConsulta(auto, esPropio);

  // Respuestas del vendedor: un solo listener delegado en la lista.
  $('#consultas-lista').addEventListener('submit', async (evento) => {
    const formulario = evento.target.closest('[data-responder]');
    if (!formulario) return;
    evento.preventDefault();
    if (!validarFormulario(formulario)) return;
    formulario.querySelector('button').disabled = true;
    try {
      await consultasApi.responder(formulario.dataset.responder, formulario.respuesta.value.trim());
      await refrescarConsultas(auto, esPropio);
    } catch (error) {
      formulario.querySelector('.invalid-feedback').textContent = error.message;
      formulario.querySelector('button').disabled = false;
    }
  });
}

function conectarFormularioConsulta(auto, esPropio) {
  $('#form-consulta')?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!validarFormulario(formulario)) return;
    const boton = formulario.querySelector('button');
    boton.disabled = true;
    limpiarAviso($('#consulta-aviso'));
    try {
      await consultasApi.crear({ autoId: auto.id, pregunta: formulario.pregunta.value.trim() });
      await refrescarConsultas(auto, esPropio);
      mostrarAviso($('#consulta-zona'), 'Tu pregunta se publicó. El vendedor responde acá mismo.', 'success');
    } catch (error) {
      mostrarAviso($('#consulta-aviso'), error.message);
      boton.disabled = false;
    }
  });
}

async function refrescarConsultas(auto, esPropio) {
  const consultas = await consultasApi.listarPorAuto(auto.id);
  $('#consulta-zona').innerHTML = formularioConsulta(auto, esPropio);
  $('#consultas-lista').innerHTML = listaConsultas(consultas, esPropio);
  conectarFormularioConsulta(auto, esPropio);
}
