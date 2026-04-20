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
const marcaSelect = qs("#filtro-marca");
const marcaSearchInput = qs("#filtro-marca-search");
const modeloSelect = qs("#filtro-modelo");
const modeloSearchInput = qs("#filtro-modelo-search");
const provinciaSelect = qs("#filtro-provincia");
const provinciaSearchInput = qs("#filtro-provincia-search");
const perPage = 6;

let currentPage = 1;
let catalogs = {
  brands: [],
  provinces: []
};
const searchState = {
  marca: "",
  modelo: "",
  provincia: ""
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function setSelectOptions(selectEl, options, defaultLabel, selectedValue = "") {
  if (!selectEl) return;

  const selectedNormalized = normalizeText(selectedValue);
  const normalizedOptions = options
    .map((option) => String(option || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));

  selectEl.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultLabel;
  selectEl.appendChild(defaultOption);

  normalizedOptions.forEach((option) => {
    const optionEl = document.createElement("option");
    optionEl.value = option;
    optionEl.textContent = option;
    optionEl.selected = normalizeText(option) === selectedNormalized;
    selectEl.appendChild(optionEl);
  });
}

function filterBySearch(options, term) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return options;
  return options.filter((option) => normalizeText(option).includes(normalizedTerm));
}

function getModelsByBrand(brand) {
  if (!brand) {
    const allModels = catalogs.brands.flatMap((entry) => entry.modelos || []);
    return [...new Set(allModels)];
  }

  const selectedBrand = catalogs.brands.find((entry) => normalizeText(entry.marca) === normalizeText(brand));
  return selectedBrand?.modelos || [];
}

function populateCatalogFilters(selected = {}) {
  const filteredBrands = filterBySearch(
    catalogs.brands.map((entry) => entry.marca),
    searchState.marca
  );

  const filteredModels = filterBySearch(getModelsByBrand(selected.marca || ""), searchState.modelo);
  const filteredProvinces = filterBySearch(catalogs.provinces, searchState.provincia);

  setSelectOptions(
    marcaSelect,
    filteredBrands,
    "Todas",
    selected.marca || ""
  );

  setSelectOptions(modeloSelect, filteredModels, "Todos", selected.modelo || "");
  setSelectOptions(provinciaSelect, filteredProvinces, "Todas", selected.provincia || "");
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
  form.marca.value = filters.marca;
  form.modelo.value = filters.modelo;
  form.provincia.value = filters.provincia;
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
  const initial = getFiltersFromUrl();
  currentPage = initial.page;
  populateCatalogFilters(initial);
  fillForm(initial);
  render(initial);
}

await init();

marcaSelect.addEventListener("change", () => {
  const selectedMarca = marcaSelect.value;
  searchState.modelo = "";
  modeloSearchInput.value = "";
  const currentModel = modeloSelect.value;
  setSelectOptions(modeloSelect, getModelsByBrand(selectedMarca), "Todos", currentModel);
});

marcaSearchInput.addEventListener("input", () => {
  searchState.marca = marcaSearchInput.value;
  const selected = {
    marca: marcaSelect.value,
    modelo: modeloSelect.value,
    provincia: provinciaSelect.value
  };
  populateCatalogFilters(selected);
});

modeloSearchInput.addEventListener("input", () => {
  searchState.modelo = modeloSearchInput.value;
  const selected = {
    marca: marcaSelect.value,
    modelo: modeloSelect.value,
    provincia: provinciaSelect.value
  };
  populateCatalogFilters(selected);
});

provinciaSearchInput.addEventListener("input", () => {
  searchState.provincia = provinciaSearchInput.value;
  const selected = {
    marca: marcaSelect.value,
    modelo: modeloSelect.value,
    provincia: provinciaSelect.value
  };
  populateCatalogFilters(selected);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const filters = {
    q: form.q.value.trim(),
    marca: form.marca.value,
    modelo: form.modelo.value,
    provincia: form.provincia.value,
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
  marcaSearchInput.value = "";
  modeloSearchInput.value = "";
  provinciaSearchInput.value = "";
  searchState.marca = "";
  searchState.modelo = "";
  searchState.provincia = "";
  populateCatalogFilters(resetFilters);
  fillForm(resetFilters);
  pushFiltersToUrl(resetFilters);
  render(resetFilters);
});
