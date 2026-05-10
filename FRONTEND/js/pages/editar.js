import { initAppShell } from "../app-init.js";
import { carsApi } from "../utils/api.js";
import { requireAuth } from "../utils/auth.js";
import { qs } from "../utils/dom.js";

const sesion = requireAuth(["vendedor"]);
if (!sesion) {
  // redirigido
} else {
  initAppShell();

  const form      = qs("#edit-form");
  const alertZone = qs("#alert-zone");
  const carId     = new URLSearchParams(window.location.search).get("id");

  function showAlert(msg, type = "danger") {
    alertZone.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }

  if (!carId) {
    form.innerHTML = `<div class="alert alert-danger">ID de publicación no válido.</div>`;
  } else {
    // Cargar datos actuales del auto
    carsApi.obtener(carId).then((auto) => {
      if (auto.vendedorId !== sesion.userId) {
        form.innerHTML = `<div class="alert alert-danger">No tenés permiso para editar esta publicación.</div>`;
        return;
      }

      form.innerHTML = `
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
        <div class="col-12 d-flex gap-2">
          <button class="btn btn-danger" type="submit">Guardar cambios</button>
          <a class="btn btn-outline-light" href="perfil.html">Volver</a>
        </div>`;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "Guardando...";
        try {
          const fd = new FormData(form);
          await carsApi.actualizar(carId, {
            precio:        Number(fd.get("precio")),
            kilometraje:   Number(fd.get("kilometraje")),
            descripcion:   String(fd.get("descripcion") || "").trim(),
            detallesDanios: String(fd.get("detallesDanios") || "").trim(),
          });
          showAlert("Cambios guardados correctamente.", "success");
        } catch (err) {
          showAlert(err.message || "Error al guardar los cambios.");
        } finally {
          btn.disabled = false;
          btn.textContent = "Guardar cambios";
        }
      });
    }).catch(() => {
      form.innerHTML = `<div class="alert alert-danger">No se encontró la publicación para editar.</div>`;
    });
  }
}
