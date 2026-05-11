import { initAppShell } from "../app-init.js";
import { authApi } from "../utils/api.js";
import { writeSession } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

initAppShell();

const form      = qs("#register-form");
const alertZone = qs("#alert-zone");

function showAlert(msg, type = "danger") {
  alertZone.innerHTML = `<div class="alert alert-${type}" role="alert">${msg}</div>`;
}

function validarPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    const nombre   = qs("#nombre").value.trim();
    const email    = qs("#email").value.trim().toLowerCase();
    const telefono = qs("#telefono").value.trim();
    const password = qs("#password").value;

    if (!validarPassword(password)) {
      showAlert("La contraseña debe tener mínimo 8 caracteres, letras, números y símbolos.");
      return;
    }

    // Sin campo role — todos los usuarios son iguales
    const { usuario, token } = await authApi.registrar({ nombre, email, telefono, password });
    writeSession({ userId: usuario.id, nombre: usuario.nombre, email: usuario.email, token, modo: 'comprador' });
    showAlert("¡Cuenta creada correctamente!", "success");
    setTimeout(() => { window.location.href = "perfil.html"; }, 500);
  } catch (err) {
    showAlert(err.message || "Error al registrarse.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrarme";
  }
});
