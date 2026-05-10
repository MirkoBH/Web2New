import { escapeHtml, formatKm, formatUsd } from "../utils/dom.js";
import { getKey, readJson, writeJson, readSession } from "../utils/storage.js";

// ── Obtener favoritos del usuario actual ──────────────────────
function obtenerFavoritos() {
  const sesion = readSession();
  if (!sesion) return new Set();
  const favoritos = readJson(getKey("WISHLIST"), []);
  return new Set(favoritos.filter((x) => x.userId === sesion.userId).map((x) => x.carId));
}

// ── Verificar si un auto está en comparador ───────────────────
function estaEnComparador(idAuto) {
  const comparador = readJson(getKey("COMPARE"), []);
  return comparador.includes(idAuto);
}

// ── Alternar auto en comparador ───────────────────────────────
export function toggleCompare(idAuto) {
  const comparador = readJson(getKey("COMPARE"), []);

  if (comparador.includes(idAuto)) {
    writeJson(
      getKey("COMPARE"),
      comparador.filter((id) => id !== idAuto)
    );
    return;
  }

  if (comparador.length >= 2) {
    window.alert("Solo podés comparar 2 autos a la vez.");
    return;
  }

  writeJson(getKey("COMPARE"), [...comparador, idAuto]);
}

// ── Alternar auto en favoritos ────────────────────────────────
export function toggleWishlist(idAuto) {
  const sesion = readSession();
  if (!sesion || sesion.role !== "comprador") {
    window.alert("Debés iniciar sesión como comprador para usar favoritos.");
    return;
  }

  const favoritos = readJson(getKey("WISHLIST"), []);
  const existe = favoritos.find((x) => x.userId === sesion.userId && x.carId === idAuto);

  if (existe) {
    writeJson(
      getKey("WISHLIST"),
      favoritos.filter((x) => !(x.userId === sesion.userId && x.carId === idAuto))
    );
  } else {
    writeJson(getKey("WISHLIST"), [...favoritos, { userId: sesion.userId, carId: idAuto }]);
  }
}

// ── Badge de estado por color ─────────────────────────────────
function claseEstadoIA(estado) {
  if (!estado) return "text-bg-secondary";
  const e = estado.toLowerCase();
  if (e.includes("excelente")) return "text-bg-success";
  if (e.includes("buen")) return "text-bg-primary";
  if (e.includes("regular")) return "text-bg-warning";
  return "text-bg-danger";
}

// ── Plantilla HTML de tarjeta de auto ─────────────────────────
export function carCardTemplate(auto) {
  const favoritos = obtenerFavoritos();
  const enComparador = estaEnComparador(auto.id);
  const estadoIA = auto.ia?.estado || "Sin análisis";

  return `
    <article class="car-card card h-100 border-0 shadow-sm">
      <img
        src="${escapeHtml(auto.imagenes[0])}"
        class="card-img-top car-cover"
        alt="${escapeHtml(auto.marca)} ${escapeHtml(auto.modelo)}"
        loading="lazy"
      />
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <h5 class="card-title mb-0">${escapeHtml(auto.marca)} ${escapeHtml(auto.modelo)}</h5>
          <span class="badge ${claseEstadoIA(estadoIA)}" style="font-size:0.65rem">${escapeHtml(estadoIA)}</span>
        </div>
        <p class="text-secondary mb-1 small">${escapeHtml(auto.ubicacion)} · ${auto.anio} · ${formatKm(auto.kilometraje)}</p>
        <p class="text-danger fw-semibold fs-5 mb-2">${formatUsd(auto.precio)}</p>
        <p class="small text-secondary flex-grow-1 mb-3" style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
          ${escapeHtml(auto.descripcion)}
        </p>
        <div class="d-flex gap-2 mt-auto">
          <a href="detalle.html?id=${encodeURIComponent(auto.id)}" class="btn btn-outline-light btn-sm flex-grow-1">Ver detalle</a>
          <button
            class="btn btn-danger btn-sm btn-compare"
            data-id="${escapeHtml(auto.id)}"
            data-activo="${enComparador}"
          >${enComparador ? "Quitar" : "Comparar"}</button>
          <button
            class="btn btn-outline-danger btn-sm btn-favorito"
            data-id="${escapeHtml(auto.id)}"
            title="${favoritos.has(auto.id) ? "Quitar de favoritos" : "Agregar a favoritos"}"
          >${favoritos.has(auto.id) ? "★" : "☆"}</button>
        </div>
      </div>
    </article>
  `;
}
