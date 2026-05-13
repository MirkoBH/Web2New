# AutoPulse — Documentación del Proyecto

**Materia:** Ingeniería Web II — 2026  
**Institución:** UNDEF  
**Repositorio:** https://github.com/MirkoBH/Web2New

---

## 1. Descripción del sistema

AutoPulse es una plataforma web de compra y venta de autos usados en Argentina. Cualquier usuario registrado puede actuar como **vendedor** (publicar vehículos) o como **comprador** (explorar, consultar y guardar favoritos), alternando entre ambos modos desde el navbar con un solo botón.

Cada publicación pasa por un análisis automático de inteligencia artificial que examina visualmente las fotos del vehículo, detecta daños, clasifica el estado y estima el precio real de mercado en Argentina. El auto solo se guarda en la base de datos una vez que la IA completa el análisis exitosamente.

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND  (HTML + CSS + JavaScript Vanilla)                 │
│  8 páginas — sin frameworks, módulos ES6 nativos            │
│  Hosteado en: Railway                                        │
│  URL: https://frontend-production-0959.up.railway.app        │
└──────────────────────┬───────────────────────────────────────┘
                       │  fetch() REST JSON
                       │  Authorization: Bearer JWT
┌──────────────────────▼───────────────────────────────────────┐
│  BACKEND  (NestJS 11 + TypeScript + TypeORM 0.3)            │
│  Prefijo global: /api                                        │
│  5 módulos: Auth │ Users │ Cars │ IA │ Consultas            │
│  Hosteado en: Railway                                        │
│  URL: https://web2new-production.up.railway.app              │
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
├── DOCUMENTACION.md
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
│   ├── runtime-config.js     ← URL del backend
│   ├── serve.json            ← Configuración del servidor estático
│   ├── railway.toml          ← Configuración de despliegue Railway
│   ├── css/
│   │   └── styles.css        ← Estilos globales, responsive mobile-first
│   └── js/
│       ├── app-init.js       ← Inicializa navbar, footer, comparador
│       ├── components/
│       │   ├── navbar.js     ← Navbar con sistema de modos
│       │   ├── footer.js     ← Footer del sitio
│       │   ├── car-card.js   ← Tarjeta de auto reutilizable
│       │   └── compare-drawer.js ← Panel lateral de comparación
│       ├── pages/
│       │   ├── index.js      ← Autos destacados en landing
│       │   ├── listado.js    ← Filtros, paginación, grilla
│       │   ├── detalle.js    ← Galería, ficha técnica, consultas
│       │   ├── publicar.js   ← Formulario + envío a API
│       │   ├── editar.js     ← Edición con re-análisis IA
│       │   ├── perfil.js     ← Panel vendedor y comprador
│       │   ├── login.js      ← Autenticación
│       │   └── registro.js   ← Registro de usuario
│       ├── utils/
│       │   ├── api.js        ← Cliente HTTP centralizado
│       │   ├── auth.js       ← requireAuth() con verificación de modo
│       │   ├── storage.js    ← localStorage: sesión, modo, compare, wishlist
│       │   ├── dom.js        ← Helpers: qs(), formatUsd(), formatKm()
│       │   └── cards.js      ← renderCards() reutilizable
│       └── data/
│           └── catalogs.js   ← Marcas y provincias de Argentina
│
└── BACKEND/
    ├── railway.toml          ← Configuración de despliegue Railway
    ├── nixpacks.toml         ← Runtime Node.js 20 para Railway
    ├── .env.example          ← Template de variables de entorno
    └── src/
        ├── main.ts           ← Bootstrap, CORS, ValidationPipe
        ├── app.module.ts     ← Módulo raíz: TypeORM, módulos
        ├── auth/             ← Registro, login, JWT strategy
        ├── users/            ← Entidad, service y controller de usuarios
        ├── cars/             ← Auto, ImagenAuto, CRUD, Storage
        ├── ia/               ← Integración con Groq
        ├── consultas/        ← Preguntas comprador → vendedor
        └── common/           ← Guards y decoradores compartidos
