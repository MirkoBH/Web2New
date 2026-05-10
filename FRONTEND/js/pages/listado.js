import { initAppShell } from "../app-init.js";
import { carsApi } from "../utils/api.js";
import { getFallbackCatalogsFromCars, loadCatalogs } from "../data/catalogs.js";
import { setupSearchableSingleSelect } from "../utils/searchable-select.js";
import { formatUsd, qs } from "../utils/dom.js";
import { renderCards } from "../utils/cards.js";

initAppShell();

const form           = qs("#filtros-form");
const grid           = qs("#cars-grid");
const pagination     = qs("#pagination");
const precioOutput   = qs("#precio-output");
const marcaSelect    = qs("#filtro-marca");
const modeloSelect   = qs("#filtro-modelo");
const provinciaSelect = qs("#filtro-provincia");

let currentPage = 1;
let catalogs    = { brands: [], provinces: [] };
let marcaSearchable, modeloSearchable, provinciaSearchable;

function normalizeText(v) {
  return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function getModelsByBrand(brand) {
  if (!brand) return [...new Set(catalogs.brands.flatMap((e) => e.modelos || []))];
  const found = catalogs.brands.find((e) => normalizeText(e.marca) === normalizeText(brand));
  return found?.modelos || [];
}

function refreshModelsByBrand() {
  const models = getModelsByBrand(marcaSelect.value);
  if (modeloSelect.value && !models.some((m) => normalizeText(m) === normalizeText(modeloSelect.value))) {
    modeloSelect.value = "";
  }
  modeloSearchable?.render({ preserveValue: true });
}

function getFiltersFromUrl() {
  const p = new URLSearchParams(window.location.search);
  return {
    marca:      p.get("marca")      || "",
    modelo:     p.get("modelo")     || "",
    ubicacion:  p.get("provincia")  || "",
    precioMax:  Number(p.get("precioMax") || 100000),
    combustible: p.get("combustible") || "",
    transmision: p.get("transmision") || "",
    orden:      p.get("orden")      || "reciente",
    pagina:     Number(p.get("page") || 1),
    limite:     6,
  };
}

function pushFiltersToUrl(filters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, String(v)); });
  const q = p.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${q ? "?" + q : ""}`);
}

function fillForm(f) {
  marcaSelect.value     = f.marca;
  modeloSelect.value    = f.modelo;
  provinciaSelect.value = f.ubicacion;
  form.precioMax.value  = String(f.precioMax);
  form.combustible.value = f.combustible;
  form.transmision.value = f.transmision;
  form.orden.value      = f.orden;
  precioOutput.textContent = `Hasta ${formatUsd(f.precioMax)}`;
}

function renderPagination(total, pagina, limite, filters) {
  const totalPags = Math.max(1, Math.ceil(total / limite));
  pagination.innerHTML = "";
  for (let i = 1; i <= totalPags; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === pagina ? "active" : ""}`;
    li.innerHTML = `<button class="page-link">${i}</button>`;
    li.querySelector("button").addEventListener("click", () => {
      currentPage = i;
      render({ ...filters, pagina: i });
    });
    pagination.appendChild(li);
  }
}

// Mapear datos de la API al formato que espera carCardTemplate
function mapearAutoDeApi(auto) {
  return {
    ...auto,
    // imagenes es array de objetos ImagenAuto → extraer urlPublica
    imagenes: (auto.imagenes || []).map((img) => (typeof img === "string" ? img : img.urlPublica)),
    ia: auto.iaEstado ? {
      estado: auto.iaEstado,
      score:  auto.iaPuntaje,
      danios: auto.iaDanios,
      rangoPrecioMin: auto.iaRangoPrecioMin,
      rangoPrecioMax: auto.iaRangoPrecioMax,
      resumen: auto.iaResumen,
    } : null,
  };
}

async function render(filters) {
  grid.innerHTML = `<div class="text-secondary small py-4">Cargando...</div>`;
  try {
    const { datos, total, pagina, limite } = await carsApi.listar(filters);
    const autos = datos.map(mapearAutoDeApi);
    renderCards(grid, autos);
    renderPagination(total, pagina, limite, filters);
    precioOutput.textContent = `Hasta ${formatUsd(filters.precioMax)}`;
    pushFiltersToUrl({ ...filters, page: pagina });
  } catch (err) {
    grid.innerHTML = `<div class="alert alert-danger">Error cargando autos: ${err.message}</div>`;
  }
}

async function init() {
  try {
    catalogs = await loadCatalogs();
  } catch {
    catalogs = getFallbackCatalogsFromCars([]);
  }

  marcaSearchable = setupSearchableSingleSelect({
    selectEl: marcaSelect,
    defaultOptionLabel: "Todas",
    getOptions: () => catalogs.brands.map((e) => e.marca),
    onSelectionChange: () => { modeloSelect.value = ""; refreshModelsByBrand(); },
  });
  modeloSearchable = setupSearchableSingleSelect({
    selectEl: modeloSelect,
    defaultOptionLabel: "Todos",
    getOptions: () => getModelsByBrand(marcaSelect.value),
  });
  provinciaSearchable = setupSearchableSingleSelect({
    selectEl: provinciaSelect,
    defaultOptionLabel: "Todas",
    getOptions: () => catalogs.provinces,
  });

  const initial = getFiltersFromUrl();
  currentPage = initial.pagina;
  marcaSearchable.render({ preserveValue: false });
  modeloSearchable.render({ preserveValue: false });
  provinciaSearchable.render({ preserveValue: false });
  fillForm(initial);
  refreshModelsByBrand();
  await render(initial);
}

await init();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const filters = {
    marca:      marcaSelect.value,
    modelo:     modeloSelect.value,
    ubicacion:  provinciaSelect.value,
    precioMax:  Number(form.precioMax.value),
    combustible: form.combustible.value,
    transmision: form.transmision.value,
    orden:      form.orden.value,
    pagina:     1,
    limite:     6,
  };
  await render(filters);
});

form.precioMax.addEventListener("input", () => {
  precioOutput.textContent = `Hasta ${formatUsd(form.precioMax.value)}`;
});

qs("#reset-filtros").addEventListener("click", async () => {
  const reset = { marca: "", modelo: "", ubicacion: "", precioMax: 100000, combustible: "", transmision: "", orden: "reciente", pagina: 1, limite: 6 };
  fillForm(reset);
  refreshModelsByBrand();
  await render(reset);
});
