-- ============================================================================
-- RAÍZ DEL RÍO — MIGRACIÓN POSTGRESQL (SUPABASE: schema public)
-- Compatible con las 6 tablas existentes creadas en Supabase:
-- species, environmental_rules, lots, media_assets, profiles, fisher_details
-- ============================================================================

BEGIN;

-- 1. Tablas existentes en Supabase (IF NOT EXISTS protege los datos ya creados)
CREATE TABLE IF NOT EXISTS public.species (
  id text PRIMARY KEY,
  name text NOT NULL,
  scientific_name text NOT NULL,
  description text NOT NULL,
  illustration_color text NOT NULL,
  suggested_price_cop numeric NOT NULL,
  suggested_length_cm int4 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.environmental_rules (
  species_id text PRIMARY KEY REFERENCES public.species(id) ON DELETE RESTRICT,
  banned bool NOT NULL DEFAULT false,
  minimum_length_cm int4 NOT NULL,
  simulated_length_cm int4,
  version int4 NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY,
  role text NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  first_login_required bool NOT NULL DEFAULT false,
  provisioning_pending bool NOT NULL DEFAULT false,
  text_size text NOT NULL DEFAULT 'normal',
  read_instructions bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  purpose text NOT NULL,
  bucket_id text NOT NULL,
  object_path text NOT NULL,
  mime_type text NOT NULL,
  byte_size int4 NOT NULL,
  width int4,
  height int4,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fisher_details (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  nickname text,
  document text,
  port text NOT NULL,
  member_code text NOT NULL UNIQUE,
  photo_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id text NOT NULL REFERENCES public.species(id) ON DELETE RESTRICT,
  fisher_id uuid NOT NULL REFERENCES public.fisher_details(user_id) ON DELETE RESTRICT,
  price_per_kg_cop numeric NOT NULL,
  stock_units int4 NOT NULL CHECK (stock_units >= 0 AND stock_units <= 500),
  piece_weight_grams int4 CHECK (piece_weight_grams IS NULL OR (piece_weight_grams >= 1 AND piece_weight_grams <= 50000)),
  same_weight_confirmed bool,
  length_cm int4 NOT NULL CHECK (length_cm >= 1 AND length_cm <= 250),
  zone text NOT NULL,
  method text NOT NULL,
  captured_at timestamptz NOT NULL,
  landed_at timestamptz NOT NULL,
  temperature_c numeric,
  photo_id text,
  paused bool NOT NULL DEFAULT false,
  withdrawn_at timestamptz,
  version int4 NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fisher_details DROP CONSTRAINT IF EXISTS fisher_details_photo_id_fkey;
ALTER TABLE public.fisher_details ALTER COLUMN photo_id TYPE text USING photo_id::text;
ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_photo_id_fkey;
ALTER TABLE public.lots ALTER COLUMN photo_id TYPE text USING photo_id::text;

-- ============================================================================
-- NUEVAS TABLAS PARA COMPLETAR EL BACKEND
-- ============================================================================

-- 1b. Credenciales de autenticación por correo y contraseña (scrypt)
CREATE TABLE IF NOT EXISTS public.auth_credentials (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Auditoría ambiental (AdminDashboard)
CREATE TABLE IF NOT EXISTS public.environmental_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id text REFERENCES public.species(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT 'Administración ambiental',
  description text NOT NULL,
  previous_state jsonb,
  next_state jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_environmental_audit_occurred_at
  ON public.environmental_audit (occurred_at DESC);

-- 3. Canastas por comprador
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  version int4 NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Líneas de canasta
CREATE TABLE IF NOT EXISTS public.cart_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  quantity int4 NOT NULL CHECK (quantity > 0 AND quantity <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_lines_cart_lot UNIQUE (cart_id, lot_id)
);

-- 5. Fusión idempotente de canasta invitada
CREATE TABLE IF NOT EXISTS public.cart_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  merge_id uuid NOT NULL,
  request_hash text NOT NULL,
  response_status int4 NOT NULL,
  response_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_merges_owner_merge UNIQUE (owner_id, merge_id)
);

-- 6. Intentos de Checkout y Transacciones simuladas
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  request_key text NOT NULL,
  request_hash text NOT NULL,
  confirmation_hash text,
  confirmation_status int4,
  confirmation_response jsonb,
  cart_version int4 NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('PSE', 'Nequi', 'Daviplata', 'Tarjeta')),
  bank text NOT NULL DEFAULT '',
  customer_type text NOT NULL DEFAULT 'natural',
  amount_cop int8 NOT NULL CHECK (amount_cop >= 0),
  quote_snapshot jsonb NOT NULL,
  delivery_snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'exitoso', 'rechazado', 'vencido', 'stale')),
  result_code text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_checkout_attempts_client_key UNIQUE (client_id, request_key)
);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_client_created
  ON public.checkout_attempts (client_id, created_at DESC);

