// ─────────────────────────────────────────────────────────────
// AutoPulse – Utilidades de almacenamiento local
// Sesión: { userId, nombre, email, token, modo }
// modo: "comprador" | "vendedor" (se puede cambiar en navbar)
// ─────────────────────────────────────────────────────────────

const KEYS = {
  SESSION:  "web2_session",
  COMPARE:  "web2_compare",
  WISHLIST: "web2_wishlist",
};

export function getKey(name) {
  return KEYS[name];
}

export function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readSession() {
  return readJson(KEYS.SESSION, null);
}

export function writeSession(session) {
  if (!session) {
    localStorage.removeItem(KEYS.SESSION);
    return;
  }
  writeJson(KEYS.SESSION, session);
}

// ── Modo activo del usuario ───────────────────────────────────
export function getModo() {
  const session = readSession();
  return session?.modo || "comprador"; // por defecto comprador
}

export function setModo(modo) {
  const session = readSession();
  if (!session) return;
  writeSession({ ...session, modo });
}

export function esVendedor() {
  return getModo() === "vendedor";
}

export function esComprador() {
  return getModo() === "comprador";
}

export function logout() {
  writeSession(null);
}
