// Sesión del usuario en localStorage.
// Forma: { id, nombre, email, telefono, token, modo }
// `modo` es "comprador" o "vendedor" y se cambia desde el encabezado.

const CLAVES = {
  sesion: 'autopulse_sesion',
  comparar: 'autopulse_comparar',
  favoritos: 'autopulse_favoritos',
};

export const MAXIMO_COMPARAR = 2;

function leer(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(clave, valor) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento (modo privado): la página sigue funcionando sin recordar.
  }
}

export function obtenerSesion() {
  const sesion = leer(CLAVES.sesion, null);
  return sesion?.token ? sesion : null;
}

/** Guarda la sesión a partir de la respuesta de registro o inicio de sesión. */
export function iniciarSesion({ usuario, token }) {
  escribir(CLAVES.sesion, { ...usuario, token, modo: 'comprador' });
}

export function actualizarSesion(cambios) {
  const sesion = obtenerSesion();
  if (sesion) escribir(CLAVES.sesion, { ...sesion, ...cambios });
}

export function cerrarSesion() {
  escribir(CLAVES.sesion, null);
}

export function obtenerModo() {
  return obtenerSesion()?.modo === 'vendedor' ? 'vendedor' : 'comprador';
}

export function cambiarModo(modo) {
  actualizarSesion({ modo });
}

/** Si no hay sesión manda a ingresar y vuelve a esta página después. */
export function exigirSesion() {
  const sesion = obtenerSesion();
  if (!sesion) {
    const volver = encodeURIComponent(location.pathname.split('/').pop() + location.search);
    location.replace(`login.html?volver=${volver}`);
    return null;
  }
  return sesion;
}

// ── Datos por usuario: comparador y favoritos ───────────────────────
// Se guardan por id de usuario para que dos cuentas en el mismo navegador
// no compartan listas.

function listaDelUsuario(clave) {
  const sesion = obtenerSesion();
  return sesion ? (leer(clave, {})[sesion.id] ?? []) : [];
}

function guardarListaDelUsuario(clave, lista) {
  const sesion = obtenerSesion();
  if (!sesion) return;
  const todas = leer(clave, {});
  todas[sesion.id] = lista;
  escribir(clave, todas);
}

/** Comparador: hasta 2 autos, solo con sesión iniciada. */
export function obtenerComparados() {
  return listaDelUsuario(CLAVES.comparar);
}

/** Agrega o quita un auto. Devuelve false si ya hay el máximo. */
export function alternarComparado(id) {
  const ids = obtenerComparados();
  if (ids.includes(id)) {
    guardarListaDelUsuario(CLAVES.comparar, ids.filter((x) => x !== id));
    return true;
  }
  if (ids.length >= MAXIMO_COMPARAR) return false;
  guardarListaDelUsuario(CLAVES.comparar, [...ids, id]);
  return true;
}

export function quitarComparado(id) {
  guardarListaDelUsuario(CLAVES.comparar, obtenerComparados().filter((x) => x !== id));
}

/** Favoritos: solo en modo comprador y nunca autos propios. */
export function obtenerFavoritos() {
  return listaDelUsuario(CLAVES.favoritos);
}

export function alternarFavorito(id) {
  const ids = obtenerFavoritos();
  guardarListaDelUsuario(
    CLAVES.favoritos,
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
  );
}

export function quitarFavorito(id) {
  guardarListaDelUsuario(CLAVES.favoritos, obtenerFavoritos().filter((x) => x !== id));
}
