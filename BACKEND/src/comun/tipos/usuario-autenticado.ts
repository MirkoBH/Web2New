/** Datos del usuario que el guardia JWT deja disponibles en cada request. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
}

/** Contenido firmado dentro del token JWT. */
export interface ContenidoToken {
  sub: string;
  email: string;
}
