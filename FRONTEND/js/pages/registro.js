import { initAppShell } from "../app-init.js";
import { getUsers } from "../data/mock-data.js";
import { getKey, writeJson, writeSession } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

initAppShell();

const form = qs("#register-form");
const alertZone = qs("#alert-zone");

function showAlert(message, type = "danger") {
  alertZone.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

function validPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = qs("#nombre").value.trim();
  const email = qs("#email").value.trim().toLowerCase();
  const telefono = qs("#telefono").value.trim();
  const role = qs("#role").value;
  const password = qs("#password").value;
  const emailVerificado = qs("#email-verificado").checked;

  const users = getUsers();
  if (users.some((x) => x.email.toLowerCase() === email)) {
    showAlert("Ese email ya está registrado.");
    return;
  }

  if (!validPassword(password)) {
    showAlert("La contraseña debe tener mínimo 8 caracteres, letras, números y símbolos.");
    return;
  }

  const newUser = {
    id: crypto.randomUUID(),
    role,
    nombre,
    email,
    telefono,
    password,
    emailVerificado,
    createdAt: new Date().toISOString()
  };

  writeJson(getKey("USERS"), [...users, newUser]);
  writeSession({ userId: newUser.id, nombre: newUser.nombre, role: newUser.role, email: newUser.email });
  showAlert("¡Cuenta creada correctamente!", "success");
  setTimeout(() => {
    window.location.href = "perfil.html";
  }, 500);
});
