-- ============================================================
-- Simpat Tech Inventario — Schema
-- ============================================================

-- Collaborators
CREATE TABLE collaborators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  area        TEXT NOT NULL,
  puesto      TEXT NOT NULL,
  email       TEXT NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT true,
  fecha_ingreso DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equipment (Computadoras)
CREATE TABLE equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca           TEXT NOT NULL,
  modelo          TEXT NOT NULL,
  anio_compra     INT NOT NULL,
  costo_mxn       NUMERIC(12,2) NOT NULL,
  costo_usd       NUMERIC(12,2) NOT NULL,
  especificaciones JSONB NOT NULL DEFAULT '{}',
  estatus         TEXT NOT NULL DEFAULT 'En Bodega',
  colaborador_id  UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  fecha_compra    DATE NOT NULL,
  admin_user      TEXT,
  admin_password  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Peripherals
CREATE TABLE peripherals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           TEXT NOT NULL,
  marca          TEXT NOT NULL,
  modelo         TEXT NOT NULL,
  costo_mxn      NUMERIC(12,2) NOT NULL,
  costo_usd      NUMERIC(12,2) NOT NULL,
  fecha_compra   DATE NOT NULL,
  estatus        TEXT NOT NULL DEFAULT 'En Bodega',
  colaborador_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Licenses
CREATE TABLE licenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_producto  TEXT NOT NULL,
  tipo             TEXT NOT NULL,
  costo_mxn        NUMERIC(12,2) NOT NULL,
  costo_usd        NUMERIC(12,2) NOT NULL,
  fecha_renovacion DATE NOT NULL,
  colaborador_id   UUID NOT NULL REFERENCES collaborators(id) ON DELETE RESTRICT,
  categoria        TEXT NOT NULL DEFAULT 'General',
  activa           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IY Budget (one per collaborator)
CREATE TABLE iy_budgets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL UNIQUE REFERENCES collaborators(id) ON DELETE CASCADE,
  monto_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Office Items
CREATE TABLE office_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  categoria    TEXT NOT NULL,
  marca        TEXT NOT NULL,
  costo_mxn    NUMERIC(12,2) NOT NULL,
  costo_usd    NUMERIC(12,2) NOT NULL,
  fecha_compra DATE NOT NULL,
  cantidad     INT NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- History Events
CREATE TABLE history_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo          TEXT NOT NULL,
  entidad_id            UUID NOT NULL,
  tipo_evento           TEXT NOT NULL,
  descripcion           TEXT NOT NULL DEFAULT '',
  fecha_inicio          TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin             TIMESTAMPTZ,
  tecnico_nombre        TEXT,
  tecnico_telefono      TEXT,
  costo_mxn             NUMERIC(12,2),
  costo_usd             NUMERIC(12,2),
  colaborador_anterior_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  colaborador_nuevo_id    UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  registrado_por        TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exchange Rates (cache de Banxico)
CREATE TABLE exchange_rates (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha   DATE NOT NULL UNIQUE,
  valor   NUMERIC(10,4) NOT NULL,
  fuente  TEXT NOT NULL DEFAULT 'Banxico'
);

-- Notification Config
CREATE TABLE notification_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dias_anticipacion INT NOT NULL DEFAULT 7,
  admin_id          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default notification config
INSERT INTO notification_configs (dias_anticipacion) VALUES (7);

-- Admins (tracks users with admin role, synced at invite time)
CREATE TABLE admins (
  id         UUID PRIMARY KEY,
  email      TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
