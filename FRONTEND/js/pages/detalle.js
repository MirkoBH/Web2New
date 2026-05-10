import { initAppShell } from "../app-init.js";
import { carsApi, consultasApi } from "../utils/api.js";
import { formatKm, formatUsd, qs } from "../utils/dom.js";
import { readSession } from "../utils/storage.js";

initAppShell();

const contenedor = qs("#detalle-mount");
const sesion     = readSession();
const idAuto     = new URLSearchParams(window.location.search).get("id");

if (!idAuto) {
  contenedor.innerHTML = `<div class="alert alert-danger">ID de publicación no válido.</div>`;
} else {
  contenedor.innerHTML = `<div class="text-secondary py-5 text-center">Cargando publicación...</div>`;

  carsApi.obtener(idAuto).then((auto) => {
    // Normalizar imágenes (array de objetos ImagenAuto)
    const imagenes = (auto.imagenes || [])
      .sort((a, b) => a.orden - b.orden)
      .map((img) => (typeof img === "string" ? img : img.urlPublica));

    const vendedor   = auto.vendedor;
    const puntajeIA  = auto.iaPuntaje ?? 0;
    const porcentaje = Math.min(100, (puntajeIA / 10) * 100);

    function claseEstado(estado) {
      if (!estado) return "text-bg-secondary";
      const e = estado.toLowerCase();
      if (e.includes("excelente")) return "text-bg-success";
      if (e.includes("buen"))      return "text-bg-primary";
      if (e.includes("regular"))   return "text-bg-warning";
      return "text-bg-danger";
    }

    // Imagen principal y miniaturas
    let imagenPrincipal = imagenes[0] || "https://via.placeholder.com/800x400?text=Sin+imagen";

    contenedor.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <section class="glass-panel p-3">
            <img id="img-principal" src="${imagenPrincipal}" alt="${auto.marca} ${auto.modelo}"
              class="w-100 rounded mb-3" style="max-height:420px;object-fit:cover;" />
            <div class="row g-2">
              ${imagenes.map((url, i) => `
                <div class="col-4">
                  <img src="${url}" class="w-100 rounded miniatura-auto"
                    style="height:95px;object-fit:cover;cursor:pointer;opacity:${i === 0 ? 1 : 0.65};transition:opacity 200ms"
                    data-url="${url}" alt="Foto ${i + 1}" />
                </div>`).join("")}
            </div>
          </section>
        </div>

        <div class="col-lg-5">
          <section class="glass-panel p-4 mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h1 class="h3 mb-0">${auto.marca} ${auto.modelo}</h1>
              ${auto.iaEstado ? `<span class="badge ${claseEstado(auto.iaEstado)}">${auto.iaEstado}</span>` : ""}
            </div>
            <p class="h4 text-danger fw-bold mb-3">${formatUsd(auto.precio)}</p>
            <div class="separador-rojo"></div>
            <ul class="list-unstyled mb-3" style="font-size:.875rem">
              ${[
                ["Año",          auto.anio],
                ["Kilometraje",  formatKm(auto.kilometraje)],
                ["Combustible",  auto.combustible],
                ["Transmisión",  auto.transmision],
                ["Color",        auto.color || "—"],
                ["Ubicación",    auto.ubicacion],
                ["Vendedor",     vendedor?.nombre || "Sin datos"],
              ].map(([k, v]) => `
                <li class="d-flex justify-content-between py-1 border-bottom border-white border-opacity-10">
                  <span class="text-secondary">${k}</span><span>${v}</span>
                </li>`).join("")}
            </ul>
            <p class="small text-secondary mb-2">${auto.descripcion}</p>
            <p class="small mb-0"><strong>Daños informados:</strong> <span class="text-secondary">${auto.detallesDanios || "Ninguno"}</span></p>
          </section>

          ${auto.iaEstado ? `
          <section class="glass-panel p-4">
            <h2 class="h5 mb-3">Informe de IA</h2>
            <div class="d-flex align-items-center gap-3 mb-3">
              <span class="puntaje-ia">${puntajeIA}</span>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between mb-1">
                  <small class="text-secondary">Puntaje</small><small class="text-secondary">/ 10</small>
                </div>
                <div class="barra-puntaje"><div class="barra-puntaje-relleno" style="width:${porcentaje}%"></div></div>
              </div>
            </div>
            <p class="small text-secondary mb-2">${auto.iaResumen}</p>
            <p class="small mb-1"><strong>Daños detectados:</strong> <span class="text-secondary">${auto.iaDanios}</span></p>
            <p class="small mb-0"><strong>Rango sugerido:</strong> <span class="text-danger">${formatUsd(auto.iaRangoPrecioMin)} – ${formatUsd(auto.iaRangoPrecioMax)}</span></p>
          </section>` : ""}
        </div>
      </div>

      <section class="glass-panel p-4 mt-4">
        <h2 class="h5 mb-3">Consultas públicas</h2>
        <div id="listado-consultas" class="d-grid gap-2 mb-3"></div>
        ${sesion?.role === "comprador" ? `
          <form id="formulario-consulta" class="d-grid gap-2">
            <textarea class="form-control" id="texto-consulta" rows="3" minlength="8"
              placeholder="Escribí tu consulta al vendedor..."></textarea>
            <button class="btn btn-danger" type="submit">Enviar consulta</button>
          </form>` : `
          <p class="small text-secondary">
            ${sesion ? "Solo los compradores pueden enviar consultas." : 
              'Debés <a href="login.html" class="text-danger">iniciar sesión</a> como comprador para enviar consultas.'}
          </p>`}
      </section>`;

    // ── Cambio de imagen principal al hacer click en miniatura ──
    document.querySelectorAll(".miniatura-auto").forEach((img) => {
      img.addEventListener("click", () => {
        qs("#img-principal").src = img.dataset.url;
        document.querySelectorAll(".miniatura-auto").forEach((m) => m.style.opacity = "0.65");
        img.style.opacity = "1";
      });
    });

    // ── Cargar y renderizar consultas ───────────────────────────
    async function renderConsultas() {
      const lista = qs("#listado-consultas");
      if (!lista) return;
      try {
        const consultas = await consultasApi.porAuto(idAuto);
        if (!consultas.length) {
          lista.innerHTML = `<p class="small text-secondary mb-0">Aún no hay consultas para esta publicación.</p>`;
          return;
        }
        lista.innerHTML = consultas.map((c) => `
          <article class="p-3 rounded item-consulta">
            <p class="mb-1 small"><strong>${c.comprador?.nombre || "Comprador"}</strong> pregunta:</p>
            <p class="small mb-2 text-secondary">${c.pregunta}</p>
            ${c.respuesta
              ? `<p class="small mb-1"><strong>Respuesta del vendedor:</strong></p><p class="small text-secondary mb-0">${c.respuesta}</p>`
              : `<p class="small text-secondary mb-0">Sin respuesta aún.</p>`}
          </article>`).join("");
      } catch {
        lista.innerHTML = `<p class="small text-secondary mb-0">No se pudieron cargar las consultas.</p>`;
      }
    }

    renderConsultas();

    // ── Enviar consulta ─────────────────────────────────────────
    const formConsulta = qs("#formulario-consulta");
    if (formConsulta) {
      formConsulta.addEventListener("submit", async (e) => {
        e.preventDefault();
        const texto = qs("#texto-consulta").value.trim();
        if (texto.length < 8) return;
        const btn = formConsulta.querySelector("button");
        btn.disabled = true;
        try {
          await consultasApi.crear({ autoId: idAuto, pregunta: texto });
          qs("#texto-consulta").value = "";
          await renderConsultas();
        } catch (err) {
          alert(err.message);
        } finally {
          btn.disabled = false;
        }
      });
    }
  }).catch((err) => {
    contenedor.innerHTML = `<div class="alert alert-danger">No se encontró la publicación: ${err.message}</div>`;
  });
}
