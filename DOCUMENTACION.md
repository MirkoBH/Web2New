# AutoPulse — Documentación del Proyecto

**Materia:** Ingeniería Web II — 2026  
**Institución:** UNDEF  
**Repositorio:** https://github.com/MirkoBH/Web2New

---

## 1. Descripción del sistema

AutoPulse es una plataforma web de compra y venta de autos usados en Argentina. Cualquier usuario registrado puede actuar como **vendedor** (publicar vehículos) o como **comprador** (explorar, consultar y guardar favoritos), alternando entre ambos modos desde el navbar con un solo botón.

Cada publicación pasa por un análisis automático de inteligencia artificial que examina visualmente las fotos del vehículo, detecta daños, clasifica el estado y estima el precio real de mercado en Argentina. El auto solo se guarda en la base de datos una vez que la IA completa el análisis — si hay un error, nada queda guardado.

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND  (HTML + CSS + JavaScript Vanilla)                 │
│  8 páginas — sin frameworks, módulos ES6 nativos            │
│  Hosteado en: Vercel / Netlify / GitHub Pages               │
└──────────────────────┬───────────────────────────────────────┘
                       │  fetch() REST JSON
                       │  Authorization: Bearer JWT
┌──────────────────────▼───────────────────────────────────────┐
│  BACKEND  (NestJS 11 + TypeScript + TypeORM 0.3)            │
│  Prefijo global: /api                                        │
│  5 módulos: Auth │ Users │ Cars │ IA │ Consultas            │
│  Hosteado en: Railway                                        │
└───────────┬──────────────────────────┬───────────────────────┘
            │                          │
┌───────────▼────────┐    ┌────────────▼──────────────────────┐
│  PostgreSQL 17      │    │  Supabase Storage                 │
│  (Supabase)         │    │  Bucket: imagenes-autos           │
│  Región: sa-east-1  │    │  Acceso público de lectura        │
│  3 tablas           │    │  Estructura: {autoId}/{uuid}.ext  │
└────────────────────┘    └───────────────────────────────────┘
                                        │
                           ┌────────────▼──────────────────────┐
                           │  Groq API                         │
                           │  llama-4-scout-17b (con visión)   │
                           │  llama-3.3-70b (fallback texto)   │
                           └───────────────────────────────────┘
