import { initAppShell } from "../app-init.js";
import { getCars, getUsers } from "../data/mock-data.js";
import { formatKm, formatUsd, qs } from "../utils/dom.js";
import { getKey, readJson, readSession, writeJson } from "../utils/storage.js";

initAppShell();

// ── Inicialización ────────────────────────────────────────────
const contenedor = qs("#detalle-mount");
const sesion = readSession();
const params = new URLSearchParams(window.location.search);
const idAuto = params.get("id");
const auto = getCars().find((x) => x.id === idAuto);

if (!auto) {
  contenedor.innerHTML = '<div class="alert alert-danger">No se encontró la publicación.</div>';
} else {
  const vendedor = getUsers().find((u) => u.id === auto.vendedorId);
  const puntajeIA = auto.ia?.score ?? 0;
  const porcentajePuntaje = Math.min(100, (puntajeIA / 10) * 100);

  // ── Badge de estado IA por color ─────────────────────────────
  function obtenerClaseBadgeEstado(estado) {
    if (!estado) return "text-bg-secondary";
    const e = estado.toLowerCase();
    if (e.includes("excelente")) return "text-bg-success";
    if (e.includes("buen")) return "text-bg-primary";
    if (e.includes("regular")) return "text-bg-warning";
    return "text-bg-danger";
  }

  contenedor.innerHTML = `
    <div class="row g-4">

      <!-- ── Galería de imágenes ──────────────────────────────── -->
      <div class="col-lg-7">
        <section class="glass-panel p-3">
          <img
            src="${auto.imagenes[0]}"
            alt="${auto.marca} ${auto.modelo}"
            class="w-100 rounded mb-3"
            style="max-height:400px;object-fit:cover;"
          />
          <div class="row g-2">
            ${auto.imagenes
              .map(
                (img, i) => `
              <div class="col-4">
                <img
                  src="${img}"
                  class="w-100 rounded"
                  style="height:95px;object-fit:cover;cursor:pointer;opacity:${i === 0 ? 1 : 0.7};transition:opacity 200ms"
                  onmouseover="this.style.opacity=1"
                  onmouseout="this.style.opacity=${i === 0 ? 1 : 0.7}"
                  alt="Foto ${i + 1} de ${auto.marca} ${auto.modelo}"
                />
              </div>`
              )
              .join("")}
          </div>
        </section>
      </div>

      <!-- ── Ficha técnica ─────────────────────────────────────── -->
      <div class="col-lg-5">
        <section class="glass-panel p-4 mb-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h1 class="h3 mb-0">${auto.marca} ${auto.modelo}</h1>
            <span class="badge ${obtenerClaseBadgeEstado(auto.ia?.estado)}">${auto.ia?.estado || "Sin análisis"}</span>
          </div>
          <p class="h4 text-danger fw-bold mb-3">${formatUsd(auto.precio)}</p>

          <div class="separador-rojo"></div>

          <ul class="list-unstyled mb-3" style="font-size:0.875rem">
            <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
              <span class="text-secondary">Año</span>
              <span class="fw-500">${auto.anio}</span>
            </li>
            <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
              <span class="text-secondary">Kilometraje</span>
              <span>${formatKm(auto.kilometraje)}</span>
            </li>
            <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
              <span class="text-secondary">Combustible</span>
              <span>${auto.combustible}</span>
            </li>
            <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
              <span class="text-secondary">Transmisión</span>
              <span>${auto.transmision}</span>
            </li>
            <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
              <span class="text-secondary">Color</span>
              <span>${auto.color || "—"}</span>
            </li>
            <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
              <span class="text-secondary">Ubicación</span>
              <span>${auto.ubicacion}</span>
            </li>
            <li class="d-flex justify-content-between py-1">
              <span class="text-secondary">Vendedor</span>
              <span>${vendedor?.nombre || "Sin datos"}</span>
            </li>
          </ul>

          <p class="small text-secondary mb-2">${auto.descripcion}</p>
          <p class="small mb-0">
            <strong>Daños informados:</strong>
            <span class="text-secondary"> ${auto.detallesDanios}</span>
          </p>
        </section>

        <!-- ── Informe IA ───────────────────────────────────── -->
        <section class="glass-panel p-4">
          <h2 class="h5 mb-3">Informe de IA</h2>

          <div class="d-flex align-items-center gap-3 mb-3">
            <span class="puntaje-ia">${puntajeIA}</span>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between mb-1">
                <small class="text-secondary">Puntaje</small>
                <small class="text-secondary">/ 10</small>
              </div>
              <div class="barra-puntaje">
                <div class="barra-puntaje-relleno" style="width:${porcentajePuntaje}%"></div>
              </div>
            </div>
          </div>

          <p class="small text-secondary mb-2">${auto.ia.resumen}</p>
          <p class="small mb-1">
            <strong>Daños detectados:</strong>
            <span class="text-secondary"> ${auto.ia.danios}</span>
          </p>
          <p class="small mb-0">
            <strong>Rango sugerido:</strong>
            <span class="text-danger"> ${formatUsd(auto.ia.rangoPrecioMin)} – ${formatUsd(auto.ia.rangoPrecioMax)}</span>
          </p>
        </section>
      </div>
    </div>

    <!-- ── Sección de consultas ───────────────────────────────── -->
    <section class="glass-panel p-4 mt-4">
      <h2 class="h5 mb-3">Consultas públicas</h2>
      <div id="listado-consultas" class="d-grid gap-2 mb-3"></div>
      <form id="formulario-consulta" class="d-grid gap-2 ${sesion?.role === "comprador" ? "" : "d-none"}">
        <textarea
          class="form-control"
          id="texto-consulta"
          rows="3"
          minlength="8"
          placeholder="Escribí tu consulta al vendedor..."
        ></textarea>
        <button class="btn btn-danger" type="submit">Enviar consulta</button>
      </form>
      <p class="small text-secondary ${sesion ? "d-none" : ""}">
        Debés <a href="login.html" class="text-danger">iniciar sesión</a> para enviar consultas.
      </p>
    </section>
  `;

  // ── Renderizado de consultas ──────────────────────────────────
  const listaConsultas = qs("#listado-consultas");

  function renderizarConsultas() {
    const consultas = readJson(getKey("QUESTIONS"), []).filter((q) => q.carId === auto.id);

    if (consultas.length === 0) {
      listaConsultas.innerHTML = '<p class="small text-secondary mb-0">Aún no hay consultas para esta publicación.</p>';
      return;
    }

    listaConsultas.innerHTML = consultas
      .map(
        (consulta) => `
          <article class="p-3 rounded item-consulta">
            <p class="mb-1 small"><strong>${consulta.userName}</strong> pregunta:</p>
            <p class="small mb-2 text-secondary">${consulta.question}</p>
            ${
              consulta.answer
                ? `<p class="mb-1 small"><strong>Respuesta del vendedor:</strong></p>
                   <p class="small text-secondary mb-0">${consulta.answer}</p>`
                : '<p class="small text-secondary mb-0">Sin respuesta aún.</p>'
            }
          </article>
        `
      )
      .join("");
  }

  renderizarConsultas();
  setInterval(renderizarConsultas, 6000);

  // ── Envío de consulta ─────────────────────────────────────────
  const formularioConsulta = qs("#formulario-consulta");
  if (formularioConsulta) {
    formularioConsulta.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const texto = qs("#texto-consulta").value.trim();
      if (texto.length < 8) return;

      const consultas = readJson(getKey("QUESTIONS"), []);
      consultas.push({
        id: crypto.randomUUID(),
        carId: auto.id,
        sellerId: auto.vendedorId,
        userId: sesion.userId,
        userName: sesion.nombre,
        question: texto,
        answer: "",
        createdAt: new Date().toISOString()
      });

      writeJson(getKey("QUESTIONS"), consultas);
      qs("#texto-consulta").value = "";
      renderizarConsultas();
    });
  }
}
