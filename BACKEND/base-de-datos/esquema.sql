-- =====================================================================
-- AutoPulse — esquema completo de la base de datos (PostgreSQL 15+)
-- Sirve para crear la base desde cero. La base de producción (Supabase)
-- ya existe y se llevó a este mismo estado con migraciones/004.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE autos_transmision_enum AS ENUM ('Manual', 'Automatico');
CREATE TYPE autos_combustible_enum AS ENUM ('Nafta', 'Diesel', 'Hibrido', 'Electrico');

CREATE TABLE usuarios (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           varchar(80)  NOT NULL,
  email            varchar(120) NOT NULL UNIQUE,
  telefono         varchar(30),
  password         varchar      NOT NULL,
  email_verificado boolean      NOT NULL DEFAULT false,
  creado_en        timestamptz  NOT NULL DEFAULT now(),
  actualizado_en   timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE autos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id     uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  marca           varchar(60)  NOT NULL,
  modelo          varchar(80)  NOT NULL,
  color           varchar(40),
  anio            integer      NOT NULL,
  kilometraje     integer      NOT NULL,
  transmision     autos_transmision_enum NOT NULL,
  combustible     autos_combustible_enum NOT NULL,
  precio          numeric(10,2) NOT NULL,
  ubicacion       varchar(100) NOT NULL,
  descripcion     text         NOT NULL,
  detalles_danios text,
  ia_estado       varchar(40)  NOT NULL,
  ia_puntaje      double precision NOT NULL,
  ia_danios       text         NOT NULL,
  ia_precio_min   numeric(10,2) NOT NULL,
  ia_precio_max   numeric(10,2) NOT NULL,
  ia_resumen      text         NOT NULL,
  creado_en       timestamptz  NOT NULL DEFAULT now(),
  actualizado_en  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_autos_vendedor    ON autos (vendedor_id);
CREATE INDEX idx_autos_kilometraje ON autos (kilometraje);
CREATE INDEX idx_autos_creado_en   ON autos (creado_en);

CREATE TABLE imagenes_auto (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_id      uuid    NOT NULL REFERENCES autos(id) ON DELETE CASCADE,
  ruta_archivo text    NOT NULL,
  url_publica  text    NOT NULL,
  orden        integer NOT NULL DEFAULT 0,
  creado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_imagenes_auto ON imagenes_auto (auto_id);

CREATE TABLE consultas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_id      uuid NOT NULL REFERENCES autos(id)    ON DELETE CASCADE,
  comprador_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  vendedor_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pregunta     text NOT NULL,
  respuesta    text,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_consultas_auto_comprador UNIQUE (auto_id, comprador_id)
);
CREATE INDEX idx_consultas_vendedor ON consultas (vendedor_id);

-- Row Level Security activado y SIN políticas: con la clave pública (anon)
-- de Supabase no se puede leer ni escribir ninguna tabla. Solo el backend,
-- que se conecta con el usuario dueño de la base, tiene acceso.
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE autos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas     ENABLE ROW LEVEL SECURITY;
