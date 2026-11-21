# AutoPulse — API (NestJS)

API REST de AutoPulse: publicación de autos usados con tasación automática por IA (Groq), consultas entre compradores y vendedores, y autenticación con JWT.

## Estructura

```
src/
├── main.ts                  Arranque: helmet, CORS, validación global, prefijo /api
├── app.module.ts            Base de datos, límite de pedidos y módulos
├── configuracion/           Validación de variables de entorno
├── comun/                   Guardia JWT, decorador @UsuarioActual, tipos y utilidades
├── autenticacion/           Registro e inicio de sesión
├── usuarios/                Perfil del usuario autenticado
├── autos/                   Publicaciones, filtros, fotos (sharp + Supabase Storage)
├── consultas/               Preguntas públicas y respuestas del vendedor
├── ia/                      Tasación con Groq: prompt, llamada y validación de la respuesta
└── salud/                   Endpoint de estado para el hosting
base-de-datos/
├── esquema.sql              Esquema completo para crear la base desde cero
└── migraciones/             Cambios aplicados sobre la base existente
```

**Convención de nombres:** todo el dominio está en español (módulos, clases, métodos, rutas, columnas). Se mantienen en inglés solo los sufijos técnicos que impone NestJS (`Module`, `Controller`, `Service`, `Dto`, `Guard`, `.entity`) y las palabras clave del framework. Las columnas de la base usan `snake_case` y las propiedades `camelCase`; la traducción la hace `EstrategiaNombresSnake`.

## Endpoints

Todas las rutas empiezan con `/api`. 🔒 = requiere `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/autenticacion/registro` | Crea la cuenta y devuelve `{ usuario, token }` |
| POST | `/autenticacion/inicio-sesion` | Devuelve `{ usuario, token }` |
| GET 🔒 | `/usuarios/yo` | Perfil propio |
| PATCH 🔒 | `/usuarios/yo` | Cambia nombre y teléfono |
| GET | `/autos` | Listado con filtros: `texto` (marca o modelo), `marca`, `modelo`, `ubicacion`, `precioMin/Max`, `anioMin/Max`, `kmMin/Max`, `combustible`, `transmision`, `orden` (`reciente`, `precio_asc`, `precio_desc`, `km_asc`), `pagina`, `limite` (máx. 50) |
| GET 🔒 | `/autos/mios` | Publicaciones propias |
| GET | `/autos/:id` | Detalle (del vendedor solo se expone el nombre) |
| POST 🔒 | `/autos` | Publica. `multipart/form-data` con los datos y de 3 a 10 fotos en `imagenes` |
| PATCH 🔒 | `/autos/:id` | Edita precio, kilometraje, descripción o daños, y opcionalmente reemplaza las fotos (de 3 a 10). Vuelve a tasar |
| DELETE 🔒 | `/autos/:id` | Borra la publicación, sus fotos y sus consultas |
| POST 🔒 | `/consultas` | Pregunta sobre un auto (no el propio, una por auto) |
| GET | `/consultas/auto/:autoId` | Preguntas y respuestas públicas del auto |
| GET 🔒 | `/consultas/recibidas` | Consultas sobre mis publicaciones |
| PATCH 🔒 | `/consultas/:id/respuesta` | El vendedor responde |
| GET | `/salud` | Estado del servicio y de la base |

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
