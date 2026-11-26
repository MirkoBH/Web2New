# AutoPulse — Documentación del Proyecto

**Materia:** Ingeniería Web II — 2026  
**Institución:** UNDEF  
**Repositorio:** https://github.com/MirkoBH/Web2New

---

## 1. Descripción del sistema

AutoPulse es una plataforma web de compra y venta de autos usados en Argentina. Cualquier usuario registrado puede actuar como **vendedor** (publicar y responder consultas) o como **comprador** (consultar, guardar favoritos y comparar), y cambia de modo desde el encabezado.

Cada publicación pasa por un análisis de inteligencia artificial que revisa las fotos del vehículo, detecta daños, clasifica el estado y estima un rango de precio de mercado en dólares. El auto solo se guarda cuando la IA termina el análisis; si la IA no está disponible, no se publica nada y se le pide al usuario que intente de nuevo.

---

## 2. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  FRONTEND  (HTML + CSS + JavaScript Vanilla + Bootstrap 5)   │
│  8 páginas, módulos ES nativos, sin frameworks de JS         │
│  Hosteado en: Render (sitio estático)                        │
└──────────────────────┬───────────────────────────────────────┘
                       │  fetch() REST JSON / multipart
                       │  Authorization: Bearer JWT
┌──────────────────────▼───────────────────────────────────────┐
│  BACKEND  (NestJS 11 + TypeScript + TypeORM 0.3)             │
│  Prefijo global: /api                                        │
│  Módulos: auth │ users │ cars │ inquiries │ ai │ health     │
│  Hosteado en: Render (servicio web)                          │
└───────────┬──────────────────────────┬───────────────────────┘
            │                          │
┌───────────▼────────┐    ┌────────────▼──────────────────────┐
│  PostgreSQL 17      │    │  Supabase Storage                 │
│  (Supabase)         │    │  Bucket: imagenes-autos           │
│  Región: sa-east-1  │    │  Lectura pública, escritura solo  │
│  4 tablas, con RLS  │    │  con la clave secreta del backend │
└────────────────────┘    └───────────────────────────────────┘
                                        │
                           ┌────────────▼──────────────────────┐
                           │  Groq API                         │
                           │  qwen/qwen3.8-27b (con visión)    │
                           └───────────────────────────────────┘
```

**Stack tecnológico:**

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | HTML5, CSS3, JavaScript (módulos ES), Bootstrap | Bootstrap 5.3.3 (servido desde el propio sitio) |
| Backend | NestJS, TypeScript | NestJS 11 |
| ORM | TypeORM | 0.3 |
| Base de datos | PostgreSQL en Supabase | PostgreSQL 17 |
| Storage | @supabase/storage-js | 2.x |
| Imágenes | sharp (validación, rotación, tamaño, sin EXIF) | 0.35 |
| IA | groq-sdk | 1.x |
| Autenticación | JWT + Passport | @nestjs/jwt 11 |
| Seguridad HTTP | helmet, @nestjs/throttler | — |
| Validación | class-validator + class-transformer | — |

---

## 3. Estructura del repositorio

```
Web2New/
├── render.yaml                    Despliegue de API y frontend en Render
├── DOCUMENTACION.md
├── BACKEND/
│   ├── database/
│   │   ├── schema.sql             Esquema completo (crear la base desde cero)
│   │   └── migrations/            Cambios aplicados a la base existente
│   └── src/
│       ├── main.ts                helmet, CORS, ValidationPipe, prefijo /api
│       ├── app.module.ts          TypeORM, límite de pedidos, módulos
│       ├── config/                Validación de variables de entorno
│       ├── common/                Guardia JWT, @CurrentUser, tipos, validadores
│       ├── auth/                  Registro e inicio de sesión
│       ├── users/                 Perfil propio
│       ├── cars/                  Publicaciones, filtros, fotos, almacenamiento
│       ├── inquiries/             Preguntas y respuestas públicas
│       ├── ai/                    Prompt, mosaico de fotos, llamada a Groq, validación
│       └── health/                Estado del servicio
└── FRONTEND/
    ├── index.html, listing.html, detail.html, publish.html,
    │   edit.html, profile.html, login.html, register.html
    ├── env-config.js              URL de la API (se genera en el deploy)
    ├── generate-config.mjs        Genera env-config.js desde API_URL
    ├── css/styles.css             Sistema visual (tokens, botones, tarjetas)
    ├── data/                      Marcas/modelos y provincias argentinas
    ├── vendor/bootstrap/          Bootstrap 5.3.3
    └── js/
        ├── core/                  api, sesión, utilidades DOM, catálogos
        ├── components/            encabezado, pie, tarjeta, comparador,
        │                          panel de tasación, selector, campo de fotos
        └── pages/                 un archivo por página
