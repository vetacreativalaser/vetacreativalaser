-- =====================================================
-- SCHEMA COMPLETO DE VETA CREATIVA LASER
-- Base de datos para ecommerce de productos láser
-- =====================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda de texto

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  categoria TEXT NOT NULL UNIQUE,
  filter TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  full_description TEXT,
  brief_description TEXT,
  specifications JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  image_urls JSONB DEFAULT '[]'::jsonb,
  image_alts JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  stock INTEGER DEFAULT 0,
  price JSONB NOT NULL DEFAULT '{"type": "fixed", "value": 0}'::jsonb,
  purchase_mode TEXT DEFAULT 'standard' CHECK (purchase_mode IN ('standard', 'contact', 'disabled')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  shipping_weight DECIMAL(10,2) DEFAULT 0,
  related_products UUID[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'España',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  user_address TEXT,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  items JSONB NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tokens de reseteo de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de configuración de la aplicación
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de banner principal
CREATE TABLE IF NOT EXISTS banner_principal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN DEFAULT true,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tarifas de envío
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_amount DECIMAL(10,2),
  rate DECIMAL(10,2) NOT NULL,
  free_shipping_threshold DECIMAL(10,2),
  currency TEXT DEFAULT 'eur',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Índice para búsqueda de texto en productos
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(description gin_trgm_ops);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_principal ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias (lectura pública)
CREATE POLICY "Categorías visibles para todos" ON categorias FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden modificar categorías" ON categorias FOR ALL
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Políticas para products (lectura pública, escritura admin)
CREATE POLICY "Productos visibles para todos" ON products FOR SELECT USING (true);
CREATE POLICY "Solo admins pueden modificar productos" ON products FOR ALL
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Políticas para profiles
CREATE POLICY "Usuarios pueden ver su propio perfil" ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Admins pueden ver todos los perfiles" ON profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Políticas para favorites
CREATE POLICY "Usuarios pueden ver sus favoritos" ON favorites FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden añadir favoritos" ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus favoritos" ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para reviews
CREATE POLICY "Reviews visibles para todos" ON reviews FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden crear reviews" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus reviews" ON reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden eliminar sus reviews" ON reviews FOR DELETE
  USING (auth.uid() = user_id);
CREATE POLICY "Admins pueden eliminar cualquier review" ON reviews FOR DELETE
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Políticas para orders
CREATE POLICY "Usuarios pueden ver sus pedidos" ON orders FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role puede gestionar pedidos" ON orders FOR ALL
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins pueden ver todos los pedidos" ON orders FOR SELECT
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Políticas para password_reset_tokens
CREATE POLICY "Service role gestiona tokens" ON password_reset_tokens FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Políticas para app_config
CREATE POLICY "Permitir lectura pública de configuración" ON app_config FOR SELECT USING (true);
CREATE POLICY "Permitir a usuarios autenticados modificar configuración" ON app_config FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Políticas para banner_principal
CREATE POLICY "Banners visibles para todos" ON banner_principal FOR SELECT USING (true);
CREATE POLICY "Solo admins modifican banners" ON banner_principal FOR ALL
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- Políticas para shipping_rates
CREATE POLICY "Tarifas visibles para todos" ON shipping_rates FOR SELECT USING (true);
CREATE POLICY "Solo admins modifican tarifas" ON shipping_rates FOR ALL
  USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_password_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR (used = true AND created_at < NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Función RPC para obtener pedidos con información de usuario
CREATE OR REPLACE FUNCTION get_orders_with_user_info()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  user_phone TEXT,
  user_address TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT,
  total_amount DECIMAL,
  currency TEXT,
  items JSONB,
  shipping_address JSONB,
  billing_address JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  profile_full_name TEXT,
  profile_phone TEXT,
  profile_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.*,
    p.full_name,
    p.phone,
    p.address
  FROM orders o
  LEFT JOIN profiles p ON o.user_id = p.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Los buckets se crean manualmente en Supabase Dashboard:
-- - productos (público)
-- - reviews (público)
-- - categorias (público)
-- - portadacategorias (público)
-- - imgisaac (público)

-- =====================================================
-- DATOS INICIALES (SEED DATA)
-- =====================================================

-- Insertar configuración por defecto
INSERT INTO app_config (key, value) VALUES
  ('site_name', '"Veta Creativa Laser"'),
  ('contact_email', '"vetacreativalaser@gmail.com"'),
  ('points_per_euro', '10'),
  ('free_shipping_threshold', '50'),
  ('shop_paused', 'false'),
  ('shop_pause_message', '"Las compras online están pausadas temporalmente por mantenimiento de la máquina o periodo de exámenes con poca disposición de tiempo. Si urge demasiado, escríbenos."')
ON CONFLICT (key) DO NOTHING;

-- Insertar tarifa de envío por defecto
INSERT INTO shipping_rates (country, min_amount, rate, free_shipping_threshold, active) VALUES
  ('España', 0, 4.99, 50.00, true),
  ('Portugal', 0, 6.99, 75.00, true),
  ('Francia', 0, 8.99, 100.00, true),
  ('Alemania', 0, 8.99, 100.00, true),
  ('Italia', 0, 8.99, 100.00, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE categorias IS 'Categorías de productos';
COMMENT ON TABLE products IS 'Catálogo de productos disponibles para venta';
COMMENT ON TABLE profiles IS 'Información extendida de usuarios (complementa auth.users)';
COMMENT ON TABLE favorites IS 'Lista de favoritos de cada usuario';
COMMENT ON TABLE reviews IS 'Reseñas y valoraciones de productos';
COMMENT ON TABLE orders IS 'Pedidos realizados por los clientes';
COMMENT ON TABLE password_reset_tokens IS 'Tokens temporales para reseteo de contraseña';
COMMENT ON TABLE app_config IS 'Tabla de configuración de la aplicación. IMPORTANTE: Restringir acceso solo a administradores en producción usando metadata de usuario.';
COMMENT ON COLUMN products.price IS 'Configuración de precio: {type: "fixed"|"per_unit"|"per_area", value: number, unit?: "cm2"|"cm"|"unit"}';
COMMENT ON COLUMN products.custom_fields IS 'Campos personalizables: [{name, type, required, options?, price?}]';
COMMENT ON COLUMN products.purchase_mode IS 'Modo de compra: standard (compra directa), contact (solo contacto), disabled (no disponible)';
COMMENT ON COLUMN products.status IS 'Estado del producto: active (visible), draft (borrador), archived (archivado)';
COMMENT ON COLUMN products.related_products IS 'Array de UUIDs de productos relacionados para cross-selling';
