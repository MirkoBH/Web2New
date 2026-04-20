import { initAppShell } from "../app-init.js";
import { getFallbackCatalogsFromCars, loadCatalogs } from "../data/catalogs.js";
import { getCars } from "../data/mock-data.js";
import { requireAuth } from "../utils/auth.js";
import { formatUsd, qs } from "../utils/dom.js";
import { getKey, writeJson, readJson } from "../utils/storage.js";

const session = requireAuth(["vendedor"]);
if (!session) {
  // redirected
} else {
  initAppShell();

  const form = qs("#car-form");
  const preview = qs("#preview-zone");
  const alertZone = qs("#alert-zone");
  const marcaSelect = qs("#publicar-marca");
  const marcaSearchInput = qs("#publicar-marca-search");
  const modeloSelect = qs("#publicar-modelo");
  const modeloSearchInput = qs("#publicar-modelo-search");
  const ubicacionSelect = qs("#publicar-ubicacion");
  const ubicacionSearchInput = qs("#publicar-ubicacion-search");

  let catalogs = {
    brands: [],
    provinces: []
  };
  const searchState = {
    marca: "",
    modelo: "",
    ubicacion: ""
  };

  function showAlert(message, type = "danger") {
    alertZone.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function filterBySearch(options, searchTerm) {
    const term = normalizeText(searchTerm);
    if (!term) return options;
    return options.filter((option) => normalizeText(option).includes(term));
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
      if (normalizeText(option) === selectedNormalized) {
        optionEl.selected = true;
      }
      selectEl.appendChild(optionEl);
    });
  }

  function getModelsForBrand(brand) {
    if (!brand) return [];
    const selected = catalogs.brands.find((entry) => entry.marca === brand);
    return selected?.modelos || [];
  }

  function refreshMarcaOptions(selectedValue = "") {
    const source = catalogs.brands.map((entry) => entry.marca);
    const filtered = filterBySearch(source, searchState.marca);
    setSelectOptions(marcaSelect, filtered, "Seleccionar marca", selectedValue);
  }

  function refreshModeloOptions(selectedValue = "") {
    const source = getModelsForBrand(marcaSelect.value);
    const filtered = filterBySearch(source, searchState.modelo);
    setSelectOptions(modeloSelect, filtered, "Seleccionar modelo", selectedValue);
  }

  function refreshUbicacionOptions(selectedValue = "") {
    const filtered = filterBySearch(catalogs.provinces, searchState.ubicacion);
    setSelectOptions(ubicacionSelect, filtered, "Seleccionar provincia", selectedValue);
  }

  async function initCatalogFilters() {
    const cars = getCars();

    try {
      catalogs = await loadCatalogs();
    } catch {
      catalogs = getFallbackCatalogsFromCars(cars);
    }

    refreshMarcaOptions();
    refreshModeloOptions();
    refreshUbicacionOptions();
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function simulateIaReview(payload) {
    const hasCarKeyword = /auto|vehiculo|motor|rueda|sedan|suv|pickup/i.test(payload.descripcion);
    const score = Math.min(9.8, Math.max(6.5, 7 + Math.random() * 2));
    const estado = score > 8.8 ? "Excelente estado" : score > 7.7 ? "Buen estado" : "Estado regular";

    return {
      aprobado: hasCarKeyword,
      estado,
      score: Number(score.toFixed(1)),
      danios: payload.detallesDanios,
      rangoPrecioMin: Math.round(payload.precio * 0.92),
      rangoPrecioMax: Math.round(payload.precio * 1.08),
      resumen: hasCarKeyword
        ? "Publicacion aprobada por IA. Imagenes y descripcion son coherentes con un auto."
        : "La descripcion no parece corresponder a un auto usado."
    };
  }

  await initCatalogFilters();

  marcaSearchInput.addEventListener("input", () => {
    searchState.marca = marcaSearchInput.value;
    const currentBrand = marcaSelect.value;
    refreshMarcaOptions(currentBrand);
    if (!marcaSelect.value) {
      refreshModeloOptions();
    }
  });

  marcaSelect.addEventListener("change", () => {
    const brand = marcaSelect.value;
    searchState.modelo = "";
    modeloSearchInput.value = "";
    if (!brand) {
      refreshModeloOptions();
      return;
    }
    refreshModeloOptions();
  });

  modeloSearchInput.addEventListener("input", () => {
    searchState.modelo = modeloSearchInput.value;
    const currentModel = modeloSelect.value;
    refreshModeloOptions(currentModel);
  });

  ubicacionSearchInput.addEventListener("input", () => {
    searchState.ubicacion = ubicacionSearchInput.value;
    const currentProvince = ubicacionSelect.value;
    refreshUbicacionOptions(currentProvince);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    alertZone.innerHTML = "";

    const formData = new FormData(form);
    const files = formData.getAll("imagenes").filter((f) => f && f.size > 0);

    if (files.length < 3) {
      showAlert("Debes cargar al menos 3 fotos en formato JPG.");
      return;
    }

    if (files.some((f) => !/image\/jpeg/.test(f.type))) {
      showAlert("Solo se permiten imagenes JPG/JPEG.");
      return;
    }

    if (files.some((f) => f.size > 1024 * 1024)) {
      showAlert("Cada imagen debe pesar maximo 1MB.");
      return;
    }

    const payload = {
      marca: String(formData.get("marca") || "").trim(),
      modelo: String(formData.get("modelo") || "").trim(),
      color: String(formData.get("color") || "").trim(),
      anio: Number(formData.get("anio")),
      kilometraje: Number(formData.get("kilometraje")),
      transmision: String(formData.get("transmision") || ""),
      combustible: String(formData.get("combustible") || ""),
      precio: Number(formData.get("precio")),
      ubicacion: String(formData.get("ubicacion") || "").trim(),
      descripcion: String(formData.get("descripcion") || "").trim(),
      detallesDanios: String(formData.get("detallesDanios") || "").trim()
    };

    const imageData = await Promise.all(files.map(toBase64));
    const ia = simulateIaReview(payload);

    const iaLogs = readJson(getKey("IA_LOGS"), []);
    iaLogs.push({
      id: crypto.randomUUID(),
      userId: session.userId,
      request: {
        descripcion: payload.descripcion,
        detallesDanios: payload.detallesDanios,
        imageCount: imageData.length
      },
      response: ia,
      createdAt: new Date().toISOString()
    });
    writeJson(getKey("IA_LOGS"), iaLogs);

    if (!ia.aprobado) {
      showAlert("La IA rechazo la publicacion. Revisa descripcion e imagenes.");
      return;
    }

    const cars = getCars();
    cars.push({
      id: crypto.randomUUID(),
      vendedorId: session.userId,
      ...payload,
      imagenes: imageData,
      ia,
      createdAt: new Date().toISOString()
    });

    writeJson(getKey("CARS"), cars);

    showAlert(`Publicacion aprobada por IA (${ia.estado}, score ${ia.score}/10).`, "success");
    preview.innerHTML = `<p class="small text-secondary mb-0">Rango estimado: ${formatUsd(ia.rangoPrecioMin)} - ${formatUsd(ia.rangoPrecioMax)}</p>`;
    form.reset();
    marcaSearchInput.value = "";
    modeloSearchInput.value = "";
    ubicacionSearchInput.value = "";
    searchState.marca = "";
    searchState.modelo = "";
    searchState.ubicacion = "";
    refreshMarcaOptions();
    refreshModeloOptions();
    refreshUbicacionOptions();
  });
}
