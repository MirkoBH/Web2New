import { escapeHtml, formatKm, formatUsd } from "../utils/dom.js";
import { getKey, readJson, writeJson, readSession, getModo } from "../utils/storage.js";

function obtenerFavoritos() {
  const sesion = readSession();
  if (!sesion) return new Set();
  const favoritos = readJson(getKey("WISHLIST"), []);
  return new Set(favoritos.filter((x) => x.userId === sesion.userId).map((x) => x.carId));
}

function estaEnComparador(idAuto) {
  return readJson(getKey("COMPARE"), []).includes(idAuto);
}

export function toggleCompare(idAuto) {
  const comparador = readJson(getKey("COMPARE"), []);
  if (comparador.includes(idAuto)) {
    writeJson(getKey("COMPARE"), comparador.filter((id) => id !== idAuto));
    return;
  }
  if (comparador.length >= 2) {
    window.alert("Solo podés comparar 2 autos a la vez.");
    return;
  }
  writeJson(getKey("COMPARE"), [...comparador, idAuto]);
}

export function toggleWishlist(idAuto) {
  const sesion = readSession();
  if (!sesion) {
    window.alert("Debés iniciar sesión para usar favoritos.");
    return;
  }
  const favoritos = readJson(getKey("WISHLIST"), []);
  const existe    = favoritos.find((x) => x.userId === sesion.userId && x.carId === idAuto);
  if (existe) {
    writeJson(getKey("WISHLIST"), favoritos.filter((x) => !(x.userId === sesion.userId && x.carId === idAuto)));
  } else {
    writeJson(getKey("WISHLIST"), [...favoritos, { userId: sesion.userId, carId: idAuto }]);
  }
}

function claseEstadoIA(estado) {
  if (!estado) return "text-bg-secondary";
  const e = estado.toLowerCase();
  if (e.includes("excelente")) return "text-bg-success";
  if (e.includes("buen"))      return "text-bg-primary";
  if (e.includes("regular"))   return "text-bg-warning";
  return "text-bg-danger";
}

export function carCardTemplate(auto) {
  const sesion       = readSession();
  const modo         = getModo();
  const favoritos    = obtenerFavoritos();
  const enComparador = estaEnComparador(auto.id);
  const estadoIA     = auto.ia?.estado || auto.iaEstado || "Sin análisis";

  // ── Reglas de negocio ──────────────────────────────────────
  const esElDuenio   = sesion && auto.vendedorId === sesion.userId;
  const puedeFav     = sesion && !esElDuenio && modo === "comprador";
  const puedeCompar  = !esElDuenio; // comparar disponible para todos menos el dueño
  const portada      = auto.imagenes?.[0] || "https://via.placeholder.com/400x220?text=Sin+foto";

  return `
    <article class="car-card card h-100 border-0 shadow-sm">
      <img src="${escapeHtml(portada)}" class="card-img-top car-cover"
        alt="${escapeHtml(auto.marca)} ${escapeHtml(auto.modelo)}" loading="lazy" />
      <div class="card-body d-flex flex-column" style="min-height:220px">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <h5 class="card-title mb-0">${escapeHtml(auto.marca)} ${escapeHtml(auto.modelo)}</h5>
          <span class="badge ${claseEstadoIA(estadoIA)}" style="font-size:.65rem">${escapeHtml(estadoIA)}</span>
        </div>
        <p class="text-secondary mb-1 small">${escapeHtml(auto.ubicacion)} · ${auto.anio} · ${formatKm(auto.kilometraje)}</p>
        <p class="text-danger fw-semibold fs-5 mb-2">${formatUsd(auto.precio)}</p>
        <p class="small text-secondary flex-grow-1 mb-3"
          style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
          ${escapeHtml(auto.descripcion)}
        </p>
        <div class="d-flex gap-2 mt-auto">
          <a href="detalle.html?id=${encodeURIComponent(auto.id)}"
            class="btn btn-outline-light btn-sm flex-grow-1">Ver detalle</a>
          ${puedeCompar ? `
            <button class="btn btn-danger btn-sm btn-compare"
              data-id="${escapeHtml(auto.id)}" data-activo="${enComparador}">
              ${enComparador ? "Quitar" : "Comparar"}
            </button>` : ""}
          ${puedeFav ? `
            <button class="btn btn-outline-danger btn-sm btn-favorito"
              data-id="${escapeHtml(auto.id)}"
              title="${favoritos.has(auto.id) ? "Quitar de favoritos" : "Agregar a favoritos"}">
              ${favoritos.has(auto.id) ? "★" : "☆"}
            </button>` : ""}
          ${esElDuenio ? `
            <a href="editar.html?id=${escapeHtml(auto.id)}"
              class="btn btn-outline-light btn-sm">Editar</a>` : ""}
        </div>
      </div>
    </article>`;
}
