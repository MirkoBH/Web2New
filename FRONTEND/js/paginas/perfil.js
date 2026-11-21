import { etiquetaEstado } from '../componentes/tasacion.js';
import { renderizarGrilla } from '../componentes/tarjeta-auto.js';
import { autosApi, consultasApi, usuariosApi } from '../nucleo/api.js';
import {
  $,
  $$,
  formatearFecha,
  formatearKm,
  formatearUsd,
  html,
  mostrarAviso,
  parametro,
  validarFormulario,
} from '../nucleo/dom.js';
import { iniciarPagina } from '../nucleo/pagina.js';
import { actualizarSesion, exigirSesion, obtenerFavoritos, obtenerModo, quitarFavorito } from '../nucleo/sesion.js';

const sesion = exigirSesion();
const INTERVALO_CONSULTAS_MS = 60_000;
const cargando = html`<div class="esqueleto" aria-label="Cargando"></div>`;
const errorCarga = (error) => html`<div class="alert alert-danger" role="alert">${error.message}</div>`;

if (sesion) {
  iniciarPagina({ actual: 'panel' });
  const modo = obtenerModo();
  $('#panel-modo').textContent = modo === 'vendedor' ? 'Modo vendedor' : 'Modo comprador';
  $('#panel-titulo').textContent = `Hola, ${sesion.nombre.split(' ')[0]}`;
  if (parametro('eliminado')) mostrarAviso($('#avisos'), 'La publicación se eliminó.', 'success');

  const pestanas =
    modo === 'vendedor'
      ? [
          { id: 'publicaciones', titulo: 'Mis publicaciones', cargar: cargarPublicaciones },
          { id: 'consultas', titulo: 'Consultas recibidas', cargar: cargarConsultas },
          { id: 'datos', titulo: 'Mis datos', cargar: cargarDatos },
        ]
      : [
          { id: 'favoritos', titulo: 'Favoritos', cargar: cargarFavoritos },
          { id: 'datos', titulo: 'Mis datos', cargar: cargarDatos },
        ];
  armarPestanas(pestanas);
}

// ── Pestañas accesibles (role tablist) ──────────────────────────────

function armarPestanas(pestanas) {
  $('#pestanas').innerHTML = html`${pestanas.map((p, i) => html`<button type="button" role="tab" id="tab-${p.id}"
    aria-controls="panel-${p.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${p.titulo}</button>`)}`;
  $('#paneles').innerHTML = html`${pestanas.map((p, i) => html`<section role="tabpanel" id="panel-${p.id}"
    aria-labelledby="tab-${p.id}" ${i === 0 ? '' : html`hidden`}></section>`)}`;

  const cargadas = new Set();
  const mostrar = (id) => {
    for (const boton of $$('[role="tab"]')) {
      const activa = boton.id === `tab-${id}`;
      boton.setAttribute('aria-selected', String(activa));
      boton.tabIndex = activa ? 0 : -1;
    }
    for (const panel of $$('[role="tabpanel"]')) panel.hidden = panel.id !== `panel-${id}`;
    if (!cargadas.has(id)) {
      cargadas.add(id);
      pestanas.find((p) => p.id === id).cargar($(`#panel-${id}`));
    }
  };

  $('#pestanas').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[role="tab"]');
    if (boton) mostrar(boton.id.replace('tab-', ''));
  });
  $('#pestanas').addEventListener('keydown', (evento) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(evento.key)) return;
    const botones = $$('[role="tab"]');
    const actual = botones.indexOf(document.activeElement);
    const siguiente = botones[(actual + (evento.key === 'ArrowRight' ? 1 : -1) + botones.length) % botones.length];
    siguiente.focus();
    mostrar(siguiente.id.replace('tab-', ''));
  });

  const inicial = pestanas.some((p) => p.id === location.hash.slice(1)) ? location.hash.slice(1) : pestanas[0].id;
  mostrar(inicial);
}

// ── Vendedor: publicaciones ─────────────────────────────────────────

