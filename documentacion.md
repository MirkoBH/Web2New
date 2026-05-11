# AutoPulse — Documentación del proyecto

## 1. Descripción del sistema

AutoPulse es una plataforma web de compra y venta de autos usados en Argentina. Permite a cualquier usuario publicar vehículos (como vendedor) y explorar/consultar publicaciones de otros (como comprador). Cada publicación pasa por un análisis automático de inteligencia artificial que evalúa el estado del vehículo, detecta daños visibles en las imágenes y estima el precio de mercado real en Argentina.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (HTML + CSS + JavaScript Vanilla)             │
│  Hosteado en: GitHub Pages / Vercel / Netlify          │
│  URL: /FRONTEND                                         │
└───────────────────┬─────────────────────────────────────┘
                    │ fetch() — REST API (JSON)
┌───────────────────▼─────────────────────────────────────┐
│  BACKEND (NestJS + TypeORM)                             │
│  Hosteado en: Railway                                   │
│  URL: /BACKEND                                          │
│                                                         │
│  Módulos:  Auth │ Users │ Cars │ IA │ Consultas        │
└──────┬─────────────────────────┬───────────────────────┘
       │                         │
┌──────▼──────┐         ┌────────▼──────────────────────┐
│  PostgreSQL  │         │  Supabase Storage             │
│  (Supabase)  │         │  Bucket: imagenes-autos       │
│  Tablas:     │         │  Acceso público de lectura    │
│  usuarios    │         └───────────────────────────────┘
│  autos       │
│  consultas   │         ┌───────────────────────────────┐
│  imagenes_auto│        │  Groq AI (LLM)                │
└─────────────┘          │  Modelo: llama-4-scout-17b    │
                         │  (análisis visual + texto)    │
                         └───────────────────────────────┘
```

**Tecnologías principales:**
- Frontend: HTML5, CSS3 (Bootstrap 5), JavaScript ES6+ (módulos)
- Backend: NestJS (Node.js + TypeScript)
- Base de datos: PostgreSQL en Supabase
- Storage: Supabase Storage (bucket público)
- IA: Groq API con modelo Llama 4 Scout (visión)
- Autenticación: JWT con `@nestjs/jwt` y `passport-jwt`

---

## 3. Modelo de datos

### Tabla `usuarios`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| nombre | VARCHAR(80) | Nombre del usuario |
| email | VARCHAR(120) | Email único |
| telefono | VARCHAR(30) | Teléfono (opcional) |
| password | TEXT | Hash bcrypt |
| emailVerificado | BOOLEAN | Verificación (siempre true en MVP) |
| createdAt | TIMESTAMPTZ | Fecha de registro |
| updatedAt | TIMESTAMPTZ | Última actualización |

> **Nota:** No hay columna `role`. Los usuarios acceden a funcionalidades de vendedor o comprador según el modo activo en el frontend (almacenado en `localStorage`).

### Tabla `autos`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| vendedor_id | UUID (FK) | Referencia a usuarios |
| marca | VARCHAR(60) | Marca del vehículo |
| modelo | VARCHAR(80) | Modelo |
| color | VARCHAR(40) | Color |
| anio | INTEGER | Año de fabricación |
| kilometraje | INTEGER | Kilómetros recorridos |
| transmision | ENUM | Manual / Automatico |
| combustible | ENUM | Nafta / Diesel / Hibrido / Electrico |
| precio | NUMERIC | Precio pedido por el vendedor (USD) |
| ubicacion | VARCHAR(100) | Provincia |
| descripcion | TEXT | Descripción del vendedor |
| detallesDanios | TEXT | Daños declarados |
| iaEstado | VARCHAR(40) | Estado según IA |
| iaPuntaje | FLOAT | Puntaje IA (1-10) |
| iaDanios | TEXT | Daños detectados por IA |
| iaRangoPrecioMin | NUMERIC | Precio mínimo de mercado (USD) |
| iaRangoPrecioMax | NUMERIC | Precio máximo de mercado (USD) |
| iaResumen | TEXT | Resumen del análisis |
| iaAprobado | BOOLEAN | Siempre true |
| activo | BOOLEAN | true = publicado |
| createdAt | TIMESTAMPTZ | Fecha de creación |
| updatedAt | TIMESTAMPTZ | Última actualización |

### Tabla `imagenes_auto`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| auto_id | UUID (FK) | Referencia a autos |
| storage_path | TEXT | Path en el bucket (`{autoId}/{uuid}.ext`) |
| url_publica | TEXT | URL pública de Supabase Storage |
| nombre | VARCHAR(255) | Nombre original del archivo |
| orden | INTEGER | Posición en la galería (0 = portada) |
| createdAt | TIMESTAMPTZ | Fecha de carga |

### Tabla `consultas`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID (PK) | Identificador único |
| auto_id | UUID (FK) | Referencia a autos |
| comprador_id | UUID (FK) | Referencia a usuarios (quien pregunta) |
| vendedor_id | UUID | ID del dueño del auto |
| pregunta | TEXT | Texto de la consulta |
| respuesta | TEXT | Respuesta del vendedor (nullable) |
| createdAt | TIMESTAMPTZ | Fecha de la consulta |

---

## 4. Endpoints de la API

Base URL: `https://[backend-railway].up.railway.app/api`

