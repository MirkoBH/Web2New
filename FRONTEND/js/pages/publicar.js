import { initAppShell } from "../app-init.js";
import { getFallbackCatalogsFromCars, loadCatalogs } from "../data/catalogs.js";
import { getCars } from "../data/mock-data.js";
import { requireAuth } from "../utils/auth.js";
import { setupSearchableSingleSelect } from "../utils/searchable-select.js";
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
  const modeloSelect = qs("#publicar-modelo");
  const ubicacionSelect = qs("#publicar-ubicacion");

  let catalogs = {
    brands: [],
    provinces: []
  };
  let marcaSearchable;
  let modeloSearchable;
  let provinciaSearchable;

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

  function getModelsForBrand(brand) {
    if (!brand) {
      return [...new Set(catalogs.brands.flatMap((entry) => entry.modelos || []))];
    }

    const selected = catalogs.brands.find((entry) => normalizeText(entry.marca) === normalizeText(brand));
    return selected?.modelos || [];
  }

  function findCanonicalValue(value, options) {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) return "";
    return options.find((option) => normalizeText(option) === normalizedValue) || "";
  }

  function refreshModeloOptionsByBrand() {
    const models = getModelsForBrand(marcaSelect.value);
    if (modeloSelect.value && !findCanonicalValue(modeloSelect.value, models)) {
      modeloSelect.value = "";
    }
    modeloSearchable?.render({ preserveValue: true });
  }

  async function initCatalogFilters() {
    const cars = getCars();

    try {
      catalogs = await loadCatalogs();
    } catch {
      catalogs = getFallbackCatalogsFromCars(cars);
    }

    marcaSearchable = setupSearchableSingleSelect({
      selectEl: marcaSelect,
      defaultOptionLabel: "Seleccionar marca",
      getOptions: () => catalogs.brands.map((entry) => entry.marca),
      onSelectionChange: () => {
        modeloSelect.value = "";
        refreshModeloOptionsByBrand();
      }
    });

    modeloSearchable = setupSearchableSingleSelect({
      selectEl: modeloSelect,
      defaultOptionLabel: "Seleccionar modelo",
      getOptions: () => getModelsForBrand(marcaSelect.value)
    });

    provinciaSearchable = setupSearchableSingleSelect({
      selectEl: ubicacionSelect,
      defaultOptionLabel: "Seleccionar provincia",
      getOptions: () => catalogs.provinces
    });

    marcaSearchable.render({ preserveValue: false });
    modeloSearchable.render({ preserveValue: false });
    provinciaSearchable.render({ preserveValue: false });
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

    const validMarca = findCanonicalValue(
      String(formData.get("marca") || "").trim(),
      catalogs.brands.map((entry) => entry.marca)
    );

    if (!validMarca) {
      showAlert("Selecciona una marca valida desde el dropdown.");
      return;
    }

    const validModelo = findCanonicalValue(String(formData.get("modelo") || "").trim(), getModelsForBrand(validMarca));
    if (!validModelo) {
      showAlert("Selecciona un modelo valido para la marca elegida.");
      return;
    }

    const validProvincia = findCanonicalValue(String(formData.get("ubicacion") || "").trim(), catalogs.provinces);
    if (!validProvincia) {
      showAlert("Selecciona una provincia valida de Argentina.");
      return;
    }

    const payload = {
      marca: validMarca,
      modelo: validModelo,
      color: String(formData.get("color") || "").trim(),
      anio: Number(formData.get("anio")),
      kilometraje: Number(formData.get("kilometraje")),
      transmision: String(formData.get("transmision") || ""),
      combustible: String(formData.get("combustible") || ""),
      precio: Number(formData.get("precio")),
      ubicacion: validProvincia,
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
    marcaSearchable.render({ preserveValue: false });
    modeloSearchable.render({ preserveValue: false });
    provinciaSearchable.render({ preserveValue: false });
  });
}
