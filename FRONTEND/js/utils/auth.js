import { readSession, getModo } from "./storage.js";

// Verifica sesión activa. Si requiereModo está definido, verifica también el modo.
export function requireAuth(requiereModo = null) {
  const session = readSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  // Si se requiere un modo específico y el usuario está en otro modo, redirigir
  if (requiereModo && getModo() !== requiereModo) {
    alert(`Esta sección requiere estar en modo ${requiereModo === "vendedor" ? "Vendedor" : "Comprador"}.`);
    window.location.href = "perfil.html";
    return null;
  }

  return session;
}

// Helper para saber el modo actual sin redireccionar
export function getModoActual() {
  return getModo();
}
