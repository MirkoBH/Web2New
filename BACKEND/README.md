# AutoPulse – Backend NestJS

API REST para la plataforma de compra y venta de autos usados con análisis de IA.

## 🚀 Levantar localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y completar variables de entorno
cp .env.example .env
# → Completar DATABASE_URL, JWT_SECRET_PASSWORD, GEMINI_API_KEY

# 3. Levantar en modo desarrollo
npm run start:dev

# 4. Probar endpoints
bash test-api.sh
```

## 📁 Estructura de módulos

```
src/
├── auth/          → Registro y login con JWT
├── users/         → Gestión de usuarios y perfiles
├── cars/          → CRUD de autos + subida de imágenes
├── ia/            → Integración Google Gemini
├── consultas/     → Preguntas comprador → vendedor
└── common/        → Guards, decoradores compartidos
```

## 🔌 Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Iniciar sesión |
| GET | `/api/cars` | No | Listar autos (filtros + paginación) |
| GET | `/api/cars/:id` | No | Detalle de un auto |
| POST | `/api/cars` | Vendedor | Crear publicación |
| PATCH | `/api/cars/:id` | Vendedor | Editar publicación |
| DELETE | `/api/cars/:id` | Vendedor | Eliminar publicación |
| POST | `/api/cars/:id/upload-images` | Vendedor | Subir imágenes |
| POST | `/api/cars/:id/analizar-ia` | Vendedor | Análisis con IA |
| GET | `/api/users/me` | Autenticado | Perfil propio |
| POST | `/api/consultas` | Comprador | Enviar consulta |
| PATCH | `/api/consultas/:id/responder` | Vendedor | Responder consulta |

## 🗄️ Base de datos (Supabase)

- **Proyecto:** autopulse
- **Región:** sa-east-1 (São Paulo)
- **Tablas:** `usuarios`, `autos`, `consultas`
- TypeORM con `synchronize: true` en desarrollo

## 🚂 Despliegue en Railway

Variables de entorno necesarias en Railway:
- `DATABASE_URL` → Connection string de Supabase
- `JWT_SECRET_PASSWORD` → Clave JWT segura
- `GEMINI_API_KEY` → Clave de Google AI Studio
- `CORS_URL` → URL del frontend en producción
- `DB_SSL=true`
- `APP_URL` → URL del backend en Railway
