# AutoPulse — API (NestJS)

API REST de AutoPulse: publicación de autos usados con tasación automática por IA (Groq), consultas entre compradores y vendedores, y autenticación con JWT.

## Estructura

```
src/
├── main.ts                  Arranque: helmet, CORS, validación global, prefijo /api
├── app.module.ts            Base de datos, límite de pedidos y módulos
├── config/                  Validación de variables de entorno
├── common/                  Guardia JWT, decorador @CurrentUser, tipos, transformaciones y validadores
├── auth/                    Registro e inicio de sesión (JWT)
├── users/                   Perfil del usuario autenticado
├── cars/                    Publicaciones, filtros, fotos (sharp + Supabase Storage)
├── inquiries/               Preguntas públicas y respuestas del vendedor
├── ai/                      Tasación con Groq: prompt, mosaico, llamada y validación de la respuesta
└── health/                  Endpoint de estado para el hosting
database/
├── schema.sql               Esquema completo para crear la base desde cero
└── migrations/              Cambios aplicados sobre la base existente
```

**Convención de nombres:** todo el código está en inglés (carpetas, archivos, clases, funciones, variables, DTOs y rutas de la API). Lo que ve el usuario sigue en español: textos, mensajes de error y validación. Los comentarios están en español para explicar el porqué. La base de datos conserva sus nombres en español (`usuarios`, `autos`, `imagenes_auto`, `consultas`, columnas en `snake_case`); cada entidad mapea sus propiedades en inglés a esas columnas con `@Column({ name: '...' })`.

## Endpoints

Todas las rutas empiezan con `/api`. 🔒 = requiere `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Crea la cuenta y devuelve `{ user, token }` |
| POST | `/auth/login` | Devuelve `{ user, token }` |
| GET 🔒 | `/users/me` | Perfil propio |
| PATCH 🔒 | `/users/me` | Cambia nombre y teléfono |
| GET | `/cars` | Listado con filtros: `search` (marca o modelo), `brand`, `model`, `location`, `minPrice/maxPrice`, `minYear/maxYear`, `minKm/maxKm`, `fuel`, `transmission`, `sort` (`newest`, `price_asc`, `price_desc`, `mileage_asc`), `page`, `limit` (máx. 50) |
| GET 🔒 | `/cars/mine` | Publicaciones propias |
| GET | `/cars/:id` | Detalle (del vendedor solo se expone el nombre) |
| POST 🔒 | `/cars` | Publica. `multipart/form-data` con los datos y de 3 a 10 fotos en `images` |
| PATCH 🔒 | `/cars/:id` | Edita precio, kilometraje, descripción o daños, y opcionalmente reemplaza las fotos (de 3 a 10). Vuelve a tasar |
| DELETE 🔒 | `/cars/:id` | Borra la publicación, sus fotos y sus consultas |
| POST 🔒 | `/inquiries` | Pregunta sobre un auto (no el propio, una por auto) |
| GET | `/inquiries/car/:carId` | Preguntas y respuestas públicas del auto |
| GET 🔒 | `/inquiries/received` | Consultas sobre mis publicaciones |
| PATCH 🔒 | `/inquiries/:id/answer` | El vendedor responde |
| GET | `/health` | Estado del servicio y de la base |

Si la IA no responde o devuelve algo inválido, publicar y editar responden **503** y no se guarda ningún cambio.

## Seguridad

- Contraseñas con bcrypt (12 rondas); el login tarda lo mismo exista o no el email.
- Variables de entorno validadas al arrancar; sin clave JWT de 32+ caracteres la API no levanta.
- `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`: se rechazan campos que no estén en el DTO.
- Límite de pedidos: 100/min general, 5/min en autenticación, 10/hora para publicar o editar (cada uno llama a la IA).
- `helmet` para cabeceras HTTP y CORS restringido a los orígenes de `CORS_URL`.
- Las fotos se validan leyendo su contenido con sharp, se les quitan los metadatos (EXIF/GPS) y se achican.
- Row Level Security activo en todas las tablas y el bucket solo acepta escrituras con la clave secreta del servidor.
- El texto del vendedor se le pasa a la IA delimitado como dato, y la respuesta se valida antes de guardarla.

## Desarrollo local

```bash
npm install
cp .env.example .env      # completar las variables
npm run start:dev
npm run lint              # ESLint + Prettier
```
