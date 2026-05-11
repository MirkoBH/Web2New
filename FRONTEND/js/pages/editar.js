import { initAppShell } from "../app-init.js";
import { carsApi } from "../utils/api.js";
import { requireAuth } from "../utils/auth.js";
import { formatUsd, qs } from "../utils/dom.js";

const sesion = requireAuth("vendedor");
if (!sesion) {
  // redirigido
} else {
  initAppShell();

  const mount    = qs("#edit-mount");
  const alertZone = qs("#alert-zone");
  const carId    = new URLSearchParams(window.location.search).get("id");

  function showAlert(msg, type = "danger") {
    alertZone.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    alertZone.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (!carId) {
    mount.innerHTML = `<div class="alert alert-danger">ID de publicación no válido.</div>`;
  } else {
    carsApi.obtener(carId).then((auto) => {
      if (auto.vendedorId !== sesion.userId) {
        mount.innerHTML = `<div class="alert alert-danger">No tenés permiso para editar esta publicación.</div>`;
        return;
      }

      // Mostrar imágenes actuales
      const galeriaActual = (auto.imagenes || [])
        .sort((a, b) => a.orden - b.orden)
        .map((img) => (typeof img === "string" ? img : img.urlPublica));

      mount.innerHTML = `
        <div class="glass-panel p-4 mb-4">
          <h2 class="h5 mb-3">Imágenes actuales</h2>
          <div class="row g-2 mb-2">
            ${galeriaActual.map((url, i) => `
              <div class="col-4 col-md-2">
                <img src="${url}" class="w-100 rounded" style="height:80px;object-fit:cover" alt="Foto ${i+1}" />
              </div>`).join("")}
          </div>
          <p class="small text-secondary mb-0">
            Si subís fotos nuevas, reemplazarán a las actuales y pasarán por análisis de IA.
          </p>
        </div>

        <form id="edit-form" class="row g-3" novalidate>
          <div class="col-md-6">
            <label class="form-label">Precio (USD)</label>
            <input class="form-control" name="precio" type="number" min="1000" value="${auto.precio}" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Kilometraje</label>
            <input class="form-control" name="kilometraje" type="number" min="0" value="${auto.kilometraje}" required />
          </div>
          <div class="col-12">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" name="descripcion" rows="3" minlength="10" required>${auto.descripcion}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Detalles de daños</label>
            <textarea class="form-control" name="detallesDanios" rows="2">${auto.detallesDanios || ""}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">
              Nuevas fotos <span class="text-secondary small">(opcional — si cargás fotos, reemplazan las anteriores y pasan por la IA)</span>
            </label>
            <input class="form-control" name="imagenes" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          </div>
          <div class="col-12 d-flex gap-2">
            <button class="btn btn-danger" type="submit">Guardar y re-analizar con IA</button>
            <a class="btn btn-outline-light" href="perfil.html">Cancelar</a>
          </div>
        </form>`;

      const form = qs("#edit-form");

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "La IA está analizando...";
        alertZone.innerHTML = "";

        try {
          const fd = new FormData(form);
          const archivos = fd.getAll("imagenes").filter((f) => f && f.size > 0);

          if (archivos.some((f) => f.size > 8 * 1024 * 1024)) {
            showAlert("Cada imagen debe pesar máximo 8 MB.");
            return;
          }

          // Armar FormData para el endpoint reeditar
          const formDataEnvio = new FormData();
          formDataEnvio.set("precio",         fd.get("precio"));
          formDataEnvio.set("kilometraje",    fd.get("kilometraje"));
          formDataEnvio.set("descripcion",    String(fd.get("descripcion") || "").trim());
          formDataEnvio.set("detallesDanios", String(fd.get("detallesDanios") || "").trim());
          archivos.forEach((archivo) => formDataEnvio.append("imagenes", archivo));

          const resultado = await carsApi.reeditar(carId, formDataEnvio);

          showAlert(`✓ Cambios aprobados — ${resultado.iaEstado} (puntaje ${resultado.iaPuntaje}/10)<br>
            Nuevo precio de mercado sugerido: <strong>${formatUsd(resultado.iaRangoPrecioMin)} – ${formatUsd(resultado.iaRangoPrecioMax)}</strong>`, "success");

          setTimeout(() => { window.location.href = `detalle.html?id=${carId}`; }, 2000);

        } catch (err) {
          showAlert(err.message || "Error al guardar los cambios.");
        } finally {
          btn.disabled = false;
          btn.textContent = "Guardar y re-analizar con IA";
        }
      });
    }).catch(() => {
      mount.innerHTML = `<div class="alert alert-danger">No se encontró la publicación.</div>`;
    });
  }
}