```

---

## 4. Modelo de datos

### Tabla `usuarios`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| nombre | VARCHAR(80) | Nombre completo |
| email | VARCHAR(120) UNIQUE | Email de acceso |
| telefono | VARCHAR(30) | Teléfono (opcional) |
| password | TEXT | Hash bcrypt — `select: false` |
| emailVerificado | BOOLEAN | Siempre `true` en esta versión |
| createdAt / updatedAt | TIMESTAMPTZ | Auditoría automática |

> No existe columna `role`. El modo vendedor/comprador es un estado del frontend en `localStorage`.

### Tabla `autos`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| vendedor_id | UUID FK → usuarios | Dueño de la publicación |
| marca / modelo / color | VARCHAR | Datos del vehículo |
| anio / kilometraje | INTEGER | Año y km recorridos |
| transmision | ENUM | `Manual` / `Automatico` |
| combustible | ENUM | `Nafta` / `Diesel` / `Hibrido` / `Electrico` |
| precio | NUMERIC(10,2) | Precio pedido por el vendedor (USD) |
| ubicacion | VARCHAR(100) | Provincia argentina |
| descripcion | TEXT | Descripción del vendedor |
| detallesDanios | TEXT | Daños declarados |
| iaEstado | VARCHAR(40) | Estado según IA |
| iaPuntaje | FLOAT | Puntaje IA (1.0 – 10.0) |
| iaDanios | TEXT | Daños detectados por IA |
| iaRangoPrecioMin / Max | NUMERIC(10,2) | Rango de precio de mercado (USD) |
| iaResumen | TEXT | Resumen del análisis |
| iaAprobado | BOOLEAN | Siempre `true` |
| activo | BOOLEAN | `true` = visible en listado |
| createdAt / updatedAt | TIMESTAMPTZ | Auditoría automática |

### Tabla `imagenes_auto`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| auto_id | UUID FK → autos CASCADE | Auto al que pertenece |
| storage_path | TEXT | Path en el bucket: `{autoId}/{uuid}.ext` |
| url_publica | TEXT | URL pública de Supabase Storage |
| nombre | VARCHAR(255) | Nombre original del archivo |
| orden | INTEGER | Posición en galería (0 = portada) |
| createdAt | TIMESTAMPTZ | Fecha de carga |

### Tabla `consultas`
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID PK | Identificador único |
| auto_id | UUID FK → autos CASCADE | Publicación consultada |
| comprador_id | UUID FK → usuarios | Usuario que pregunta |
| vendedor_id | UUID | Dueño del auto |
| pregunta | TEXT | Texto de la consulta |
| respuesta | TEXT NULL | Respuesta del vendedor |
| createdAt | TIMESTAMPTZ | Fecha |

**Índices:** `idx_autos_marca`, `idx_autos_precio`, `idx_autos_vendedor`, `idx_autos_activo`, `idx_consultas_auto`, `idx_consultas_vendedor`

---

## 5. Páginas del Frontend

| Página | Archivo | Descripción | Acceso |
|---|---|---|---|
| Landing | `index.html` | Hero, estadísticas, marcas, autos destacados, FAQ | Público |
| Listado | `listado.html` | Grilla con filtros y paginación | Público |
| Detalle | `detalle.html` | Galería, ficha técnica, informe IA, consultas | Público |
| Publicar | `publicar.html` | Formulario + fotos → análisis IA → publicación | Modo vendedor |
| Editar | `editar.html` | Edición de datos y fotos con re-análisis IA | Modo vendedor (dueño) |
| Perfil | `perfil.html` | Panel vendedor o comprador según modo activo | Sesión activa |
| Login | `login.html` | Inicio de sesión | Público |
| Registro | `registro.html` | Crear cuenta | Público |

---

## 6. Endpoints de la API

**Base URL:** `https://web2new-production.up.railway.app/api`  
**Autenticación:** header `Authorization: Bearer {JWT}` (expiración 7 días)

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
| GET | `/users/:id` | Datos públicos de un usuario |

### Autos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/cars` | No | Listado paginado con filtros |
| GET | `/cars/:id` | No | Detalle con imágenes y vendedor |
| GET | `/cars/mis-autos` | JWT | Autos publicados por el usuario |
| POST | `/cars/publicar` | JWT | Publicar: multipart datos + imágenes. IA analiza antes de guardar |
| POST | `/cars/:id/reeditar` | JWT | Editar con re-análisis IA |
| PATCH | `/cars/:id` | JWT | Editar datos sin IA |
| DELETE | `/cars/:id` | JWT | Eliminar publicación (hard delete: DB + Storage) |
| DELETE | `/cars/:id/imagenes/:imgId` | JWT | Eliminar imagen individual |
| PATCH | `/cars/:id/imagenes/reordenar` | JWT | Reordenar galería |

**Filtros de `GET /cars`:** `marca`, `modelo`, `ubicacion`, `precioMin`, `precioMax`, `anioMin`, `anioMax`, `combustible`, `transmision`, `orden` (`reciente` / `precio_asc` / `precio_desc` / `km_asc`), `pagina`, `limite`

