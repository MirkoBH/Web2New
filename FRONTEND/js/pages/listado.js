import { initAppShell } from "../app-init.js";
import { getFallbackCatalogsFromCars, loadCatalogs } from "../data/catalogs.js";
import { getCars } from "../data/mock-data.js";
import { formatUsd, qs } from "../utils/dom.js";
import { renderCards } from "../utils/cards.js";

initAppShell();

const form = qs("#filtros-form");
const grid = qs("#cars-grid");
const pagination = qs("#pagination");
const precioOutput = qs("#precio-output");
const marcaInput = qs("#filtro-marca");
const marcaList = qs("#filtro-marca-list");
const modeloInput = qs("#filtro-modelo");
const modeloList = qs("#filtro-modelo-list");
const provinciaInput = qs("#filtro-provincia");
const provinciaList = qs("#filtro-provincia-list");
const perPage = 6;

let currentPage = 1;
let catalogs = {
  brands: [],
  provinces: []
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function setDataListOptions(datalistEl, options) {
  if (!datalistEl) return;

  const normalizedOptions = [...new Set(options.map((option) => String(option || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

  datalistEl.innerHTML = "";
  normalizedOptions.forEach((option) => {
    const optionEl = document.createElement("option");
    optionEl.value = option;
    datalistEl.appendChild(optionEl);
  });
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
  const models = getModelsByBrand(marcaInput.value);
  setDataListOptions(modeloList, models);

  if (modeloInput.value) {
    const isStillValid = models.some((model) => normalizeText(model) === normalizeText(modeloInput.value));
    if (!isStillValid) {
      modeloInput.value = "";
    }
  }
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
    const marcaFilter = normalizeText(filters.marca);
    data = data.filter((car) => normalizeText(car.marca).includes(marcaFilter));
  }

  if (filters.modelo) {
    const modeloFilter = normalizeText(filters.modelo);
    data = data.filter((car) => normalizeText(car.modelo).includes(modeloFilter));
  }

  if (filters.provincia) {
    const provinciaFilter = normalizeText(filters.provincia);
    data = data.filter((car) => normalizeText(car.ubicacion).includes(provinciaFilter));
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
  marcaInput.value = filters.marca;
  modeloInput.value = filters.modelo;
  provinciaInput.value = filters.provincia;
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
  setDataListOptions(
    marcaList,
    catalogs.brands.map((entry) => entry.marca)
  );
  setDataListOptions(provinciaList, catalogs.provinces);
  setDataListOptions(modeloList, getModelsByBrand(""));

  const initial = getFiltersFromUrl();
  currentPage = initial.page;
  fillForm(initial);
  refreshModelDatalistByBrand();
  render(initial);
}

await init();

marcaInput.addEventListener("input", refreshModelDatalistByBrand);
marcaInput.addEventListener("change", refreshModelDatalistByBrand);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const filters = {
    q: form.q.value.trim(),
    marca: marcaInput.value.trim(),
    modelo: modeloInput.value.trim(),
    provincia: provinciaInput.value.trim(),
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