-- 7. Pedidos confirmados
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.checkout_attempts(id) ON DELETE RESTRICT,
  total_cop int8 NOT NULL CHECK (total_cop >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('PSE', 'Nequi', 'Daviplata', 'Tarjeta')),
  bank text NOT NULL DEFAULT '',
  customer_type text NOT NULL DEFAULT 'natural',
  delivery_name text NOT NULL,
  delivery_phone text NOT NULL,
  delivery_address text NOT NULL,
  delivery_slot text NOT NULL,
  delivery_date text NOT NULL,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_client_created
  ON public.orders (client_id, created_at DESC);

-- 8. Líneas del Pedido con Instantáneas (Snapshots) históricas inmutables
CREATE TABLE IF NOT EXISTS public.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE RESTRICT,
  species_id text NOT NULL REFERENCES public.species(id) ON DELETE RESTRICT,
  fisher_id uuid NOT NULL REFERENCES public.fisher_details(user_id) ON DELETE RESTRICT,
  species_name_snapshot text NOT NULL,
  scientific_name_snapshot text NOT NULL,
  fisher_name_snapshot text NOT NULL,
  fisher_member_snapshot text NOT NULL,
  zone_snapshot text NOT NULL,
  method_snapshot text NOT NULL,
  price_per_kg_cop_snapshot numeric NOT NULL,
  piece_weight_grams_snapshot int4,
  quantity int4 NOT NULL CHECK (quantity > 0),
  weight_kg_snapshot numeric NOT NULL,
  line_total_cop int8 NOT NULL CHECK (line_total_cop >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON public.order_lines (order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_fisher_id ON public.order_lines (fisher_id);

-- 9. Estado de entrega por pescador en cada pedido (Fulfillment)
CREATE TABLE IF NOT EXISTS public.order_fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  fisher_id uuid NOT NULL REFERENCES public.fisher_details(user_id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'preparado', 'enviado')),
  version int4 NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_order_fulfillments_order_fisher UNIQUE (order_id, fisher_id)
);

CREATE INDEX IF NOT EXISTS idx_order_fulfillments_fisher_status
  ON public.order_fulfillments (fisher_id, status);