```

**Convención de nombres:** todo el código está en inglés (carpetas, archivos, clases, funciones, variables, DTOs y rutas de la API). Lo que ve el usuario sigue en español: textos, mensajes de error y validación. Los comentarios están en español para explicar el porqué. La base de datos conserva sus nombres en español (`usuarios`, `autos`, `imagenes_auto`, `consultas`, columnas en `snake_case`); cada entidad mapea sus propiedades en inglés a esas columnas con `@Column({ name: '...' })`.

---

## 4. Modelo de datos

Todas las tablas tienen Row Level Security activado y sin políticas: la clave pública de Supabase no puede leer ni escribir nada. Solo el backend accede, con el usuario dueño de la base.

### Tabla `usuarios`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nombre | varchar(80) | |
| email | varchar(120) | único, en minúsculas |
| telefono | varchar(30) | opcional, nunca se expone en publicaciones |
| password | varchar | hash bcrypt, no se lee salvo al iniciar sesión |
| email_verificado | boolean | |
| creado_en, actualizado_en | timestamptz | |

### Tabla `autos`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| vendedor_id | uuid | FK → usuarios, borrado en cascada |
| marca, modelo, color | varchar | color opcional |
| anio, kilometraje | integer | índice en kilometraje |
| transmision | enum | Manual, Automatico |
| combustible | enum | Nafta, Diesel, Hibrido, Electrico |
| precio | numeric(10,2) | USD |
| ubicacion | varchar(100) | provincia |
| descripcion, detalles_danios | text | daños declarados opcional |
| ia_estado | varchar(40) | Excelente, Buen estado, Regular, Requiere reparacion |
| ia_puntaje | double | 1 a 10 |
| ia_danios, ia_resumen | text | |
| ia_precio_min, ia_precio_max | numeric(10,2) | rango de mercado en USD |
| creado_en, actualizado_en | timestamptz | índice en creado_en |

### Tabla `imagenes_auto`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| auto_id | uuid | FK → autos, cascada |
| ruta_archivo | text | `{autoId}/{uuid}.jpg` dentro del bucket |
| url_publica | text | |
| orden | integer | 0 es la portada |
| creado_en | timestamptz | |

### Tabla `consultas`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| auto_id | uuid | FK → autos, cascada |
| comprador_id | uuid | FK → usuarios, cascada |
| vendedor_id | uuid | FK → usuarios, cascada |
| pregunta | text | |
| respuesta | text | null hasta que responde el vendedor |
| creado_en | timestamptz | |

Restricción única `(auto_id, comprador_id)`: una consulta por comprador y por auto.

---

## 5. Páginas del Frontend

| Página | Acceso | Contenido |
|---|---|---|
| `index.html` | Público | Portada: último auto publicado con su tasación, cómo tasa la IA, autos recientes con búsqueda rápida, preguntas frecuentes |
| `listing.html` | Público | Filtros (marca o modelo, marca, modelo, precio con deslizador, año, kilometraje, provincia, combustible, transmisión), orden, paginación; los filtros quedan en la URL |
| `detail.html` | Público | Galería, características, tasación por IA, descripción, preguntas y respuestas públicas |
| `publish.html` | Cuenta, modo vendedor | Formulario con 3 a 10 fotos; la IA tasa al enviar |
| `edit.html` | Dueño del auto | Precio, kilometraje, descripción, daños y fotos; la IA vuelve a tasar |
| `profile.html` | Cuenta | Vendedor: publicaciones, consultas recibidas (se actualizan cada minuto), datos. Comprador: favoritos, datos |
| `login.html`, `register.html` | Público | Ingreso y alta de cuenta con validación en el navegador |

El **comparador** es un panel lateral (offcanvas de Bootstrap) disponible en todas las páginas para usuarios con cuenta. Compara dos autos por precio, año, kilometraje, combustible, transmisión, ubicación, daños declarados y el resultado de la IA.

**Diseño:** rediseño completo siguiendo los criterios de [taste-skill](https://www.tasteskill.dev/), aplicados con CSS propio sobre Bootstrap: modo oscuro con el rojo de la marca como único acento, una escala de espacios (4 a 128 px), un solo estilo de botón y de tarjeta, encabezado fijo opaco, una sección por pantalla en la portada, entrada del héroe una sola vez al cargar y microanimaciones al pasar el mouse. Se respetan `prefers-reduced-motion`, el foco visible y la navegación por teclado.

---

## 6. Endpoints de la API

Todas las rutas empiezan con `/api`. 🔒 = requiere `Authorization: Bearer <token>`.

### Autenticación — público

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crea la cuenta; devuelve `{ user, token }` |
| POST | `/auth/login` | Devuelve `{ user, token }` |

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET 🔒 | `/users/me` | Perfil propio |
| PATCH 🔒 | `/users/me` | Cambia nombre y teléfono |

### Autos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/cars` | Listado. Filtros: `search`, `brand`, `model`, `location`, `minPrice/maxPrice`, `minYear/maxYear`, `minKm/maxKm`, `fuel`, `transmission`; `sort` (`newest`, `price_asc`, `price_desc`, `mileage_asc`); `page`, `limit` (máx. 50). Devuelve `{ data, total, page, limit, pages }` |
| GET 🔒 | `/cars/mine` | Publicaciones propias |
| GET | `/cars/:id` | Detalle; del vendedor solo `{ id, name }` |
| POST 🔒 | `/cars` | Publica: `multipart/form-data` con los datos y 3 a 10 fotos en `images` |
| PATCH 🔒 | `/cars/:id` | Edita precio, kilometraje, descripción o daños; fotos nuevas opcionales (3 a 10, reemplazan a las anteriores). Vuelve a tasar |
| DELETE 🔒 | `/cars/:id` | Borra la publicación, sus fotos y sus consultas |

