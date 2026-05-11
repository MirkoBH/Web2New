import { initAppShell } from "../app-init.js";
import { carsApi } from "../utils/api.js";
import { getFallbackCatalogsFromCars, loadCatalogs } from "../data/catalogs.js";
import { requireAuth } from "../utils/auth.js";
import { setupSearchableSingleSelect } from "../utils/searchable-select.js";
import { formatUsd, qs } from "../utils/dom.js";

const sesion = requireAuth(["vendedor"]);
if (!sesion) {
  // redirigido
} else {
  initAppShell();

  const form          = qs("#car-form");
  const preview       = qs("#preview-zone");
  const alertZone     = qs("#alert-zone");
  const marcaSelect   = qs("#publicar-marca");
  const modeloSelect  = qs("#publicar-modelo");
  const ubicSelect    = qs("#publicar-ubicacion");

  let catalogs = { brands: [], provinces: [] };
  let marcaSearchable, modeloSearchable, provinciaSearchable;

  function showAlert(msg, type = "danger") {
    alertZone.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    alertZone.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function normalizeText(v) {
    return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function getModels(brand) {
    if (!brand) return [...new Set(catalogs.brands.flatMap((e) => e.modelos || []))];
    const found = catalogs.brands.find((e) => normalizeText(e.marca) === normalizeText(brand));
    return found?.modelos || [];
  }

  function findCanonical(value, options) {
    const n = normalizeText(value);
    return options.find((o) => normalizeText(o) === n) || "";
  }

  function refreshModelos() {
    const models = getModels(marcaSelect.value);
    if (modeloSelect.value && !findCanonical(modeloSelect.value, models)) modeloSelect.value = "";
    modeloSearchable?.render({ preserveValue: true });
  }

  async function initCatalogs() {
    try { catalogs = await loadCatalogs(); }
    catch { catalogs = getFallbackCatalogsFromCars([]); }

    marcaSearchable = setupSearchableSingleSelect({
      selectEl: marcaSelect, defaultOptionLabel: "Seleccionar marca",
      getOptions: () => catalogs.brands.map((e) => e.marca),
      onSelectionChange: () => { modeloSelect.value = ""; refreshModelos(); },
    });
    modeloSearchable = setupSearchableSingleSelect({
      selectEl: modeloSelect, defaultOptionLabel: "Seleccionar modelo",
      getOptions: () => getModels(marcaSelect.value),
    });
    provinciaSearchable = setupSearchableSingleSelect({
      selectEl: ubicSelect, defaultOptionLabel: "Seleccionar provincia",
      getOptions: () => catalogs.provinces,
    });
    marcaSearchable.render({ preserveValue: false });
    modeloSearchable.render({ preserveValue: false });
    provinciaSearchable.render({ preserveValue: false });
  }

  await initCatalogs();

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    alertZone.innerHTML = "";
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Analizando con IA...";

    try {
      const formData = new FormData(form);
      const archivos = formData.getAll("imagenes").filter((f) => f && f.size > 0);

      // ── Validaciones del lado cliente ─────────────────────────
      if (archivos.length < 1) { showAlert("Debés cargar al menos 1 foto."); return; }
      if (archivos.some((f) => f.size > 8 * 1024 * 1024)) { showAlert("Cada imagen debe pesar máximo 8MB."); return; }

      const validMarca = findCanonical(String(formData.get("marca") || "").trim(), catalogs.brands.map((e) => e.marca));
      if (!validMarca) { showAlert("Seleccioná una marca válida desde el dropdown."); return; }

      const validModelo = findCanonical(String(formData.get("modelo") || "").trim(), getModels(validMarca));
      if (!validModelo) { showAlert("Seleccioná un modelo válido para la marca elegida."); return; }

      const validProvincia = findCanonical(String(formData.get("ubicacion") || "").trim(), catalogs.provinces);
      if (!validProvincia) { showAlert("Seleccioná una provincia válida de Argentina."); return; }

      const descripcion = String(formData.get("descripcion") || "").trim();
      if (descripcion.length < 10) { showAlert("La descripción debe tener al menos 10 caracteres."); return; }

      // ── 1. Crear el auto en la DB ─────────────────────────────
      const datoAuto = {
        marca:         validMarca,
        modelo:        validModelo,
        color:         String(formData.get("color") || "").trim(),
        anio:          Number(formData.get("anio")),
        kilometraje:   Number(formData.get("kilometraje")),
        transmision:   String(formData.get("transmision") || ""),
        combustible:   String(formData.get("combustible") || ""),
        precio:        Number(formData.get("precio")),
        ubicacion:     validProvincia,
        descripcion,
        detallesDanios: String(formData.get("detallesDanios") || "").trim(),
      };

      const autoCreado = await carsApi.crear(datoAuto);

      // ── 2. Subir imágenes al bucket de Supabase ───────────────
      btn.textContent = "Subiendo imágenes...";
      const formDataImagenes = new FormData();
      archivos.forEach((archivo) => formDataImagenes.append("imagenes", archivo));
      await carsApi.subirImagenes(autoCreado.id, formDataImagenes);

      // ── 3. Solicitar análisis de IA ───────────────────────────
      btn.textContent = "Analizando con IA...";
      const resultado = await carsApi.analizarIA(autoCreado.id);

      // ── 4. Mostrar resultado ──────────────────────────────────
      // Si llegamos aquí, la IA aprobó (si rechaza, el backend lanza un error)

      showAlert(`✓ Publicación aprobada — ${resultado.iaEstado} (puntaje ${resultado.iaPuntaje}/10)`, "success");
      preview.innerHTML = `
        <div class="glass-panel p-3 mt-3">
          <p class="small mb-1"><strong>Rango de precio sugerido:</strong> <span class="text-danger">${formatUsd(resultado.iaRangoPrecioMin)} – ${formatUsd(resultado.iaRangoPrecioMax)}</span></p>
          <p class="small text-secondary mb-0">${resultado.iaResumen}</p>
          <a href="detalle.html?id=${autoCreado.id}" class="btn btn-outline-light btn-sm mt-2">Ver publicación</a>
        </div>`;

      form.reset();
      marcaSearchable.render({ preserveValue: false });
      modeloSearchable.render({ preserveValue: false });
      provinciaSearchable.render({ preserveValue: false });

    } catch (err) {
      if (err.puntaje !== undefined) {
        // Rechazo por IA — mostrar detalle completo
        showAlert(`
          ❌ <strong>Publicación rechazada por la IA (puntaje: ${err.puntaje}/10)</strong><br>
          <strong>Daños detectados:</strong> ${err.danios || "Ver descripción"}<br>
          <strong>Motivo:</strong> ${err.motivo || err.message}<br>
          <small class="text-secondary">La publicación fue eliminada. Podés corregir la descripción o las imágenes y volver a intentarlo.</small>
        `);
      } else {
        showAlert(err.message || "Error al publicar el auto.");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Analizar con IA y publicar";
    }
  });
}
