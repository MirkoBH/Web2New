/**
 * Valida las variables de entorno al arrancar.
 * Si falta una obligatoria, la aplicación no levanta: es preferible fallar
 * al inicio que correr con una configuración insegura (por ejemplo, sin clave JWT).
 */
export interface EnvironmentVariables {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  DB_SSL: boolean;
  JWT_SECRET_PASSWORD: string;
  CORS_URL: string[];
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
}

const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET_PASSWORD',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'GROQ_API_KEY',
] as const;

const MIN_JWT_SECRET_LENGTH = 32;

export function validateEnvironment(
  env: Record<string, unknown>,
): EnvironmentVariables {
  const missing = REQUIRED_VARIABLES.filter((name) => !readText(env, name));
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`,
    );
  }

  const jwtSecret = readText(env, 'JWT_SECRET_PASSWORD');
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET_PASSWORD debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres`,
    );
  }

  const nodeEnv = readText(env, 'NODE_ENV') || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV debe ser development, production o test');
  }

  return {
    PORT: Number(readText(env, 'PORT')) || 3000,
    NODE_ENV: nodeEnv as EnvironmentVariables['NODE_ENV'],
    DATABASE_URL: readText(env, 'DATABASE_URL'),
    DB_SSL: readText(env, 'DB_SSL') !== 'false',
    JWT_SECRET_PASSWORD: jwtSecret,
    CORS_URL: readText(env, 'CORS_URL')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
    SUPABASE_URL: readText(env, 'SUPABASE_URL').replace(/\/$/, ''),
    SUPABASE_SECRET_KEY: readText(env, 'SUPABASE_SECRET_KEY'),
    GROQ_API_KEY: readText(env, 'GROQ_API_KEY'),
    GROQ_MODEL: readText(env, 'GROQ_MODEL') || 'qwen/qwen3.8-27b',
  };
}

function readText(env: Record<string, unknown>, name: string): string {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : '';
}
