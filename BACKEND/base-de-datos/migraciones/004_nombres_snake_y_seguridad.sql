-- =====================================================================
-- Migración 004: convenciones de nombres y seguridad
-- - Columnas en snake_case y fechas con zona horaria (timestamptz).
-- - Se quitan columnas sin uso (activo, iaAprobado) y el enum de roles.
-- - consultas.vendedor_id pasa a uuid con clave foránea.
-- - Se activa RLS y se quitan los permisos de escritura anónima del bucket.
-- =====================================================================
BEGIN;

-- Publicaciones dadas de baja: ya no existe la baja lógica.
DELETE FROM autos WHERE activo = false;

-- Los triggers de "updatedAt" se reemplazan por @UpdateDateColumn de TypeORM.
DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
DROP TRIGGER IF EXISTS trg_autos_updated_at ON autos;
DROP FUNCTION IF EXISTS actualizar_updated_at();
DROP TYPE IF EXISTS usuarios_role_enum;

-- usuarios
ALTER TABLE usuarios RENAME COLUMN "emailVerificado" TO email_verificado;
ALTER TABLE usuarios RENAME COLUMN "createdAt" TO creado_en;
ALTER TABLE usuarios RENAME COLUMN "updatedAt" TO actualizado_en;
ALTER TABLE usuarios
  ALTER COLUMN creado_en      TYPE timestamptz USING creado_en AT TIME ZONE 'UTC',
  ALTER COLUMN actualizado_en TYPE timestamptz USING actualizado_en AT TIME ZONE 'UTC';

-- autos
ALTER TABLE autos RENAME COLUMN "detallesDanios"   TO detalles_danios;
ALTER TABLE autos RENAME COLUMN "iaEstado"         TO ia_estado;
ALTER TABLE autos RENAME COLUMN "iaPuntaje"        TO ia_puntaje;
ALTER TABLE autos RENAME COLUMN "iaDanios"         TO ia_danios;
ALTER TABLE autos RENAME COLUMN "iaRangoPrecioMin" TO ia_precio_min;
ALTER TABLE autos RENAME COLUMN "iaRangoPrecioMax" TO ia_precio_max;
ALTER TABLE autos RENAME COLUMN "iaResumen"        TO ia_resumen;
ALTER TABLE autos RENAME COLUMN "createdAt"        TO creado_en;
ALTER TABLE autos RENAME COLUMN "updatedAt"        TO actualizado_en;
ALTER TABLE autos DROP COLUMN "iaAprobado", DROP COLUMN activo;
ALTER TABLE autos
  ALTER COLUMN creado_en      TYPE timestamptz USING creado_en AT TIME ZONE 'UTC',
  ALTER COLUMN actualizado_en TYPE timestamptz USING actualizado_en AT TIME ZONE 'UTC';

-- Toda publicación pasa por la IA, así que el análisis es obligatorio.
UPDATE autos SET
  ia_estado     = COALESCE(ia_estado, 'Regular'),
  ia_puntaje    = COALESCE(ia_puntaje, 6),
  ia_danios     = COALESCE(ia_danios, 'Sin daños detectados'),
  ia_precio_min = COALESCE(ia_precio_min, round(precio * 0.9)),
  ia_precio_max = COALESCE(ia_precio_max, round(precio * 1.1)),
  ia_resumen    = COALESCE(ia_resumen, 'Tasación no disponible.');
ALTER TABLE autos
  ALTER COLUMN ia_estado     SET NOT NULL,
  ALTER COLUMN ia_puntaje    SET NOT NULL,
  ALTER COLUMN ia_danios     SET NOT NULL,
  ALTER COLUMN ia_precio_min SET NOT NULL,
  ALTER COLUMN ia_precio_max SET NOT NULL,
  ALTER COLUMN ia_resumen    SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_autos_vendedor    ON autos (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_autos_kilometraje ON autos (kilometraje);
CREATE INDEX IF NOT EXISTS idx_autos_creado_en   ON autos (creado_en);

-- imagenes_auto
ALTER TABLE imagenes_auto RENAME COLUMN storage_path TO ruta_archivo;
ALTER TABLE imagenes_auto RENAME COLUMN "createdAt" TO creado_en;
ALTER TABLE imagenes_auto DROP COLUMN IF EXISTS nombre;
ALTER TABLE imagenes_auto
  ALTER COLUMN creado_en TYPE timestamptz USING creado_en AT TIME ZONE 'UTC';
CREATE INDEX IF NOT EXISTS idx_imagenes_auto ON imagenes_auto (auto_id);

-- consultas
ALTER TABLE consultas RENAME COLUMN "createdAt" TO creado_en;
ALTER TABLE consultas
  ALTER COLUMN creado_en   TYPE timestamptz USING creado_en AT TIME ZONE 'UTC',
  ALTER COLUMN vendedor_id TYPE uuid USING vendedor_id::uuid;
ALTER TABLE consultas
  ADD CONSTRAINT fk_consultas_vendedor
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  ADD CONSTRAINT uq_consultas_auto_comprador UNIQUE (auto_id, comprador_id);
CREATE INDEX IF NOT EXISTS idx_consultas_vendedor ON consultas (vendedor_id);

-- Seguridad: sin políticas, la clave anon no accede a ninguna tabla.
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE autos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas     ENABLE ROW LEVEL SECURITY;

-- El bucket queda de lectura pública; subir y borrar solo con la clave secreta.
DROP POLICY IF EXISTS "Backend puede subir imágenes"    ON storage.objects;
DROP POLICY IF EXISTS "Backend puede eliminar imágenes" ON storage.objects;

COMMIT;
