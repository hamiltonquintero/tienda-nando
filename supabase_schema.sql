-- ============================================================
-- SURTIMUEVE MÁS — Schema Supabase
-- Ejecutar completo en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADMINS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  pin   TEXT NOT NULL,
  role  TEXT NOT NULL DEFAULT 'Administrador'
);

-- ────────────────────────────────────────────────────────────
-- 2. CUSTOMERS (Compañeros con posibilidad de fiao)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  area        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  total_debt  NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- 3. PRODUCTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  price      NUMERIC(12,2) NOT NULL,
  cost       NUMERIC(12,2) NOT NULL,
  category   TEXT NOT NULL,
  stock      INTEGER NOT NULL DEFAULT 0,
  min_stock  INTEGER NOT NULL DEFAULT 3,
  icon       TEXT NOT NULL DEFAULT '📦'
);

-- ────────────────────────────────────────────────────────────
-- 4. PERIODS (quincenas abiertas y cerradas en una sola tabla)
--    end_date IS NULL  → quincena actual abierta
--    end_date NOT NULL → quincena archivada
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS periods (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date        TIMESTAMPTZ,
  closed_by       TEXT,
  total_cash      NUMERIC(12,2),
  total_credit    NUMERIC(12,2),
  total_collected NUMERIC(12,2),
  sales_count     INTEGER
);

-- ────────────────────────────────────────────────────────────
-- 5. SALES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id             TEXT PRIMARY KEY,
  date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type           TEXT NOT NULL CHECK (type IN ('contado', 'fiado')),
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name  TEXT,
  total          NUMERIC(12,2) NOT NULL,
  admin_id       TEXT REFERENCES admins(id) ON DELETE SET NULL,
  admin_name     TEXT NOT NULL,
  period_id      TEXT NOT NULL REFERENCES periods(id),
  paid           BOOLEAN NOT NULL DEFAULT TRUE
);

-- ────────────────────────────────────────────────────────────
-- 6. SALE ITEMS (líneas de cada venta — antes era array JSON)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id          BIGSERIAL PRIMARY KEY,
  sale_id     TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  price       NUMERIC(12,2) NOT NULL,
  cost        NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity    INTEGER NOT NULL,
  total       NUMERIC(12,2) NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 7. PAYMENTS (abonos y pagos de fiados)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             TEXT PRIMARY KEY,
  date           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name  TEXT NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  notes          TEXT NOT NULL DEFAULT '',
  admin_id       TEXT REFERENCES admins(id) ON DELETE SET NULL,
  admin_name     TEXT NOT NULL,
  period_id      TEXT NOT NULL REFERENCES periods(id)
);

-- ────────────────────────────────────────────────────────────
-- 8. ORDERS (Pedidos pendientes desde el Catálogo Digital de Compañeros)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_area   TEXT NOT NULL DEFAULT '',
  customer_phone  TEXT NOT NULL DEFAULT '',
  payment_type    TEXT NOT NULL DEFAULT 'fiado', -- 'fiado' | 'contado'
  payment_method  TEXT NOT NULL DEFAULT 'credito', -- 'credito' | 'efectivo' | 'nequi' | 'daviplata'
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  total           NUMERIC(12,2) NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'approved' | 'rejected'
);

