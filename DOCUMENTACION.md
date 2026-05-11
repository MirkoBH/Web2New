# AutoPulse — Documentación del Proyecto

**Materia:** Ingeniería Web II — 2026  
**Repositorio:** https://github.com/MirkoBH/Web2New

---

## 1. Descripción del sistema

AutoPulse es una plataforma web de compra y venta de autos usados en Argentina. Cualquier usuario registrado puede actuar como **vendedor** (publicar vehículos) o como **comprador** (explorar, consultar y guardar favoritos), alternando entre ambos modos desde el navbar.

Cada publicación pasa por un análisis automático de inteligencia artificial que examina las fotos del vehículo, detecta daños visibles, clasifica el estado del auto y estima el precio real de mercado en Argentina. El auto se publica únicamente si la IA completa el análisis correctamente.

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND  (HTML + CSS + JavaScript Vanilla)             │
│  Hosteado en: GitHub Pages / Vercel / Netlify           │
│  Sin frameworks — módulos ES6 nativos                   │
└─────────────────────┬────────────────────────────────────┘
                      │  fetch() — REST JSON
┌─────────────────────▼────────────────────────────────────┐
│  BACKEND  (NestJS + TypeScript + TypeORM)               │
│  Hosteado en: Railway                                   │
│  Módulos: Auth │ Users │ Cars │ IA │ Consultas          │
└──────┬──────────────────────────┬────────────────────────┘
       │                          │
┌──────▼──────────┐    ┌──────────▼──────────────────────┐
│  PostgreSQL      │    │  Supabase Storage               │
│  (Supabase)      │    │  Bucket: imagenes-autos         │
│  3 tablas        │    │  URLs públicas permanentes      │
└─────────────────┘    └─────────────────────────────────┘
                                  │
                       ┌──────────▼──────────────────────┐
                       │  Groq AI                        │
                       │  llama-4-scout-17b (visión)     │
                       │  Análisis de imágenes + texto   │
                       └─────────────────────────────────┘
```

**Stack tecnológico:**

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript ES6+ (módulos) |
| Backend | NestJS, TypeScript, TypeORM, Passport JWT |
| Base de datos | PostgreSQL en Supabase |
| Storage de imágenes | Supabase Storage |
| Inteligencia artificial | Groq API — Llama 4 Scout 17B (visión) |
| Autenticación | JWT (7 días de expiración) |

---

## 3. Modelo de datos

### `usuarios`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| nombre | VARCHAR(80) | Nombre del usuario |
| email | VARCHAR(120) | Email único |
| telefono | VARCHAR(30) | Teléfono (opcional) |
| password | TEXT | Hash bcrypt (no se devuelve en queries) |
| emailVerificado | BOOLEAN | Siempre `true` en esta versión |
| createdAt / updatedAt | TIMESTAMPTZ | Auditoría |

> No existe columna `role`. El modo (comprador/vendedor) se gestiona en el frontend vía `localStorage` y puede cambiarse en cualquier momento.

### `autos`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| vendedor_id | UUID FK | Referencia a `usuarios` |
| marca, modelo, color | VARCHAR | Datos del vehículo |
| anio, kilometraje | INTEGER | Año y km recorridos |
| transmision | ENUM | `Manual` / `Automatico` |
| combustible | ENUM | `Nafta` / `Diesel` / `Hibrido` / `Electrico` |
| precio | NUMERIC | Precio pedido por el vendedor (USD) |
| ubicacion | VARCHAR(100) | Provincia argentina |
| descripcion | TEXT | Descripción del vendedor |
| detallesDanios | TEXT | Daños declarados por el vendedor |
| iaEstado | VARCHAR(40) | Estado según IA |
| iaPuntaje | FLOAT | Puntaje IA (1.0 – 10.0) |
| iaDanios | TEXT | Daños detectados por IA en las fotos |
| iaRangoPrecioMin / Max | NUMERIC | Rango de precio de mercado sugerido (USD) |
| iaResumen | TEXT | Resumen del análisis en español |
| iaAprobado | BOOLEAN | Siempre `true` |
| activo | BOOLEAN | `true` = publicado y visible |
| createdAt / updatedAt | TIMESTAMPTZ | Auditoría |

### `imagenes_auto`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| auto_id | UUID FK | Referencia a `autos` (CASCADE DELETE) |
| storage_path | TEXT | Path en el bucket: `{autoId}/{uuid}.ext` |
| url_publica | TEXT | URL pública de Supabase Storage |
| nombre | VARCHAR(255) | Nombre original del archivo |
| orden | INTEGER | Posición en la galería (0 = portada) |
| createdAt | TIMESTAMPTZ | Fecha de carga |

### `consultas`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| auto_id | UUID FK | Referencia a `autos` (CASCADE DELETE) |
| comprador_id | UUID FK | Usuario que pregunta |
| vendedor_id | UUID | Dueño del auto (para queries rápidas) |
| pregunta | TEXT | Texto de la consulta |
| respuesta | TEXT | Respuesta del vendedor (nullable) |
| createdAt | TIMESTAMPTZ | Fecha |

---

## 4. Endpoints de la API

**Base URL:** `https://[proyecto].up.railway.app/api`  
**Autenticación:** `Authorization: Bearer {JWT}` en headers