async function cargarPublicaciones(panel) {
  panel.innerHTML = cargando;
  try {
    const autos = await autosApi.listarMios();
    if (autos.length === 0) {
      panel.innerHTML = html`<div class="vacio"><h2 class="h3">Todavía no publicaste autos</h2>
        <p class="mb-4">Subí 3 fotos o más y la IA tasa tu auto al publicarlo.</p>
        <a class="btn-ap btn-ap--primario" href="publicar.html">Publicar mi auto</a></div>`;
      return;
    }
    panel.innerHTML = html`<h2 class="visually-hidden">Mis publicaciones</h2>
      ${autos.map((auto) => html`<article class="mi-auto">
        ${auto.imagenPrincipal ? html`<img src="${auto.imagenPrincipal}" alt="" loading="lazy">` : html`<span></span>`}
        <div>
          <h3 class="tarjeta__titulo"><a class="link" href="detalle.html?id=${auto.id}">${auto.marca} ${auto.modelo} ${auto.anio}</a></h3>
          <p class="tarjeta__datos mt-1">${formatearUsd(auto.precio)} · ${formatearKm(auto.kilometraje)} · Publicado el ${formatearFecha(auto.creadoEn)}</p>
          <p class="mt-1">${etiquetaEstado(auto.analisisIa.estado)}</p>
        </div>
        <div class="fila-botones">
          <a class="btn-ap btn-ap--secundario btn-ap--chico" href="editar.html?id=${auto.id}">Editar</a>
          <a class="btn-ap btn-ap--secundario btn-ap--chico" href="detalle.html?id=${auto.id}">Ver aviso</a>
        </div>
      </article>`)}
      <p class="mt-s6"><a class="btn-ap btn-ap--primario" href="publicar.html">Publicar mi auto</a></p>`;
  } catch (error) {
    panel.innerHTML = errorCarga(error);
  }
}

// ── Vendedor: consultas recibidas (se actualizan cada minuto) ──────

async function cargarConsultas(panel) {
  panel.innerHTML = cargando;
  panel.addEventListener('submit', responder);
  await refrescarConsultas(panel);
  setInterval(() => {
    // No se refresca mientras el vendedor está escribiendo una respuesta.
    if (!panel.hidden && !panel.contains(document.activeElement)) refrescarConsultas(panel);
  }, INTERVALO_CONSULTAS_MS);
}

async function refrescarConsultas(panel) {
  try {
    const consultas = await consultasApi.listarRecibidas();
    const pendientes = consultas.filter((c) => !c.respuesta).length;
    $('#tab-consultas').textContent = pendientes ? `Consultas recibidas (${pendientes})` : 'Consultas recibidas';
    if (consultas.length === 0) {
      panel.innerHTML = html`<div class="vacio"><h2 class="h3">Sin consultas por ahora</h2><p>Cuando un comprador pregunte por uno de tus autos, aparece acá.</p></div>`;
      return;
    }
    panel.innerHTML = html`<h2 class="visually-hidden">Consultas recibidas</h2>
      <p class="muted mb-4" aria-live="polite">${pendientes === 1 ? '1 consulta sin responder' : `${pendientes} consultas sin responder`}. La lista se actualiza sola cada minuto.</p>
      ${consultas.map((c) => html`<article class="consulta">
        <p class="consulta__meta"><a class="link" href="detalle.html?id=${c.auto.id}">${c.auto.marca} ${c.auto.modelo} ${c.auto.anio}</a> · ${c.comprador.nombre} · ${formatearFecha(c.creadoEn)}</p>
        <p>${c.pregunta}</p>
        ${c.respuesta
          ? html`<p class="consulta__respuesta"><span class="label d-block">Tu respuesta</span>${c.respuesta}</p>`
          : html`<form class="mt-3" data-responder="${c.id}" novalidate>
              <label class="form-label" for="respuesta-${c.id}">Tu respuesta</label>
              <textarea class="form-control" id="respuesta-${c.id}" name="respuesta" rows="2" required minlength="2" maxlength="500"
                aria-describedby="respuesta-${c.id}-error" data-error="Escribí una respuesta."></textarea>
              <p class="invalid-feedback" id="respuesta-${c.id}-error"></p>
              <button class="btn-ap btn-ap--secundario btn-ap--chico mt-2" type="submit">Responder</button>
            </form>`}
      </article>`)}`;
  } catch (error) {
    panel.innerHTML = errorCarga(error);
  }
}

