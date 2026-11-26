// Sesión del usuario en localStorage.
// Forma: { id, nombre, email, telefono, token, modo }
// `modo` es "comprador" o "vendedor" y se cambia desde el encabezado.

const KEYS = {
  session: 'autopulse_session',
  compare: 'autopulse_compare',
  favorites: 'autopulse_favorites',
};

export const MAX_COMPARE = 2;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento (modo privado): la página sigue funcionando sin recordar.
  }
}

export function getSession() {
  const session = read(KEYS.session, null);
  return session?.token ? session : null;
}

/** Guarda la sesión a partir de la respuesta de registro o inicio de sesión. */
export function saveSession({ user, token }) {
  write(KEYS.session, { ...user, token, mode: 'buyer' });
}

export function updateSession(changes) {
  const session = getSession();
  if (session) write(KEYS.session, { ...session, ...changes });
}

export function logout() {
  write(KEYS.session, null);
}

export function getMode() {
  return getSession()?.mode === 'seller' ? 'seller' : 'buyer';
}

export function setMode(mode) {
  updateSession({ mode });
}

/** Si no hay sesión manda a ingresar y vuelve a esta página después. */
export function requireSession() {
  const session = getSession();
  if (!session) {
    const returnTo = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace(`login.html?returnTo=${returnTo}`);
    return null;
  }
  return session;
}

// ── Datos por usuario: comparador y favoritos ───────────────────────
// Se guardan por id de usuario para que dos cuentas en el mismo navegador
// no compartan listas.

function userList(key) {
  const session = getSession();
  return session ? (read(key, {})[session.id] ?? []) : [];
}

function saveUserList(key, list) {
  const session = getSession();
  if (!session) return;
  const allLists = read(key, {});
  allLists[session.id] = list;
  write(key, allLists);
}

/** Comparador: hasta 2 autos, solo con sesión iniciada. */
export function getCompared() {
  return userList(KEYS.compare);
}

/** Agrega o quita un auto. Devuelve false si ya hay el máximo. */
export function toggleCompared(id) {
  const ids = getCompared();
  if (ids.includes(id)) {
    saveUserList(KEYS.compare, ids.filter((x) => x !== id));
    return true;
  }
  if (ids.length >= MAX_COMPARE) return false;
  saveUserList(KEYS.compare, [...ids, id]);
  return true;
}

export function removeCompared(id) {
  saveUserList(KEYS.compare, getCompared().filter((x) => x !== id));
}

/** Favoritos: solo en modo comprador y nunca autos propios. */
export function getFavorites() {
  return userList(KEYS.favorites);
}

export function toggleFavorite(id) {
  const ids = getFavorites();
  saveUserList(
    KEYS.favorites,
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
  );
}

export function removeFavorite(id) {
  saveUserList(KEYS.favorites, getFavorites().filter((x) => x !== id));
}