```

**Stack tecnológico:**

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | HTML5, CSS3, Bootstrap, JavaScript ES6+ | Bootstrap 5.3.3 |
| Backend | NestJS, TypeScript | NestJS 11 |
| ORM | TypeORM | 0.3.29 |
| Base de datos | PostgreSQL en Supabase | PostgreSQL 17 |
| Storage | Supabase Storage SDK | 2.105.4 |
| IA | Groq SDK | 1.1.2 |
| Autenticación | JWT + Passport | @nestjs/jwt |
| Hash contraseñas | bcryptjs | — |
| Validación DTOs | class-validator + class-transformer | — |

---

## 3. Estructura del repositorio

```
Web2New/
├── DOCUMENTACION.md          ← Este archivo
│
├── FRONTEND/
│   ├── index.html            ← Landing page
│   ├── listado.html          ← Listado con filtros
│   ├── detalle.html          ← Detalle de publicación
│   ├── publicar.html         ← Formulario de publicación
│   ├── editar.html           ← Editar publicación
│   ├── perfil.html           ← Panel del usuario
│   ├── login.html            ← Inicio de sesión
│   ├── registro.html         ← Registro de cuenta
│   ├── wishlist.html         ← Redirige al perfil modo comprador
│   ├── runtime-config.js     ← URL del backend (configurable por entorno)
│   ├── css/
│   │   └── styles.css        ← Estilos globales, responsive mobile-first
│   └── js/
│       ├── app-init.js       ← Inicializa navbar, footer, comparador
│       ├── config.js         ← Lee runtime-config.js
│       ├── components/
│       │   ├── navbar.js     ← Navbar con sistema de modos
│       │   ├── footer.js     ← Footer del sitio
│       │   ├── car-card.js   ← Tarjeta de auto reutilizable
│       │   └── compare-drawer.js ← Panel lateral de comparación
│       ├── pages/
│       │   ├── index.js      ← Lógica landing: autos destacados
│       │   ├── listado.js    ← Filtros, paginación, grilla
│       │   ├── detalle.js    ← Galería, ficha técnica, consultas
│       │   ├── publicar.js   ← Formulario + envío a API
│       │   ├── editar.js     ← Edición con re-análisis IA
│       │   ├── perfil.js     ← Panel vendedor y comprador
│       │   ├── login.js      ← Autenticación
│       │   ├── registro.js   ← Registro de usuario
│       │   └── wishlist.js   ← Redirige al perfil
│       ├── utils/
│       │   ├── api.js        ← Cliente HTTP centralizado (fetch + JWT)
│       │   ├── auth.js       ← requireAuth() con verificación de modo
│       │   ├── storage.js    ← localStorage: sesión, modo, compare, wishlist
│       │   ├── dom.js        ← Helpers: qs(), formatUsd(), formatKm()
│       │   └── cards.js      ← renderCards() reutilizable
│       └── data/
│           ├── catalogs.js   ← Marcas y provincias de Argentina
│           └── mock-data.js  ← Referencia de estructura (no se usa en producción)
│
└── BACKEND/
    ├── railway.toml          ← Configuración de despliegue Railway
    ├── .env.example          ← Template de variables de entorno
    └── src/
        ├── main.ts           ← Bootstrap, CORS, ValidationPipe, puerto
        ├── app.module.ts     ← Módulo raíz: TypeORM, ServeStatic, módulos
        ├── auth/
        │   ├── auth.controller.ts   ← POST /auth/register, /auth/login
        │   ├── auth.service.ts      ← Lógica de registro y login
        │   ├── jwt.strategy.ts      ← Validación de tokens JWT
        │   └── dto/login.dto.ts
        ├── users/
        │   ├── usuario.entity.ts    ← Entidad TypeORM de usuario
        │   ├── users.service.ts     ← CRUD de usuarios
        │   ├── users.controller.ts  ← GET/PATCH /users/me, GET /users/:id
        │   └── dto/
        ├── cars/
        │   ├── auto.entity.ts       ← Entidad TypeORM de auto
        │   ├── imagen-auto.entity.ts← Entidad TypeORM de imagen
        │   ├── cars.service.ts      ← CRUD, Storage, análisis
        │   ├── cars.controller.ts   ← Todos los endpoints de autos
        │   ├── storage.service.ts   ← Wrapper Supabase Storage SDK
        │   └── dto/
        ├── ia/
        │   ├── ia.service.ts        ← Integración Groq, prompt, fallback
        │   └── ia.controller.ts     ← POST /ia/analizar
        ├── consultas/
        │   ├── consulta.entity.ts   ← Entidad TypeORM de consulta
        │   ├── consultas.service.ts ← Lógica + validaciones de negocio
        │   ├── consultas.controller.ts
        │   └── dto/
        └── common/
            ├── guards/
            │   └── jwt-auth.guard.ts← Protección de rutas con JWT
            └── decorators/
                └── usuario-actual.decorator.ts ← Inyecta user del JWT