### Auth — público
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registrar usuario (devuelve usuario + token) |
| POST | `/auth/login` | Iniciar sesión (devuelve usuario + token) |

### Usuarios — requiere JWT
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/users/me` | Perfil propio |
| PATCH | `/users/me` | Actualizar nombre y teléfono |
| GET | `/users/:id` | Datos públicos de un usuario |

### Autos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/cars` | No | Listado con filtros y paginación |
| GET | `/cars/:id` | No | Detalle de un auto |
| GET | `/cars/mis-autos` | JWT | Autos propios del usuario |
| POST | `/cars/publicar` | JWT | Publicar: datos + imágenes + análisis IA en un request |
| POST | `/cars/:id/reeditar` | JWT | Editar con re-análisis de IA |
| PATCH | `/cars/:id` | JWT | Editar datos sin IA |
| DELETE | `/cars/:id` | JWT | Eliminar publicación propia (hard delete) |
| DELETE | `/cars/:id/imagenes/:imgId` | JWT | Eliminar imagen individual |
| PATCH | `/cars/:id/imagenes/reordenar` | JWT | Reordenar galería |

**Filtros de `GET /cars`:** `marca`, `modelo`, `ubicacion`, `precioMin`, `precioMax`, `anioMin`, `anioMax`, `combustible`, `transmision`, `orden` (`reciente` / `precio_asc` / `precio_desc` / `km_asc`), `pagina`, `limite`

### Consultas — requiere JWT
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/consultas` | Enviar consulta (máx. 1 por usuario por publicación) |
| GET | `/consultas/auto/:id` | Consultas de una publicación (público) |
| GET | `/consultas/mis-consultas` | Consultas recibidas en mis publicaciones |
| PATCH | `/consultas/:id/responder` | Responder una consulta |

### IA — requiere JWT
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/ia/analizar` | Análisis rápido por texto sin imágenes |

---

## 5. Integración con IA

### Proveedor y modelo
**Groq** con `meta-llama/llama-4-scout-17b-16e-instruct` (soporte de visión).  
Fallback automático: `llama-3.3-70b-versatile` si no hay imágenes.

### Flujo al publicar un auto

```
1. Usuario llena el formulario y selecciona fotos
2. Frontend envía todo en UN solo request multipart → POST /api/cars/publicar
3. Backend recibe los buffers de imagen en memoria (RAM, sin tocar disco ni DB)
4. Los buffers se convierten a base64 y se envían a Groq junto con los datos del auto
5. Groq analiza visualmente las fotos y devuelve un JSON con el análisis
6. Backend guarda el auto en PostgreSQL con los datos del análisis incluidos
7. Las imágenes se suben al bucket de Supabase Storage
8. Se devuelve el auto completo con URLs públicas de las imágenes
```

> Si la IA falla (error de red, timeout), se usa un análisis simulado como fallback para no bloquear al usuario.

### Criterios de clasificación

**Estado del vehículo:**

| Estado | Criterio | Ajuste de precio |
|---|---|---|
| **Excelente** | Sin ningún daño visible. Kilometraje bajo (< 50.000 km). Aspecto impecable. | Sin descuento |
| **Buen estado** | Sin daños visibles o daños absolutamente imperceptibles. Kilometraje estándar (hasta ~100.000 km). | -3% a -5% |
| **Regular** | Daños leves visibles (rayones, pequeños golpes) y/o kilometraje muy alto (> 100.000 km). | -10% a -20% |
| **Requiere reparacion** | Daños graves: abolladuras importantes, choque estructural, óxido extendido, múltiples paneles. | -25% a -50% |

> **Regla clave:** si hay cualquier daño visible en las fotos, el estado no puede ser "Excelente". Si el kilometraje supera 100.000 km, el estado no puede ser "Excelente" ni "Buen estado".

