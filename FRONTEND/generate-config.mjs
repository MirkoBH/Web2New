// Genera env-config.js con la URL de la API tomada de la variable de entorno
// API_URL. Lo ejecuta el hosting (Render) como paso de build del sitio estático.
import { writeFileSync } from 'node:fs';

const apiUrl = (process.env.API_URL || '').trim().replace(/\/$/, '');
if (!/^https?:\/\/[^\s'"]+$/.test(apiUrl)) {
  console.error('Falta la variable API_URL (ej. https://autopulse-api.onrender.com/api)');
  process.exit(1);
}

writeFileSync(
  new URL('./env-config.js', import.meta.url),
  `window.__CONFIG__ = { API_URL: ${JSON.stringify(apiUrl)} };\n`,
);
console.log(`env-config.js generado con API_URL=${apiUrl}`);