-- 10. Semillas idempotentes de especies y reglas ambientales iniciales
-- Se ejecutan dentro de un bloque DO seguro para respetar cualquier CHECK personalizado existente en Supabase
DO $$
BEGIN
  INSERT INTO public.species (id, name, scientific_name, description, illustration_color, suggested_price_cop, suggested_length_cm)
  VALUES
    ('bocachico', 'Bocachico', 'Prochilodus magdalenae', 'El sabor de nuestra tierra. Ideal para un buen sancocho ribereño.', '#9baf9b', 18000, 25),
    ('rayado', 'Bagre rayado', 'Pseudoplatystoma magdaleniatum', 'Carne suave y llena de tradición, para compartir en familia.', '#b5a98a', 28000, 80),
    ('pintado', 'Bagre pintado', 'Pseudoplatystoma sp.', 'Lote de demostración retenido por talla. Identificación taxonómica pendiente.', '#a4a89a', 26000, 80),
    ('nicuro', 'Nicuro', 'Pimelodus blochii', 'Pequeño en tamaño, grande en sabor. Perfecto para una viuda de pescado.', '#c5ac7d', 16000, 18),
    ('dorada', 'Dorada del río Magdalena', 'Brycon moorei', 'Nuestra selección especial. Deliciosa a la plancha con limón.', '#c9b66f', 32000, 35),
    ('blanquillo', 'Blanquillo', 'Sorubim cuspicaudus', 'Un clásico del Magdalena, fresco y listo para tu receta favorita.', '#9caaa9', 24000, 45)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  INSERT INTO public.environmental_rules (species_id, banned, minimum_length_cm, simulated_length_cm, version)
  VALUES
    ('bocachico', false, 25, NULL, 1),
    ('rayado', true, 80, NULL, 1),
    ('pintado', false, 80, NULL, 1),
    ('nicuro', false, 18, NULL, 1),
    ('dorada', false, 35, NULL, 1),
    ('blanquillo', false, 45, NULL, 1)
  ON CONFLICT (species_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 11. Semillas idempotentes de cuentas iniciales (Admin, Cliente Demo, 6 Pescadores FEDEPESAN y 6 Lotes iniciales)
DO $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name, phone, address, text_size, read_instructions)
  VALUES
    ('00000000-0000-4000-8000-000000000001', 'admin', 'Administración ambiental', NULL, NULL, 'normal', false),
    ('00000000-0000-4000-8000-000000000002', 'client', 'Cliente de demostración', '3100000000', 'Barrancabermeja, Santander', 'normal', false),
    ('00000000-0000-4000-8000-000000000101', 'fisher', 'José Antonio Rueda', NULL, NULL, 'normal', false),
    ('00000000-0000-4000-8000-000000000102', 'fisher', 'María del Carmen Díaz', NULL, NULL, 'normal', false),
    ('00000000-0000-4000-8000-000000000103', 'fisher', 'Luis Eduardo Montes', NULL, NULL, 'normal', false),
    ('00000000-0000-4000-8000-000000000104', 'fisher', 'Rosa Elena Jiménez', NULL, NULL, 'normal', false),
    ('00000000-0000-4000-8000-000000000105', 'fisher', 'Carlos Alberto Moreno', NULL, NULL, 'normal', false),
    ('00000000-0000-4000-8000-000000000106', 'fisher', 'Pedro Enrique Salom', NULL, NULL, 'normal', false)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.auth_credentials (user_id, email, password_salt, password_hash)
  VALUES
    ('00000000-0000-4000-8000-000000000001', 'jairoleal@admin.com', 'a0000000000000000000000000000001', '88d1c04bcc192dc4bac8c887e6e9d11a01fce771750344d6579896824a73905da466579a56a4687bd9d9d0aa66bf22e89dd5bee41eb7781f96aa9ab0166d2bf0'),
    ('00000000-0000-4000-8000-000000000002', 'comprador@gmail.com', 'a0000000000000000000000000000002', '911a9bc4e8a931bde5f9fa2f2f91dea076b8aed8747f3a86160498836bbd15aea3f1d81e493283a8dc2ed914c028771edd9007c19dd3f51e3ef5b4dd67d3af4f'),
    ('00000000-0000-4000-8000-000000000101', 'don.jose.fedepesan@pescabarranca.co', 'a0000000000000000000000000000003', 'e4f31e0292c80e4f7470c996ef5460b576f292bb3bed4278756b2c83c969e0b7e65e125bc401908cb5ecd71b84e42a172f02395b77a0e541ce730288e62ab446'),
    ('00000000-0000-4000-8000-000000000102', 'dona.maria.fedepesan@pescabarranca.co', 'a0000000000000000000000000000003', 'e4f31e0292c80e4f7470c996ef5460b576f292bb3bed4278756b2c83c969e0b7e65e125bc401908cb5ecd71b84e42a172f02395b77a0e541ce730288e62ab446'),
    ('00000000-0000-4000-8000-000000000103', 'don.luis.fedepesan@pescabarranca.co', 'a0000000000000000000000000000003', 'e4f31e0292c80e4f7470c996ef5460b576f292bb3bed4278756b2c83c969e0b7e65e125bc401908cb5ecd71b84e42a172f02395b77a0e541ce730288e62ab446'),
    ('00000000-0000-4000-8000-000000000104', 'dona.rosa.fedepesan@pescabarranca.co', 'a0000000000000000000000000000003', 'e4f31e0292c80e4f7470c996ef5460b576f292bb3bed4278756b2c83c969e0b7e65e125bc401908cb5ecd71b84e42a172f02395b77a0e541ce730288e62ab446'),
    ('00000000-0000-4000-8000-000000000105', 'don.carlos.fedepesan@pescabarranca.co', 'a0000000000000000000000000000003', 'e4f31e0292c80e4f7470c996ef5460b576f292bb3bed4278756b2c83c969e0b7e65e125bc401908cb5ecd71b84e42a172f02395b77a0e541ce730288e62ab446'),
    ('00000000-0000-4000-8000-000000000106', 'don.pedro.fedepesan@pescabarranca.co', 'a0000000000000000000000000000003', 'e4f31e0292c80e4f7470c996ef5460b576f292bb3bed4278756b2c83c969e0b7e65e125bc401908cb5ecd71b84e42a172f02395b77a0e541ce730288e62ab446')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.fisher_details (user_id, nickname, document, port, member_code, photo_id)
  VALUES
    ('00000000-0000-4000-8000-000000000101', 'Don José', '91000018', 'Muelle de Barrancabermeja', 'FP-0018', NULL),
    ('00000000-0000-4000-8000-000000000102', 'Doña María', '91000042', 'Corregimiento El Llanito', 'FP-0042', NULL),
    ('00000000-0000-4000-8000-000000000103', 'Don Luis', '91000067', 'La Rampa', 'FP-0067', NULL),
    ('00000000-0000-4000-8000-000000000104', 'Doña Rosa', '91000091', 'Corregimiento El Llanito', 'FP-0091', NULL),
    ('00000000-0000-4000-8000-000000000105', 'Don Carlos', '91000113', 'Muelle de Barrancabermeja', 'FP-0113', NULL),
    ('00000000-0000-4000-8000-000000000106', 'Don Pedro', '91000156', 'Muelle de Barrancabermeja', 'FP-0156', NULL)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.lots (
    id, species_id, fisher_id, price_per_kg_cop, stock_units, piece_weight_grams, same_weight_confirmed,
    length_cm, zone, method, captured_at, landed_at, temperature_c, paused, version
  )
  VALUES
    ('00000000-0000-4000-8000-000000000201', 'bocachico', '00000000-0000-4000-8000-000000000101', 18000, 24, NULL, NULL, 28, 'Ciénaga San Silvestre', 'Atarraya tradicional', now() - interval '3 hours', now() - interval '1 hour', 3, false, 1),
    ('00000000-0000-4000-8000-000000000202', 'rayado', '00000000-0000-4000-8000-000000000102', 28000, 12, NULL, NULL, 85, 'Muelle de Barrancabermeja', 'Línea de mano / anzuelo', now() - interval '4 hours', now() - interval '2 hours', 2, false, 1),
    ('00000000-0000-4000-8000-000000000203', 'pintado', '00000000-0000-4000-8000-000000000103', 26000, 8, NULL, NULL, 75, 'Corregimiento El Llanito', 'Línea de mano / anzuelo', now() - interval '3 hours', now() - interval '1 hour', 3, false, 1),
    ('00000000-0000-4000-8000-000000000204', 'nicuro', '00000000-0000-4000-8000-000000000104', 16000, 4, NULL, NULL, 22, 'Corregimiento El Llanito', 'Línea de mano / anzuelo', now() - interval '2 hours', now() - interval '1 hour', 2, false, 1),
    ('00000000-0000-4000-8000-000000000205', 'dorada', '00000000-0000-4000-8000-000000000105', 32000, 10, NULL, NULL, 38, 'Muelle de Barrancabermeja', 'Línea de mano / anzuelo', now() - interval '3 hours', now() - interval '1 hour', 3, false, 1),
    ('00000000-0000-4000-8000-000000000206', 'blanquillo', '00000000-0000-4000-8000-000000000106', 24000, 16, NULL, NULL, 52, 'Ciénaga San Silvestre', 'Línea de mano / anzuelo', now() - interval '2 hours', now() - interval '1 hour', 2, false, 1)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMIT;
