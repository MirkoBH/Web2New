/** Datos del usuario que el guardia JWT deja disponibles en cada request. */
export interface AuthenticatedUser {
  id: string;
  email: string;
}

/** Contenido firmado dentro del token JWT. */
export interface TokenPayload {
  sub: string;
  email: string;
}
