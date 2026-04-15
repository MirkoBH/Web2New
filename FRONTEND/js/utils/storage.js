const KEYS = {
  SESSION: "web2_session",
  USERS: "web2_users",
  CARS: "web2_cars",
  COMPARE: "web2_compare",
  QUESTIONS: "web2_questions",
  WISHLIST: "web2_wishlist",
  IA_LOGS: "web2_ia_logs",
  SEEDED: "web2_seeded"
};

export function getKey(name) {
  return KEYS[name];
}

export function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
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
