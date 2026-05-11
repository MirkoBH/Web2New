// ─────────────────────────────────────────────────────────────
// mock-data.js — datos de semilla para desarrollo local
// YA NO SE USA en producción (la DB real está en Supabase)
// Se mantiene solo como referencia de estructura de datos
// ─────────────────────────────────────────────────────────────

// Usuarios de prueba (sin campo role — todos los usuarios son iguales)
export const usuariosMock = [
  {
    id: "u-demo-1",
    nombre: "Valentina Beas",
    email: "demo@autopulse.com",
    telefono: "+54 11 5555 5555",
    emailVerificado: true,
  },
  {
    id: "u-demo-2",
    nombre: "Rodrigo Méndez",
    email: "rodrigo@demo.com",
    telefono: "+54 351 444 4444",
    emailVerificado: true,
  },
];

// Alias vacíos para compatibilidad con imports existentes
export function inicializarDatos() {}
export const ensureSeedData = inicializarDatos;
export function obtenerAutos() { return []; }
export function obtenerUsuarios() { return usuariosMock; }
export const getCars = obtenerAutos;
export const getUsers = obtenerUsuarios;