### Consultas

| Método | Ruta | Descripción |
|---|---|---|
| POST 🔒 | `/inquiries` | Pregunta sobre un auto (no el propio, una por auto) |
| GET | `/inquiries/car/:carId` | Preguntas y respuestas del auto; del comprador solo el nombre |
| GET 🔒 | `/inquiries/received` | Consultas sobre mis publicaciones |
| PATCH 🔒 | `/inquiries/:id/answer` | El vendedor responde |

### Salud

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | `{ status, database }`, usado por Render |

**Códigos de error:** 400 datos inválidos, 401 sin sesión o credenciales incorrectas, 403 sin permiso sobre el recurso, 404 no existe, 409 email ya registrado o consulta repetida, 429 demasiados pedidos, 503 IA no disponible.

---

## 7. Sistema de modos (Comprador / Vendedor)

Todos los usuarios tienen la misma cuenta. El **modo activo** decide qué se muestra:

| Funcionalidad | Sin cuenta | Modo Comprador | Modo Vendedor |
|---|---|---|---|
| Ver listado y detalle | ✅ | ✅ | ✅ |
| Enviar consulta | ❌ | ✅ (no en autos propios) | ❌ |
| Guardar favoritos | ❌ | ✅ (no en autos propios) | ❌ |
| Comparar autos | ❌ | ✅ | ✅ |
| Publicar auto | ❌ | ❌ (se ofrece pasar a vendedor) | ✅ |
| Editar / eliminar publicación propia | ❌ | ✅ | ✅ |
| Responder consultas | ❌ | ❌ | ✅ |

El modo, los favoritos y la lista del comparador se guardan en `localStorage`, separados por usuario. Al registrarse o ingresar, el modo inicial es **comprador**.

---

## 8. Integración con IA (Groq)

### Proveedor y modelo

- **Groq**, modelo `qwen/qwen3.8-27b` (multimodal), configurable con la variable `GROQ_MODEL`.
- Respuesta en formato JSON forzado (`response_format: json_object`), temperatura 0.1.

### Flujo al publicar

1. El backend valida cada foto leyendo su contenido con sharp (no confía en la extensión), la rota según EXIF, le quita los metadatos y la achica (1600 px para guardar, 768 px para la IA).
2. Arma un **mosaico** con hasta 9 fotos en una sola imagen. La cuenta gratuita de Groq admite unos 7.000 tokens por minuto y cobra un monto fijo por imagen: el mosaico permite que la IA vea todas las fotos dentro de ese límite.
3. Envía el mosaico y los datos del auto. El texto del vendedor va dentro de `<datos_vehiculo>` y el prompt aclara que es información a evaluar y nunca instrucciones (mitigación de inyección de prompt).
4. Valida la respuesta: estado entre los cuatro posibles, puntaje entre 1 y 10, precios enteros positivos con mínimo ≤ máximo, textos con largo máximo. Si algo no cumple, responde 503.
5. Solo si la tasación es válida sube las fotos al bucket y guarda auto e imágenes en una transacción. Si falla la subida o la base, borra las fotos ya subidas.

