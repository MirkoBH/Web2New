import { initAppShell } from "../app-init.js";
import { authApi } from "../utils/api.js";
import { writeSession } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

initAppShell();

const form      = qs("#login-form");
const alertZone = qs("#alert-zone");

function showAlert(msg, type = "danger") {
  alertZone.innerHTML = `<div class="alert alert-${type}" role="alert">${msg}</div>`;
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Ingresando...";

  try {
    const email    = qs("#email").value.trim().toLowerCase();
    const password = qs("#password").value;
    const { usuario, token } = await authApi.login({ email, password });
    // Sin rol en la sesión
    writeSession({ userId: usuario.id, nombre: usuario.nombre, email: usuario.email, token });
    showAlert("Sesión iniciada. Redirigiendo...", "success");
    setTimeout(() => { window.location.href = "perfil.html"; }, 500);
  } catch (err) {
    showAlert(err.message || "Credenciales inválidas.");
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});
