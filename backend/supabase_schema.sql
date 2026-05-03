-- ═══════════════════════════════════════════════════════
-- 🏠 HOUSET LUXEMBOURG — Supabase Schema
-- Ejecutar en: supabase.com → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- 1. PRODUCTS (Catálogo de productos)
CREATE TABLE IF NOT EXISTS products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  provider        TEXT,
  is_certified_artisan BOOLEAN DEFAULT false,
  image           TEXT,
  category        TEXT DEFAULT 'general',
  in_stock        BOOLEAN DEFAULT true,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Poblar con datos iniciales (los 4 productos actuales del mock)
INSERT INTO products (name, price, provider, is_certified_artisan, image, category) VALUES
  ('Fauteuil Velvet Lounge',          450, 'Artisan Furniture EU',  true,  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop', 'furniture'),
  ('Table Basse Chêne Industriel',    290, 'Creameng / BigBuy',     false, 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=600&auto=format&fit=crop', 'furniture'),
  ('Set Quincaillerie Premium',        120, 'Emuca Online',          false, 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=600&auto=format&fit=crop', 'hardware'),
  ('Chaise Sculptée à la Main',       340, 'Menuiserie Locale Lux', true,  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop', 'furniture')
ON CONFLICT DO NOTHING;

-- 2. CONTACT LEADS (CRM básico — todos los formularios de contacto)
CREATE TABLE IF NOT EXISTS contact_leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  service     TEXT,
  source      TEXT DEFAULT 'houset-web',
  status      TEXT DEFAULT 'new',  -- new | contacted | converted | lost
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ARTISAN PARTNERS (Red B2B de artesanos)
CREATE TABLE IF NOT EXISTS artisan_partners (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  specialty    TEXT,
  email        TEXT UNIQUE NOT NULL,
  phone        TEXT,
  status       TEXT DEFAULT 'pending',  -- pending | approved | rejected
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════

-- Products: lectura pública, escritura solo service role
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT USING (true);
CREATE POLICY "Products only writable by service role"
  ON products FOR ALL USING (auth.role() = 'service_role');

-- Contact Leads: solo service role puede leer/escribir
ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads only for service role"
  ON contact_leads FOR ALL USING (auth.role() = 'service_role');

-- Artisan Partners: solo service role
ALTER TABLE artisan_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners only for service role"
  ON artisan_partners FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════
-- ✅ Verificar que todo fue creado
-- ═══════════════════════════════════════
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('products', 'contact_leads', 'artisan_partners');
