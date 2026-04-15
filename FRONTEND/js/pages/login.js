import { initAppShell } from "../app-init.js";
import { getUsers } from "../data/mock-data.js";
import { writeSession } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

initAppShell();

const form = qs("#login-form");
const alertZone = qs("#alert-zone");

function showAlert(message, type = "danger") {
  alertZone.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = qs("#email").value.trim().toLowerCase();
  const password = qs("#password").value;

  const user = getUsers().find((x) => x.email.toLowerCase() === email && x.password === password);

  if (!user) {
    showAlert("Credenciales invalidas.");
    return;
  }

  if (!user.emailVerificado) {
    showAlert("Debes verificar el email antes de iniciar sesion.");
    return;
  }

  writeSession({ userId: user.id, nombre: user.nombre, role: user.role, email: user.email });
  showAlert("Sesion iniciada. Redirigiendo...", "success");
  setTimeout(() => {
    window.location.href = "perfil.html";
  }, 500);
});