### Auth
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Público | Registrar usuario nuevo |
| POST | `/auth/login` | Público | Iniciar sesión, devuelve JWT |

### Usuarios
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/users/me` | JWT | Perfil del usuario autenticado |
| PATCH | `/users/me` | JWT | Actualizar nombre y teléfono |
| GET | `/users/:id` | JWT | Datos públicos de un usuario |

### Autos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/cars` | Público | Listar autos con filtros y paginación |
| GET | `/cars/mis-autos` | JWT | Autos propios del usuario |
| GET | `/cars/:id` | Público | Detalle de un auto |
| POST | `/cars/publicar` | JWT | Publicar auto (datos + imágenes + análisis IA en un request) |
| POST | `/cars/:id/reeditar` | JWT | Editar auto con re-análisis de IA |
| PATCH | `/cars/:id` | JWT | Editar datos sin IA |
| DELETE | `/cars/:id` | JWT | Eliminar publicación propia (hard delete) |
| DELETE | `/cars/:id/imagenes/:imgId` | JWT | Eliminar imagen individual |
| PATCH | `/cars/:id/imagenes/reordenar` | JWT | Reordenar galería |

**Filtros disponibles en `GET /cars`:**
`marca`, `modelo`, `ubicacion`, `precioMin`, `precioMax`, `anioMin`, `anioMax`, `combustible`, `transmision`, `orden` (reciente / precio_asc / precio_desc / km_asc), `pagina`, `limite`

### Consultas
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/consultas` | JWT | Enviar consulta (una por usuario por auto) |
| GET | `/consultas/auto/:id` | Público | Consultas de una publicación |
| GET | `/consultas/mis-consultas` | JWT | Consultas recibidas en las propias publicaciones |
| PATCH | `/consultas/:id/responder` | JWT | Responder una consulta |

### IA
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/ia/analizar` | JWT | Análisis rápido por texto (sin imágenes) |

---

## 5. Integración con IA (Groq + Llama 4 Scout)

### Proveedor
**Groq** con el modelo `meta-llama/llama-4-scout-17b-16e-instruct`, que soporta análisis visual (visión).  
Fallback: `llama-3.3-70b-versatile` cuando no hay imágenes.

### Flujo de análisis al publicar

```
1. Usuario completa el formulario + sube imágenes
2. Frontend envía todo en un solo request multipart → POST /api/cars/publicar
3. Backend recibe imágenes como buffers en memoria (sin guardar en disco ni DB)
4. Los buffers se convierten a base64 y se envían al modelo junto con los datos del auto
5. El modelo devuelve JSON con: estado, puntaje, daños, rango de precio, resumen
6. Si el resultado es válido → se guarda el auto en DB y las imágenes en Supabase Storage
7. Si hay error en la IA → se usa análisis simulado como fallback
```

### System prompt (resumen)
El modelo actúa como **perito tasador del mercado argentino** con estos criterios:

- **Estado del vehículo:**
  - `Excelente`: sin daños o daños mínimos
  - `Buen estado`: daños leves, -5% a -10% sobre precio base
  - `Regular`: daños moderados, -15% a -25%
  - `Requiere reparacion`: daños graves, -30% a -50%

- **Precio base de referencia por segmento** (USD, mercado actual):
  - Compactos 2020+: $14.000–22.000
  - SUVs premium (BMW X3/X5, Audi Q5) 2016+: $40.000–80.000
  - Pickups (Ranger, Hilux) 2018+: $30.000–55.000
  - (y otros segmentos)

- **Ajuste por kilometraje**: desde +8% (menos de 30k km) hasta -30% (más de 150k km)

- **Todas las publicaciones se aprueban** — el campo `aprobado` siempre es `true`. El estado `Requiere reparacion` implica daños graves pero el auto igual se publica con el precio ajustado.

### Respuesta del modelo
```json
{
  "estado": "Buen estado",
  "puntaje": 7.8,
  "danios": "Rayón profundo en puerta delantera derecha",
  "rangoPrecioMin": 45000,
  "rangoPrecioMax": 52000,
  "resumen": "BMW X5 2016 en buen estado general con daño leve documentado. Precio justo entre USD 45.000 y 52.000 según el mercado argentino actual.",
  "aprobado": true
}
```

---

## 6. Reglas de negocio

- Un usuario **no puede consultar su propia publicación**
- Un usuario **solo puede enviar una consulta por publicación** (evita spam)
- En modo **vendedor**: puede publicar, editar, eliminar y responder consultas
- En modo **comprador**: puede consultar, guardar favoritos y comparar autos
- Los botones de favorito y comparar **no aparecen en los autos propios**
- El botón de **editar** solo aparece para el dueño de la publicación
- Los autos **no se guardan en la DB** hasta que la IA termina el análisis

---

## 7. Variables de entorno (Backend)

```env
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET_PASSWORD=...
SUPABASE_PROJECT_REF=...
SUPABASE_ANON_KEY=...
GROQ_API_KEY=gsk_...
APP_URL=https://...railway.app
CORS_URL=https://...vercel.app
```