Al **editar**, si no hay fotos nuevas, el backend descarga las guardadas y arma el mosaico con ellas.

### Criterios de clasificación

| Estado | Criterio | Ajuste de precio |
|---|---|---|
| Excelente | Sin daños, menos de 50.000 km, impecable | Sin descuento |
| Buen estado | Sin daños visibles o mínimos, hasta ~100.000 km | −3 % a −5 % |
| Regular | Daños leves visibles y/o más de 100.000 km | −10 % a −20 % |
| Requiere reparación | Daños graves | −25 % a −50 % |

Reglas: cualquier daño visible impide "Excelente"; más de 100.000 km impide "Excelente" y "Buen estado".

### Precio de referencia (mercado argentino, USD)

| Segmento | Rango |
|---|---|
| Compactos 2020+ (Argo, Polo, 208) | 14.000 – 22.000 |
| Sedanes medianos 2018+ (Corolla, Vento) | 18.000 – 28.000 |
| SUV compactas 2019+ (Renegade, Duster, T-Cross) | 20.000 – 32.000 |
| SUV medianas 2018+ (RAV4, Tiguan, Compass) | 30.000 – 50.000 |
| SUV premium 2016+ (X3/X5, GLC, Q5) | 40.000 – 80.000 |
| Pickups 2018+ (Ranger, Hilux) | 30.000 – 55.000 |
| Lujo 2016+ (Serie 3/5, Clase C/E) | 35.000 – 70.000 |
| Económicos 2015–2018 (Gol, Classic) | 8.000 – 14.000 |

Ajuste por kilometraje: menos de 30.000 km +8 %; 30.001–60.000 sin ajuste; 60.001–100.000 −8 %; 100.001–150.000 −18 %; más de 150.000 −30 %.

---

## 9. Seguridad

**Backend**
- Contraseñas con bcrypt (12 rondas); el inicio de sesión compara contra un hash ficticio si el email no existe, para no revelar qué cuentas existen.
- JWT HS256 con expiración de 7 días. La API no arranca si la clave tiene menos de 32 caracteres o falta alguna variable obligatoria.
- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`: DTOs tipados en todas las rutas.
- Límite de pedidos por IP: 100 por minuto en general, 5 por minuto en autenticación y 10 por hora para publicar o editar.
- `helmet` y CORS restringido a los orígenes de `CORS_URL`.
- Permisos verificados en el servidor: solo el dueño edita, elimina o responde.
- Las respuestas no exponen email ni teléfono de otros usuarios.
- Consultas SQL con parámetros de TypeORM; en las búsquedas se escapan `%` y `_`.
- Fotos validadas por contenido, sin metadatos (EXIF/GPS), máximo 10 MB.
- RLS en todas las tablas; el bucket solo admite escritura con la clave secreta del servidor.

**Frontend**
- Todo texto que viene de la API o del usuario se escapa antes de insertarse como HTML (plantilla `html` en `js/core/dom.js`).
- Content-Security-Policy en cada página: scripts y estilos solo del propio sitio (Bootstrap servido localmente), sin estilos ni scripts en línea.
- Cabeceras de seguridad en el hosting (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS).
- El parámetro `volver` del ingreso solo acepta páginas propias (evita redirecciones abiertas).
- Validación en el navegador con mensajes por campo, además de la validación del servidor.

---

## 10. Despliegue

**URLs en producción:**
- Frontend: https://autopulse-web-52h6.onrender.com
- Backend: https://autopulse-api-52h6.onrender.com/api (estado: `/api/health`)

El repositorio incluye `render.yaml` (Blueprint de Render) con dos servicios conectados a la rama `develop`:

- **autopulse-api** — servicio web (plan gratuito: se duerme tras 15 minutos sin uso y el primer pedido tarda ~50 s) Node 22 con `rootDir: BACKEND`, chequeo de salud en `/api/health`.
- **autopulse-web** — sitio estático con `rootDir: FRONTEND`; en el build, `generate-config.mjs` escribe la URL de la API.

**Servicios externos:**
- Base de datos: **Supabase** (PostgreSQL 17, región sa-east-1 — São Paulo).
- Storage de imágenes: **Supabase Storage** (bucket `imagenes-autos`).
- IA: **Groq** (cuenta gratuita, ~7.000 tokens de entrada por minuto).
