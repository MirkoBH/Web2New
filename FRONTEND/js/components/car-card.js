import { escapeHtml, formatKm, formatUsd } from "../utils/dom.js";
import { getKey, readJson, writeJson, readSession } from "../utils/storage.js";

function getWishlistSet() {
  const session = readSession();
  if (!session) return new Set();
  const wishlist = readJson(getKey("WISHLIST"), []);
  return new Set(wishlist.filter((x) => x.userId === session.userId).map((x) => x.carId));
}

function isCompared(carId) {
  const compared = readJson(getKey("COMPARE"), []);
  return compared.includes(carId);
}

export function toggleCompare(carId) {
  const compared = readJson(getKey("COMPARE"), []);
  if (compared.includes(carId)) {
    writeJson(
      getKey("COMPARE"),
      compared.filter((id) => id !== carId)
    );
    return;
  }

  if (compared.length >= 2) {
    window.alert("Solo puedes comparar 2 autos al mismo tiempo.");
    return;
  }

  writeJson(getKey("COMPARE"), [...compared, carId]);
}

export function toggleWishlist(carId) {
  const session = readSession();
  if (!session || session.role !== "comprador") {
    window.alert("Debes iniciar sesion como comprador para usar la lista de deseos.");
    return;
  }

  const wishlist = readJson(getKey("WISHLIST"), []);
  const exists = wishlist.find((x) => x.userId === session.userId && x.carId === carId);

  if (exists) {
    writeJson(
      getKey("WISHLIST"),
      wishlist.filter((x) => !(x.userId === session.userId && x.carId === carId))
    );
  } else {
    writeJson(getKey("WISHLIST"), [...wishlist, { userId: session.userId, carId }]);
  }
}

export function carCardTemplate(car) {
  const wishlistSet = getWishlistSet();

  return `
    <article class="car-card card h-100 border-0 shadow-sm">
      <img src="${escapeHtml(car.imagenes[0])}" class="card-img-top car-cover" alt="${escapeHtml(car.marca)} ${escapeHtml(car.modelo)}" />
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start">
          <h5 class="card-title mb-1">${escapeHtml(car.marca)} ${escapeHtml(car.modelo)}</h5>
          <span class="badge text-bg-dark">${escapeHtml(car.ia?.estado || "Sin IA")}</span>
        </div>
        <p class="text-secondary mb-2 small">${escapeHtml(car.ubicacion)} · ${car.anio} · ${formatKm(car.kilometraje)}</p>
        <p class="text-danger fw-semibold fs-5 mb-2">${formatUsd(car.precio)}</p>
        <p class="small text-secondary flex-grow-1">${escapeHtml(car.descripcion)}</p>
        <div class="d-flex gap-2 mt-auto">
          <a href="detalle.html?id=${encodeURIComponent(car.id)}" class="btn btn-outline-light btn-sm flex-grow-1">Ver detalle</a>
          <button class="btn btn-danger btn-sm btn-compare" data-id="${escapeHtml(car.id)}" data-active="${isCompared(car.id)}">${isCompared(car.id) ? "Quitar" : "Comparar"}</button>
          <button class="btn btn-outline-danger btn-sm btn-wishlist" data-id="${escapeHtml(car.id)}">${wishlistSet.has(car.id) ? "Guardado" : "Deseo"}</button>
        </div>
      </div>
    </article>
  `;
}