async function responder(evento) {
  const formulario = evento.target.closest('[data-responder]');
  if (!formulario) return;
  evento.preventDefault();
  if (!validarFormulario(formulario)) return;
  const boton = formulario.querySelector('button');
  boton.disabled = true;
  try {
    await consultasApi.responder(formulario.dataset.responder, formulario.respuesta.value.trim());
    await refrescarConsultas($('#panel-consultas'));
  } catch (error) {
    formulario.querySelector('.invalid-feedback').textContent = error.message;
    boton.disabled = false;
  }
}

// ── Comprador: favoritos ────────────────────────────────────────────

async function cargarFavoritos(panel) {
  const ids = obtenerFavoritos();
  if (ids.length === 0) {
    panel.innerHTML = html`<div class="vacio"><h2 class="h3">No guardaste favoritos</h2>
      <p class="mb-4">Tocá el corazón de un auto para guardarlo acá y compararlo después.</p>
      <a class="btn-ap btn-ap--secundario" href="listado.html">Ver autos</a></div>`;
    return;
  }
  panel.innerHTML = cargando;
  const autos = await Promise.all(ids.map((id) => autosApi.obtener(id).catch(() => null)));
  // Los autos que el vendedor borró se sacan de la lista.
  autos.forEach((auto, i) => { if (!auto) quitarFavorito(ids[i]); });
  const vigentes = autos.filter(Boolean).map((auto) => ({ ...auto, imagenPrincipal: auto.imagenes[0]?.url ?? null }));
  if (vigentes.length === 0) return cargarFavoritos(panel);

  panel.innerHTML = html`<h2 class="visually-hidden">Favoritos</h2><p class="muted mb-4">Usá el botón de comparar de dos autos para verlos lado a lado.</p><div class="row g-4"></div>`;
  renderizarGrilla(panel.querySelector('.row'), vigentes);
}

// ── Datos de la cuenta ──────────────────────────────────────────────

async function cargarDatos(panel) {
  panel.innerHTML = cargando;
  let perfil;
  try {
    perfil = await usuariosApi.obtenerPerfil();
  } catch (error) {
    panel.innerHTML = errorCarga(error);
    return;
  }
  panel.innerHTML = html`<div class="form-angosto">
    <h2 class="h3 mb-4">Mis datos</h2>
    <form id="form-datos" novalidate>
      <div class="mb-4">
        <label class="form-label" for="email">Email</label>
        <input class="form-control" id="email" type="email" value="${perfil.email}" readonly aria-describedby="email-ayuda">
        <p class="form-text" id="email-ayuda">El email no se puede cambiar.</p>
      </div>
      <div class="mb-4">
        <label class="form-label" for="nombre">Nombre y apellido</label>
        <input class="form-control" id="nombre" name="nombre" type="text" value="${perfil.nombre}" required minlength="3" maxlength="80"
          autocomplete="name" aria-describedby="nombre-error" data-error="Escribí tu nombre (al menos 3 letras).">
        <p class="invalid-feedback" id="nombre-error"></p>
      </div>
      <div class="mb-4">
        <label class="form-label" for="telefono">Teléfono (opcional)</label>
        <input class="form-control" id="telefono" name="telefono" type="tel" value="${perfil.telefono ?? ''}" maxlength="30"
          pattern="[+0-9 \\(\\)\\-]{8,30}" autocomplete="tel" aria-describedby="telefono-error" data-error="Usá solo números, espacios y + ( ) -, mínimo 8.">
        <p class="invalid-feedback" id="telefono-error"></p>
      </div>
      <button class="btn-ap btn-ap--primario" type="submit">Guardar datos</button>
      <p class="estado-form" id="datos-estado" role="status"></p>
    </form></div>`;

  $('#form-datos').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!validarFormulario(formulario)) return;
    const boton = formulario.querySelector('button');
    boton.disabled = true;
    $('#datos-estado').textContent = 'Guardando…';
    try {
      const actualizado = await usuariosApi.actualizarPerfil({
        nombre: formulario.nombre.value.trim(),
        telefono: formulario.telefono.value.trim(),
      });
      actualizarSesion({ nombre: actualizado.nombre, telefono: actualizado.telefono });
      $('#datos-estado').textContent = 'Tus datos se guardaron.';
    } catch (error) {
      $('#datos-estado').textContent = error.message;
    } finally {
      boton.disabled = false;
    }
  });
}