**Precio de referencia por segmento (USD, mercado argentino):**
- Compactos (Fiat Argo, VW Polo, Peugeot 208) 2020+: $14.000 – $22.000
- Sedanes medianos (Toyota Corolla, VW Vento) 2018+: $18.000 – $28.000
- SUVs compactas (Renegade, Duster, T-Cross) 2019+: $20.000 – $32.000
- SUVs medianas (RAV4, Tiguan, Compass) 2018+: $30.000 – $50.000
- SUVs premium (BMW X3/X5, Audi Q5, Mercedes GLC) 2016+: $40.000 – $80.000
- Pickups (Ford Ranger, Toyota Hilux) 2018+: $30.000 – $55.000
- Autos de lujo (BMW Serie 3/5, Mercedes C/E) 2016+: $35.000 – $70.000

**Ajuste adicional por kilometraje:**
- < 30.000 km: +8%
- 30.001 – 60.000 km: sin ajuste
- 60.001 – 100.000 km: -8%
- 100.001 – 150.000 km: -18%
- > 150.000 km: -30%

### Respuesta del modelo
```json
{
  "estado": "Buen estado",
  "puntaje": 7.8,
  "danios": "Rayón profundo en puerta delantera derecha, visible en foto 2",
  "rangoPrecioMin": 45000,
  "rangoPrecioMax": 52000,
  "resumen": "BMW X5 2016 en buen estado con daño leve documentado. Precio justo entre USD 45.000 y 52.000 según mercado argentino.",
  "aprobado": true
}
```

---

## 6. Reglas de negocio

| Regla | Implementación |
|---|---|
| Un usuario no puede consultar su propia publicación | Backend: `ForbiddenException` en `ConsultasService.crear()` |
| Solo una consulta por usuario por publicación | Backend: verifica duplicado antes de guardar |
| Modo vendedor no puede enviar consultas | Frontend: oculta el formulario |
| Modo comprador no puede publicar | Frontend: `requireAuth("vendedor")` en `publicar.js` |
| No aparecen favorito/comparar en autos propios | Frontend: `car-card.js` verifica `auto.vendedorId === sesion.userId` |
| El botón editar solo aparece para el dueño | Frontend: `car-card.js` y `detalle.js` |
| No se puede responder la propia consulta | Backend: `ForbiddenException` en `ConsultasService.responder()` |
| El auto no se guarda en DB si la IA no termina | Flujo: DB y Storage solo se escriben tras el análisis exitoso |

---

## 7. Estructura del repositorio

```
Web2New/
├── FRONTEND/               # Interfaz de usuario
│   ├── *.html              # Páginas (index, listado, detalle, publicar, etc.)
│   ├── css/styles.css      # Estilos globales
│   ├── runtime-config.js   # URL del backend (configurable por entorno)
│   └── js/
│       ├── app-init.js     # Inicialización del shell (navbar, footer, comparador)
│       ├── components/     # navbar, footer, car-card, compare-drawer
│       ├── pages/          # Lógica de cada página
│       ├── utils/          # api.js, auth.js, storage.js, dom.js
│       └── data/           # catalogs.js (marcas y provincias)
│
├── BACKEND/                # API REST
│   ├── src/
│   │   ├── auth/           # Registro, login, JWT strategy
│   │   ├── users/          # Entidad, service y controller de usuarios
│   │   ├── cars/           # Entidad Auto, ImagenAuto, CRUD, Storage
│   │   ├── ia/             # Integración con Groq
│   │   ├── consultas/      # Preguntas comprador→vendedor
│   │   └── common/         # Guards y decoradores compartidos
│   ├── .env.example        # Template de variables de entorno
│   └── railway.toml        # Configuración de despliegue en Railway
│
└── DOCUMENTACION.md        # Este archivo
```

---

## 8. Variables de entorno (Backend)

Crear un archivo `.env` en la carpeta `BACKEND/` basado en `.env.example`:

```env
APP_URL=http://localhost:3000
CORS_URL=http://localhost:8080

DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
DB_SSL=true

JWT_SECRET_PASSWORD=clave_larga_y_segura

SUPABASE_PROJECT_REF=tu_project_ref
SUPABASE_ANON_KEY=eyJhbGci...

GROQ_API_KEY=gsk_...
```

---

## 9. Despliegue

| Componente | Servicio sugerido |
|---|---|
| Frontend | GitHub Pages / Vercel / Netlify |
| Backend | Railway |
| Base de datos | Supabase (PostgreSQL) |
| Storage de imágenes | Supabase Storage |

Para producción, actualizar `FRONTEND/runtime-config.js` con la URL real del backend en Railway:
```js
window.__APP_CONFIG__ = {
  API_BASE_URL: "https://[tu-proyecto].up.railway.app/api"
};
```
