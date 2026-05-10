// ─────────────────────────────────────────────────────────────
// AutoPulse – Utilidades de almacenamiento local
// La sesión guarda: userId, nombre, role, email, token (JWT)
// El resto (COMPARE, WISHLIST) sigue en localStorage
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

export function logout() {
  writeSession(null);
}
