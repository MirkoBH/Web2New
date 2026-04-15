import { initAppShell } from "../app-init.js";
import { getCars } from "../data/mock-data.js";
import { requireAuth } from "../utils/auth.js";
import { qs } from "../utils/dom.js";
import { getKey, writeJson } from "../utils/storage.js";

const session = requireAuth(["vendedor"]);
if (!session) {
  // redirected
} else {
  initAppShell();

  const form = qs("#edit-form");
  const alertZone = qs("#alert-zone");
  const params = new URLSearchParams(window.location.search);
  const carId = params.get("id");

  const cars = getCars();
  const car = cars.find((x) => x.id === carId && x.vendedorId === session.userId);

  if (!car) {
    form.innerHTML = '<div class="alert alert-danger">No se encontro la publicacion para editar.</div>';
  } else {
    form.innerHTML = `
      <div class="col-md-6"><label class="form-label">Precio (USD)</label><input class="form-control" name="precio" type="number" min="1000" value="${car.precio}" required /></div>
      <div class="col-md-6"><label class="form-label">Kilometraje</label><input class="form-control" name="kilometraje" type="number" min="0" value="${car.kilometraje}" required /></div>
      <div class="col-12"><label class="form-label">Descripcion</label><textarea class="form-control" name="descripcion" rows="3" required>${car.descripcion}</textarea></div>
      <div class="col-12"><label class="form-label">Detalles de danios</label><textarea class="form-control" name="detallesDanios" rows="2" required>${car.detallesDanios}</textarea></div>
      <div class="col-12 d-flex gap-2"><button class="btn btn-danger" type="submit">Guardar cambios</button><a class="btn btn-outline-light" href="perfil.html">Volver</a></div>
    `;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      car.precio = Number(formData.get("precio"));
      car.kilometraje = Number(formData.get("kilometraje"));
      car.descripcion = String(formData.get("descripcion") || "").trim();
      car.detallesDanios = String(formData.get("detallesDanios") || "").trim();
      writeJson(getKey("CARS"), cars);
      alertZone.innerHTML = '<div class="alert alert-success">Cambios guardados correctamente.</div>';
    });
  }
}
