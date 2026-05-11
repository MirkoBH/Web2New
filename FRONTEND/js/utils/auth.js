import { readSession } from "./storage.js";

// Verifica que haya sesión activa. Si no, redirige al login.
// El parámetro `roles` ya no se usa (todos los usuarios tienen acceso completo)
// pero se mantiene por compatibilidad con llamadas existentes.
export function requireAuth(_roles = []) {
  const session = readSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}
