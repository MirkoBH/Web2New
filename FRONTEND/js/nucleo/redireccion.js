/**
 * Devuelve la página a la que volver después de ingresar. Solo acepta páginas
 * propias del sitio (ej. "detalle.html?id=..."), para que nadie pueda usar el
 * enlace de ingreso para mandar a otro dominio (redirección abierta).
 */
export function paginaDeVuelta() {
  const volver = new URLSearchParams(location.search).get('volver') ?? '';
  return /^[a-z-]+\.html(\?[\w=&%.-]*)?(#[\w-]*)?$/.test(volver) ? volver : 'index.html';
}
