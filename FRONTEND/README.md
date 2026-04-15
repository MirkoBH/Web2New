# Frontend Web2

Frontend en HTML + CSS + JavaScript vanilla con Bootstrap 5.

## Requisitos
- Node.js 20+

## Ejecutar local
1. `cd FRONTEND`
2. `npm start`
3. Abrir `http://localhost:4173`

## Variables de entorno
- `API_BASE_URL`: URL del backend (en Railway usar variable del servicio frontend).

El servidor expone `runtime-config.js` para inyectar `API_BASE_URL` en cliente.

## Healthcheck
- `GET /health`