```

---

## 4. Modelo de datos

### Tabla `usuarios`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único (generado automáticamente) |
| nombre | VARCHAR(80) | Nombre completo |
| email | VARCHAR(120) UNIQUE | Email de acceso |
| telefono | VARCHAR(30) | Teléfono (opcional) |
| password | TEXT | Hash bcrypt (no se devuelve en queries por `select: false`) |
| emailVerificado | BOOLEAN | Siempre `true` en esta versión |
| createdAt | TIMESTAMPTZ | Fecha de registro (auto) |
| updatedAt | TIMESTAMPTZ | Última actualización (auto) |

> No existe columna `role`. El modo vendedor/comprador es un estado del frontend guardado en `localStorage` y puede cambiarse en cualquier momento.

### Tabla `autos`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| vendedor_id | UUID FK → usuarios | Dueño de la publicación |
| marca | VARCHAR(60) | Ej: Toyota, BMW |
| modelo | VARCHAR(80) | Ej: Corolla, X5 |
| color | VARCHAR(40) | Color del vehículo |
| anio | INTEGER | Año de fabricación |
| kilometraje | INTEGER | Kilómetros recorridos |
| transmision | ENUM | `Manual` / `Automatico` |
| combustible | ENUM | `Nafta` / `Diesel` / `Hibrido` / `Electrico` |
| precio | NUMERIC(10,2) | Precio pedido por el vendedor (USD) |
| ubicacion | VARCHAR(100) | Provincia argentina |
| descripcion | TEXT | Descripción libre del vendedor |
| detallesDanios | TEXT | Daños declarados por el vendedor |
| iaEstado | VARCHAR(40) | Estado según IA: Excelente / Buen estado / Regular / Requiere reparacion |
| iaPuntaje | FLOAT | Puntaje IA del 1.0 al 10.0 |
| iaDanios | TEXT | Daños detectados por la IA en las fotos |
| iaRangoPrecioMin | NUMERIC(10,2) | Precio mínimo de mercado sugerido (USD) |
| iaRangoPrecioMax | NUMERIC(10,2) | Precio máximo de mercado sugerido (USD) |
| iaResumen | TEXT | Resumen del análisis en español argentino |
| iaAprobado | BOOLEAN | Siempre `true` (todas las publicaciones se aprueban) |
| activo | BOOLEAN | `true` = visible en el listado |
| createdAt | TIMESTAMPTZ | Fecha de publicación (auto) |
| updatedAt | TIMESTAMPTZ | Última modificación (auto) |

### Tabla `imagenes_auto`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| auto_id | UUID FK → autos CASCADE | Auto al que pertenece |
| storage_path | TEXT | Path en el bucket: `{autoId}/{uuid}.ext` |
| url_publica | TEXT | URL pública permanente de Supabase Storage |
| nombre | VARCHAR(255) | Nombre original del archivo subido |
| orden | INTEGER | Posición en la galería (0 = portada) |
| createdAt | TIMESTAMPTZ | Fecha de carga (auto) |

### Tabla `consultas`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| auto_id | UUID FK → autos CASCADE | Publicación consultada |
| comprador_id | UUID FK → usuarios CASCADE | Usuario que hace la pregunta |
| vendedor_id | UUID | ID del dueño del auto (para queries directas) |
| pregunta | TEXT | Texto de la consulta |
| respuesta | TEXT NULL | Respuesta del vendedor (null = pendiente) |
| createdAt | TIMESTAMPTZ | Fecha de la consulta (auto) |

**Índices creados:** `idx_autos_marca`, `idx_autos_precio`, `idx_autos_vendedor`, `idx_autos_activo`, `idx_consultas_auto`, `idx_consultas_vendedor`

---

## 5. Páginas del Frontend

| Página | Archivo | Descripción | Acceso |
|---|---|---|---|
| Landing | `index.html` | Hero, estadísticas, marcas, autos destacados, FAQ | Público |
| Listado | `listado.html` | Grilla con filtros (marca, precio, km, combustible, transmisión, provincia) y paginación | Público |
| Detalle | `detalle.html` | Galería de fotos, ficha técnica, informe IA, consultas públicas | Público |
| Publicar | `publicar.html` | Formulario + fotos → análisis IA → publicación | Modo vendedor |
| Editar | `editar.html` | Edición de datos y fotos con re-análisis IA | Modo vendedor (dueño) |
| Perfil | `perfil.html` | Panel vendedor (mis autos, consultas recibidas) o comprador (favoritos) | Sesión activa |
| Login | `login.html` | Formulario de inicio de sesión | Público |
| Registro | `registro.html` | Formulario de registro | Público |

---

## 6. Endpoints de la API

**Base URL:** `https://[proyecto].up.railway.app/api`  
**Autenticación:** header `Authorization: Bearer {JWT}` (token con expiración de 7 días)