-- ────────────────────────────────────────────────────────────
-- 9. ÍNDICES para consultas frecuentes
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sales_period     ON sales(period_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer   ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale  ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_period  ON payments(period_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_periods_open     ON periods(end_date) WHERE end_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);

-- ────────────────────────────────────────────────────────────
-- 10. ROW LEVEL SECURITY (RLS)
--    La app usa la clave anon pública → necesitamos políticas
--    permisivas para todas las operaciones (la autenticación
--    real la maneja el PIN de admin dentro de la propia app).
-- ────────────────────────────────────────────────────────────
ALTER TABLE admins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso total para la clave anon (rol anon = visitante no autenticado)
CREATE POLICY "anon_all_admins"     ON admins     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_customers"  ON customers  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_products"   ON products   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_periods"    ON periods    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_sales"      ON sales      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_sale_items" ON sale_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_payments"   ON payments   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_orders"     ON orders     FOR ALL TO anon USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- 10. SEED DATA — Datos iniciales
-- ────────────────────────────────────────────────────────────

-- Admins
INSERT INTO admins (id, name, pin, role) VALUES
  ('admin-1', 'Administrador 1 (Nando)', '1234', 'Administrador Principal'),
  ('admin-2', 'Administrador 2 (Socio)', '5678', 'Administrador')
ON CONFLICT (id) DO NOTHING;

-- Quincena inicial
INSERT INTO periods (id, name, start_date) VALUES
  ('period-initial', 
   CASE 
     WHEN EXTRACT(DAY FROM NOW()) <= 15 
     THEN '1ra Quincena de ' || TO_CHAR(NOW(), 'TMMonth YYYY')
     ELSE '2da Quincena de ' || TO_CHAR(NOW(), 'TMMonth YYYY')
   END,
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Productos (35 del cuaderno)
INSERT INTO products (id, name, price, cost, category, stock, min_stock, icon) VALUES
  ('prod-1',  'Tosh',                         1400, 1000, 'Galletas',              12, 3, '🍪'),
  ('prod-2',  'Trident',                       400,  250, 'Dulces & Gomas',        20, 5, '🍬'),
  ('prod-3',  'Halls',                         250,  150, 'Dulces & Gomas',        25, 5, '🍬'),
  ('prod-4',  'Chocolatina Maní',             2000, 1500, 'Chocolates',            15, 4, '🍫'),
  ('prod-5',  'Coca Cola',                    2500, 1900, 'Bebidas',               10, 3, '🥤'),
  ('prod-6',  'Chocolores',                   1900, 1400, 'Chocolates',            12, 3, '🍫'),
  ('prod-7',  'Quipitos',                      800,  500, 'Dulces & Gomas',        18, 4, '✨'),
  ('prod-8',  'Dux',                          1200,  850, 'Galletas',              14, 3, '🍪'),
  ('prod-9',  'Tostacos',                     2400, 1800, 'Snacks & Paquetes',     10, 3, '🌽'),
  ('prod-10', 'Bon Bon Bum Tajín',            1700, 1200, 'Dulces & Gomas',        15, 4, '🍭'),
  ('prod-11', 'Bon Bon Bum',                   700,  450, 'Dulces & Gomas',        24, 6, '🍭'),
  ('prod-12', 'Goma Aro',                      300,  180, 'Dulces & Gomas',        30, 5, '🍬'),
  ('prod-13', 'Golochips',                    1800, 1300, 'Snacks & Paquetes',     10, 3, '🥔'),
  ('prod-14', 'Milo',                         1200,  850, 'Bebidas',               12, 3, '🧃'),
  ('prod-15', 'Jugo',                         1500, 1050, 'Bebidas',               14, 4, '🧃'),
  ('prod-16', 'Rosquilla',                    1500, 1100, 'Snacks & Paquetes',     12, 3, '🥨'),
  ('prod-17', 'Wafer Jet',                    2200, 1650, 'Chocolates',            15, 4, '🍫'),
  ('prod-18', 'Queso Pera',                   2500, 1900, 'Lácteos & Refrigerados', 8, 2, '🧀'),
  ('prod-19', 'Arequipe',                     1700, 1200, 'Dulces & Gomas',        10, 3, '🍮'),
  ('prod-20', 'De Todito',                    2900, 2200, 'Snacks & Paquetes',     12, 3, '🍟'),
  ('prod-21', 'Maní',                         1200,  800, 'Snacks & Paquetes',     16, 4, '🥜'),
  ('prod-22', 'Festival',                     1400, 1000, 'Galletas',              15, 4, '🍪'),
  ('prod-23', 'Trocipollos',                  1600, 1150, 'Snacks & Paquetes',     10, 3, '🍗'),
  ('prod-24', 'Chees Tris',                   2000, 1500, 'Snacks & Paquetes',     12, 3, '🧀'),
  ('prod-25', 'Chocobarra',                   2200, 1650, 'Chocolates',            10, 3, '🍫'),
  ('prod-26', 'Platanitos (Verdes / Maduros)',1600, 1150, 'Snacks & Paquetes',     14, 3, '🍌'),
  ('prod-27', 'Piazza',                        800,  500, 'Galletas',              18, 4, '🥖'),
  ('prod-28', 'Choclitos',                    1500, 1100, 'Snacks & Paquetes',     12, 3, '🌽'),
  ('prod-29', 'Papas Pobre',                  1400, 1000, 'Snacks & Paquetes',     10, 3, '🥔'),
  ('prod-30', 'Doritos',                      2000, 1500, 'Snacks & Paquetes',     14, 4, '🔺'),
  ('prod-31', 'Boliqueso',                    1600, 1150, 'Snacks & Paquetes',     12, 3, '🧀'),
  ('prod-32', 'Barra Bianchi',               1200,  850, 'Chocolates',             12, 3, '🍫'),
  ('prod-33', 'Muu',                           800,  500, 'Dulces & Gomas',        16, 4, '🥛'),
  ('prod-34', 'Manimoto',                     1800, 1300, 'Snacks & Paquetes',     12, 3, '🥜'),
  ('prod-35', 'Papas Margarita',              1800, 1300, 'Snacks & Paquetes',     16, 4, '🥔')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 11. SUPABASE REALTIME (Para sincronización inmediata multi-dispositivo)
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE customers, products, sales, sale_items, payments, periods, admins, orders;