### Consultas
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/consultas` | JWT | Enviar consulta (máx. 1 por usuario por auto) |
| GET | `/consultas/auto/:id` | No | Consultas públicas de una publicación |
| GET | `/consultas/mis-consultas` | JWT | Consultas recibidas en mis publicaciones |
| PATCH | `/consultas/:id/responder` | JWT | Responder una consulta |

### IA
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/ia/analizar` | JWT | Análisis rápido por texto sin imágenes |

---

## 7. Sistema de modos (Comprador / Vendedor)

Todos los usuarios tienen acceso completo. El **modo activo** determina qué funcionalidades son visibles:

| Funcionalidad | Modo Comprador | Modo Vendedor |
|---|---|---|
| Explorar listado y detalle | ✅ | ✅ |
| Enviar consulta | ✅ | ❌ |
| Guardar favoritos | ✅ | ❌ |
| Comparar autos | ✅ | ✅ |
| Publicar auto | ❌ | ✅ |
| Editar / Eliminar publicación propia | ❌ | ✅ |
| Responder consultas recibidas | ❌ | ✅ |

El modo se almacena en `localStorage` y se cambia desde el navbar. Al registrarse o iniciar sesión el modo inicial es siempre **comprador**.

---

## 8. Integración con IA (Groq)

### Proveedor y modelos
- **Con imágenes:** `meta-llama/llama-4-scout-17b-16e-instruct` (visión)
- **Solo texto:** `llama-3.3-70b-versatile` (fallback sin fotos)
- **Fallback:** si Groq falla se usa análisis simulado para no bloquear la publicación

### Flujo al publicar

```
1. Usuario llena formulario y selecciona fotos (hasta 10)
2. Frontend envía todo en UN solo request multipart → POST /api/cars/publicar
3. Backend recibe buffers en memoria RAM (sin guardar en disco ni DB)
4. Buffers convertidos a base64 → enviados a Groq con datos del auto
5. Groq analiza visualmente las fotos y devuelve JSON con el análisis
6. Auto guardado en PostgreSQL + imágenes subidas a Supabase Storage
7. Se devuelve el auto completo con URLs públicas al frontend
```

### Criterios de clasificación

| Estado | Criterio | Ajuste de precio |
|---|---|---|
| **Excelente** | Sin ningún daño visible. Km < 50.000. Aspecto impecable | Sin descuento |
| **Buen estado** | Sin daños visibles. Km hasta ~100.000 | -3% a -5% |
| **Regular** | Daños leves visibles (rayones, golpes) y/o Km > 100.000 | -10% a -20% |
| **Requiere reparacion** | Daños graves: abolladuras, choque estructural, óxido | -25% a -50% |

**Reglas absolutas:**
- Cualquier daño visible → estado NO puede ser "Excelente"
- Km > 100.000 → estado NO puede ser "Excelente" ni "Buen estado"
- Todas las publicaciones se aprueban (`aprobado: true` siempre)

### Precio de referencia (mercado argentino, USD)

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

**Ajuste por kilometraje:**

| Kilometraje | Ajuste |
|---|---|
| < 30.000 km | +8% |
| 30.001 – 60.000 km | Sin ajuste |
| 60.001 – 100.000 km | -8% |
| 100.001 – 150.000 km | -18% |
| > 150.000 km | -30% |

---

## 9. Seguridad

- **Contraseñas:** hash bcrypt (salt rounds: 12)
- **JWT:** firmado con clave secreta, expiración 7 días
- **CORS:** acepta orígenes `*.railway.app` y `localhost` en desarrollo
- **Validación:** `ValidationPipe` global con `whitelist: true`
- **Autorización:** verificación de propiedad en editar, eliminar y responder
- **CSP:** Content-Security-Policy en todos los HTMLs del frontend
- **Storage:** escritura al bucket solo desde el backend con anon key
- **SQL Injection:** protegido por parámetros nombrados de TypeORM

---

## 10. Despliegue

**URLs en producción:**
- Frontend: https://frontend-production-0959.up.railway.app
- Backend: https://web2new-production.up.railway.app/api

Ambos servicios están hosteados en **Railway**, conectados al repositorio GitHub con deploy automático en cada push a la rama `develop`.

**Servicios externos:**
- Base de datos: **Supabase** (PostgreSQL 17, región sa-east-1 — São Paulo)
- Storage de imágenes: **Supabase Storage** (bucket `imagenes-autos`, público)
- IA: **Groq** (free tier, sin límites estrictos)