### Auth — público
| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{nombre, email, telefono?, password}` | `{usuario, token}` |
| POST | `/auth/login` | `{email, password}` | `{usuario, token}` |

### Usuarios — requiere JWT
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/users/me` | Perfil del usuario autenticado |
| PATCH | `/users/me` | Actualizar nombre y/o teléfono |
| GET | `/users/:id` | Datos públicos de cualquier usuario |

### Autos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/cars` | No | Listado paginado con filtros |
| GET | `/cars/:id` | No | Detalle completo de un auto con imágenes y vendedor |
| GET | `/cars/mis-autos` | JWT | Autos publicados por el usuario autenticado |
| POST | `/cars/publicar` | JWT | Publicar: multipart con datos + imágenes. La IA analiza antes de guardar |
| POST | `/cars/:id/reeditar` | JWT | Editar con re-análisis IA. Sin cambios si hay error |
| PATCH | `/cars/:id` | JWT | Editar datos sin IA (precio, km, descripción) |
| DELETE | `/cars/:id` | JWT | Eliminar publicación propia (hard delete: DB + Storage) |
| DELETE | `/cars/:id/imagenes/:imgId` | JWT | Eliminar imagen individual del bucket |
| PATCH | `/cars/:id/imagenes/reordenar` | JWT | Cambiar orden de la galería |

**Filtros disponibles en `GET /cars`:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| marca | string | Filtro parcial (LIKE) |
| modelo | string | Filtro parcial (LIKE) |
| ubicacion | string | Filtro parcial (LIKE) |
| precioMin / precioMax | number | Rango de precio en USD |
| anioMin / anioMax | number | Rango de año |
| combustible | string | Nafta / Diesel / Hibrido / Electrico |
| transmision | string | Manual / Automatico |
| orden | string | `reciente` / `precio_asc` / `precio_desc` / `km_asc` |
| pagina | number | Página actual (default: 1) |
| limite | number | Resultados por página (default: 9, max: 50) |

### Consultas
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/consultas` | JWT | Enviar consulta. Máx. 1 por usuario por auto |
| GET | `/consultas/auto/:id` | No | Consultas públicas de una publicación |
| GET | `/consultas/mis-consultas` | JWT | Consultas recibidas en mis publicaciones |
| PATCH | `/consultas/:id/responder` | JWT | Responder una consulta recibida |

### IA
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/ia/analizar` | JWT | Análisis rápido por texto sin imágenes ni auto guardado |

---

## 7. Sistema de modos (Comprador / Vendedor)

Todos los usuarios tienen acceso completo a la plataforma. El **modo activo** (comprador o vendedor) determina qué funcionalidades son visibles y accesibles:

| Funcionalidad | Modo Comprador | Modo Vendedor |
|---|---|---|
| Explorar listado | ✅ | ✅ |
| Ver detalle de auto | ✅ | ✅ |
| Enviar consulta | ✅ | ❌ |
| Guardar favoritos | ✅ | ❌ |
| Comparar autos | ✅ | ✅ |
| Publicar auto | ❌ | ✅ |
| Editar publicación propia | ❌ | ✅ |
| Eliminar publicación propia | ❌ | ✅ |
| Responder consultas | ❌ | ✅ |

El modo se almacena en `localStorage` (campo `modo` de la sesión) y se cambia desde el navbar. Al registrarse o iniciar sesión, el modo inicial es siempre **comprador**.

---

## 8. Reglas de negocio

Implementadas tanto en el backend como en el frontend:

| # | Regla | Validación |
|---|---|---|
| 1 | Un usuario no puede consultar su propia publicación | Backend: `ForbiddenException` + Frontend: oculta el formulario |
| 2 | Solo una consulta por usuario por publicación | Backend: verifica duplicado antes de insertar |
| 3 | El vendedor de una publicación no puede responder consultas de otros autos | Backend: verifica `consulta.vendedorId === usuarioId` |
| 4 | No se pueden guardar autos propios como favoritos | Frontend: verifica `auto.vendedorId === sesion.userId` |
| 5 | No se pueden comparar autos propios | Frontend: oculta el botón + doble validación en el event listener |
| 6 | El botón editar solo aparece para el dueño del auto | Frontend: `car-card.js` y `detalle.js` |
| 7 | Modo comprador no puede acceder a publicar | Frontend: `requireAuth("vendedor")` redirige si el modo no coincide |
| 8 | Modo vendedor no puede enviar consultas | Frontend: oculta el formulario de consulta |
| 9 | El auto no se guarda si hay error en la IA | Backend: DB y Storage solo se escriben tras análisis exitoso |
| 10 | Al eliminar un auto se borran sus imágenes del bucket | Backend: `StorageService.eliminarCarpetaAuto()` antes del `remove()` |

