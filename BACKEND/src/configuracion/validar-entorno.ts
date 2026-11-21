/**
 * Valida las variables de entorno al arrancar.
 * Si falta una obligatoria, la aplicación no levanta: es preferible fallar
 * al inicio que correr con una configuración insegura (por ejemplo, sin clave JWT).
 */
export interface VariablesEntorno {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  DB_SSL: boolean;
  JWT_SECRET_PASSWORD: string;
  CORS_URL: string[];
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  GROQ_API_KEY: string;
  GROQ_MODELO: string;
}

const OBLIGATORIAS = [
  'DATABASE_URL',
  'JWT_SECRET_PASSWORD',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'GROQ_API_KEY',
] as const;

const LARGO_MINIMO_CLAVE_JWT = 32;

export function validarEntorno(
  entorno: Record<string, unknown>,
): VariablesEntorno {
  const faltantes = OBLIGATORIAS.filter(
    (nombre) => !leerTexto(entorno, nombre),
  );
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`,
    );
  }

  const claveJwt = leerTexto(entorno, 'JWT_SECRET_PASSWORD');
  if (claveJwt.length < LARGO_MINIMO_CLAVE_JWT) {
    throw new Error(
      `JWT_SECRET_PASSWORD debe tener al menos ${LARGO_MINIMO_CLAVE_JWT} caracteres`,
    );
  }

  const nodeEnv = leerTexto(entorno, 'NODE_ENV') || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV debe ser development, production o test');
  }

  return {
    PORT: Number(leerTexto(entorno, 'PORT')) || 3000,
    NODE_ENV: nodeEnv as VariablesEntorno['NODE_ENV'],
    DATABASE_URL: leerTexto(entorno, 'DATABASE_URL'),
    DB_SSL: leerTexto(entorno, 'DB_SSL') !== 'false',
    JWT_SECRET_PASSWORD: claveJwt,
    CORS_URL: leerTexto(entorno, 'CORS_URL')
      .split(',')
      .map((origen) => origen.trim().replace(/\/$/, ''))
      .filter(Boolean),
    SUPABASE_URL: leerTexto(entorno, 'SUPABASE_URL').replace(/\/$/, ''),
    SUPABASE_SECRET_KEY: leerTexto(entorno, 'SUPABASE_SECRET_KEY'),
    GROQ_API_KEY: leerTexto(entorno, 'GROQ_API_KEY'),
    GROQ_MODELO: leerTexto(entorno, 'GROQ_MODELO') || 'qwen/qwen3.8-27b',
  };
}

function leerTexto(entorno: Record<string, unknown>, nombre: string): string {
  const valor = entorno[nombre];
  return typeof valor === 'string' ? valor.trim() : '';
}
