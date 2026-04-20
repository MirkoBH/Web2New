import { initAppShell } from "../app-init.js";
import { getFallbackCatalogsFromCars, loadCatalogs } from "../data/catalogs.js";
import { getCars } from "../data/mock-data.js";
import { setupSearchableSingleSelect } from "../utils/searchable-select.js";
import { formatUsd, qs } from "../utils/dom.js";
import { renderCards } from "../utils/cards.js";

initAppShell();

const form = qs("#filtros-form");
const grid = qs("#cars-grid");
const pagination = qs("#pagination");
const precioOutput = qs("#precio-output");
const marcaSelect = qs("#filtro-marca");
const modeloSelect = qs("#filtro-modelo");
const provinciaSelect = qs("#filtro-provincia");
const perPage = 6;

let currentPage = 1;
let catalogs = {
  brands: [],
  provinces: []
};
let marcaSearchable;
let modeloSearchable;
let provinciaSearchable;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getModelsByBrand(brand) {
  if (!brand) {
    const allModels = catalogs.brands.flatMap((entry) => entry.modelos || []);
    return [...new Set(allModels)];
  }

  const selectedBrand = catalogs.brands.find((entry) => normalizeText(entry.marca) === normalizeText(brand));
  return selectedBrand?.modelos || [];
}

function refreshModelDatalistByBrand() {
  const models = getModelsByBrand(marcaSelect.value);

  if (modeloSelect.value) {
    const isStillValid = models.some((model) => normalizeText(model) === normalizeText(modeloSelect.value));
    if (!isStillValid) {
      modeloSelect.value = "";
    }
  }

  modeloSearchable?.render({ preserveValue: true });
}

function getFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") || "",
    marca: params.get("marca") || "",
    modelo: params.get("modelo") || "",
    provincia: params.get("provincia") || "",
    precioMax: Number(params.get("precioMax") || 100000),
    combustible: params.get("combustible") || "",
    transmision: params.get("transmision") || "",
    orden: params.get("orden") || "reciente",
    page: Number(params.get("page") || 1)
  };
}

function pushFiltersToUrl(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.set(k, String(v));
  });
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function applyFilters(cars, filters) {
  let data = [...cars];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    data = data.filter((car) => `${car.marca} ${car.modelo}`.toLowerCase().includes(q));
  }

  if (filters.marca) {
    data = data.filter((car) => normalizeText(car.marca) === normalizeText(filters.marca));
  }

  if (filters.modelo) {
    data = data.filter((car) => normalizeText(car.modelo) === normalizeText(filters.modelo));
  }

  if (filters.provincia) {
    data = data.filter((car) => normalizeText(car.ubicacion) === normalizeText(filters.provincia));
  }

  data = data.filter((car) => car.precio <= filters.precioMax);

  if (filters.combustible) data = data.filter((car) => car.combustible === filters.combustible);
  if (filters.transmision) data = data.filter((car) => car.transmision === filters.transmision);

  if (filters.orden === "precio_asc") data.sort((a, b) => a.precio - b.precio);
  if (filters.orden === "precio_desc") data.sort((a, b) => b.precio - a.precio);
  if (filters.orden === "km_asc") data.sort((a, b) => a.kilometraje - b.kilometraje);
  if (filters.orden === "reciente") data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return data;
}

function renderPagination(totalItems, page, filters) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i += 1) {
    const li = document.createElement("li");
    li.className = `page-item ${i === page ? "active" : ""}`;
    li.innerHTML = `<button class="page-link">${i}</button>`;
    li.querySelector("button").addEventListener("click", () => {
      currentPage = i;
      const nextFilters = { ...filters, page: i };
      pushFiltersToUrl(nextFilters);
      render(nextFilters);
    });
    pagination.appendChild(li);
  }
}

function fillForm(filters) {
  form.q.value = filters.q;
  marcaSelect.value = filters.marca;
  modeloSelect.value = filters.modelo;
  provinciaSelect.value = filters.provincia;
  form.precioMax.value = String(filters.precioMax);
  form.combustible.value = filters.combustible;
  form.transmision.value = filters.transmision;
  form.orden.value = filters.orden;
  precioOutput.textContent = `Hasta ${formatUsd(filters.precioMax)}`;
}

function render(filters) {
  const all = getCars();
  const filtered = applyFilters(all, filters);
  const start = (filters.page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);
  renderCards(grid, items);
  renderPagination(filtered.length, filters.page, filters);
  precioOutput.textContent = `Hasta ${formatUsd(filters.precioMax)}`;
}

const allCars = getCars();

async function initCatalogs() {
  try {
    catalogs = await loadCatalogs();
  } catch {
    catalogs = getFallbackCatalogsFromCars(allCars);
  }
}

async function init() {
  await initCatalogs();

  marcaSearchable = setupSearchableSingleSelect({
    selectEl: marcaSelect,
    defaultOptionLabel: "Todas",
    getOptions: () => catalogs.brands.map((entry) => entry.marca),
    onSelectionChange: () => {
      modeloSelect.value = "";
      refreshModelDatalistByBrand();
    }
  });

  modeloSearchable = setupSearchableSingleSelect({
    selectEl: modeloSelect,
    defaultOptionLabel: "Todos",
    getOptions: () => getModelsByBrand(marcaSelect.value)
  });

  provinciaSearchable = setupSearchableSingleSelect({
    selectEl: provinciaSelect,
    defaultOptionLabel: "Todas",
    getOptions: () => catalogs.provinces
  });

  const initial = getFiltersFromUrl();
  currentPage = initial.page;
  marcaSearchable.render({ preserveValue: false });
  modeloSearchable.render({ preserveValue: false });
  provinciaSearchable.render({ preserveValue: false });
  fillForm(initial);
  refreshModelDatalistByBrand();
  render(initial);
}

await init();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const filters = {
    q: form.q.value.trim(),
    marca: marcaSelect.value,
    modelo: modeloSelect.value,
    provincia: provinciaSelect.value,
    precioMax: Number(form.precioMax.value),
    combustible: form.combustible.value,
    transmision: form.transmision.value,
    orden: form.orden.value,
    page: 1
  };
  pushFiltersToUrl(filters);
  render(filters);
});

form.precioMax.addEventListener("input", () => {
  precioOutput.textContent = `Hasta ${formatUsd(form.precioMax.value)}`;
});

qs("#reset-filtros").addEventListener("click", () => {
  const resetFilters = {
    q: "",
    marca: "",
    modelo: "",
    provincia: "",
    precioMax: 100000,
    combustible: "",
    transmision: "",
    orden: "reciente",
    page: 1
  };
  fillForm(resetFilters);
  refreshModelDatalistByBrand();
  pushFiltersToUrl(resetFilters);
  render(resetFilters);
});