---

## 9. Integración con IA (Groq)

### Proveedor y modelos
- **Análisis con imágenes:** `meta-llama/llama-4-scout-17b-16e-instruct` (soporte de visión)
- **Análisis solo texto:** `llama-3.3-70b-versatile` (fallback si no hay fotos)
- **Proveedor:** Groq — sin límites estrictos en el free tier
- **Fallback:** si Groq falla por cualquier razón, se usa un análisis simulado para no bloquear la publicación

### Flujo completo al publicar

```
1. Usuario llena el formulario y selecciona hasta 10 fotos
2. Frontend envía TODO en un solo request multipart → POST /api/cars/publicar
3. Backend recibe los buffers de imagen en memoria RAM (memoryStorage de multer)
   → Las imágenes NO se guardan en disco ni en Supabase todavía
4. Los buffers se convierten a base64 y se envían a Groq junto con los datos
5. Groq analiza visualmente las fotos y devuelve un JSON con el análisis
6. Si el análisis es exitoso:
   a. Se crea el registro del auto en PostgreSQL (activo: true, con datos IA)
   b. Las imágenes se suben al bucket de Supabase Storage
   c. Se registran en la tabla imagenes_auto con URL pública y orden
7. Si Groq falla: se usa análisis simulado y se continúa con el flujo
8. Se devuelve el auto completo con imágenes y análisis al frontend
```

### Criterios de clasificación del estado

| Estado | Criterio | Ajuste de precio |
|---|---|---|
| **Excelente** | Sin ningún daño visible. Km < 50.000. Aspecto impecable en todas las fotos | Sin descuento |
| **Buen estado** | Sin daños visibles o absolutamente imperceptibles. Km hasta ~100.000 | -3% a -5% |
| **Regular** | Daños leves visibles (rayones, pequeños golpes) y/o Km > 100.000 | -10% a -20% |
| **Requiere reparacion** | Daños graves: abolladuras, choque estructural, óxido extendido, múltiples paneles | -25% a -50% |

**Reglas absolutas para el modelo:**
- Cualquier daño visible en fotos → estado NO puede ser "Excelente"
- Km > 100.000 → estado NO puede ser "Excelente" ni "Buen estado"

### Precio de referencia por segmento (mercado argentino, USD)

| Segmento | Rango |
|---|---|
| Compactos (Fiat Argo, VW Polo, Peugeot 208) 2020+ | $14.000 – $22.000 |
| Sedanes medianos (Toyota Corolla, VW Vento) 2018+ | $18.000 – $28.000 |
| SUVs compactas (Renegade, Duster, T-Cross) 2019+ | $20.000 – $32.000 |
| SUVs medianas (RAV4, Tiguan, Compass) 2018+ | $30.000 – $50.000 |
| SUVs premium (BMW X3/X5, Audi Q5, Mercedes GLC) 2016+ | $40.000 – $80.000 |
| Pickups (Ford Ranger, Toyota Hilux) 2018+ | $30.000 – $55.000 |
| Autos de lujo (BMW Serie 3/5, Mercedes C/E) 2016+ | $35.000 – $70.000 |
| Económicos (VW Gol, Chevrolet Classic) 2015–2018 | $8.000 – $14.000 |

**Ajuste adicional por kilometraje:**

| Kilometraje | Ajuste |
|---|---|
| Menos de 30.000 km | +8% |
| 30.001 – 60.000 km | Sin ajuste |
| 60.001 – 100.000 km | -8% |
| 100.001 – 150.000 km | -18% |
| Más de 150.000 km | -30% |

### Respuesta esperada del modelo

```json
{
  "estado": "Buen estado",
  "puntaje": 7.8,
  "danios": "Rayón profundo en puerta delantera derecha visible en foto 2",
  "rangoPrecioMin": 45000,
  "rangoPrecioMax": 52000,
  "resumen": "BMW X5 2016 en buen estado con daño leve documentado. Precio justo entre USD 45.000 y 52.000 según el mercado argentino actual.",
  "aprobado": true
}
```

---

## 10. Seguridad

- **Contraseñas:** hash con bcrypt (salt rounds: 12)
- **JWT:** firmado con `JWT_SECRET_PASSWORD`, expiración de 7 días
- **CORS:** configurado con lista blanca de orígenes (variable `CORS_URL`)
- **Validación:** `ValidationPipe` global con `whitelist: true` (elimina campos no declarados)
- **Rutas protegidas:** `JwtAuthGuard` en todos los endpoints que modifican datos
- **Autorización:** verificación de propiedad (`vendedorId === usuarioId`) en editar, eliminar y responder
- **CSP:** Content-Security-Policy en todos los HTMLs del frontend
- **Storage:** bucket público solo para lectura; escritura y borrado requieren la anon key del backend
- **SQL Injection:** protegido por TypeORM con parámetros nombrados en todas las queries

---

## 11. Variables de entorno (Backend)

Crear archivo `.env` en `BACKEND/` basado en `.env.example`:

```env
# URL pública del backend (Railway)
APP_URL=https://[proyecto].up.railway.app

# URL del frontend para CORS
CORS_URL=https://[proyecto].vercel.app

# Supabase PostgreSQL — Session Pooler puerto 5432
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
DB_SSL=true

# JWT — usar una clave larga y aleatoria
JWT_SECRET_PASSWORD=clave_muy_larga_y_segura_minimo_32_caracteres

# Supabase Storage
SUPABASE_PROJECT_REF=tu_project_ref
SUPABASE_ANON_KEY=eyJhbGci...

# Groq AI — obtener en console.groq.com
GROQ_API_KEY=gsk_...
```

---

## 12. Frontend — Configuración de entorno

Editar `FRONTEND/runtime-config.js` con la URL real del backend antes de deployar:

```js
window.__APP_CONFIG__ = {
  API_BASE_URL: "https://[tu-proyecto].up.railway.app/api"
};
```

En desarrollo local usar:

```js
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://localhost:3000/api"
};
```

---

## 13. Despliegue

| Componente | Servicio recomendado | Alternativas |
|---|---|---|
| Frontend | Vercel / Netlify | GitHub Pages |
| Backend | Railway | Render, Fly.io, Koyeb |
| Base de datos | Supabase (PostgreSQL) | Neon, PlanetScale |
| Storage de imágenes | Supabase Storage | Cloudinary, AWS S3 |

### Pasos de despliegue

**Backend en Railway:**
1. Conectar el repositorio GitHub
2. Seleccionar la carpeta `BACKEND/` como root directory
3. Railway detecta NestJS automáticamente y usa el `railway.toml`
4. Agregar todas las variables de entorno del punto 11
5. Deploy automático en cada push a `develop`

**Frontend en Vercel:**
1. Conectar el repositorio GitHub
2. Seleccionar la carpeta `FRONTEND/` como root directory
3. No requiere build command (archivos estáticos)
4. Actualizar `runtime-config.js` con la URL de Railway antes del deploy

---

## 14. Desarrollo local

```bash
# Clonar el repositorio
git clone https://github.com/MirkoBH/Web2New.git
cd Web2New

# Backend
cd BACKEND
npm install
cp .env.example .env     # completar con variables reales
npm run start:dev         # http://localhost:3000/api

# Frontend
# Abrir FRONTEND/index.html con Live Server de VS Code
# o cualquier servidor estático en el puerto que corresponda
```

**Usuarios de prueba en la DB:**
- `vendedor@demo.com` / `Demo1234!`
- `comprador@demo.com` / `Demo1234!`
