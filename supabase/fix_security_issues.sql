-- =====================================================
-- SCRIPT DE CORRECCIÓN DE PROBLEMAS DE SEGURIDAD
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. CORREGIR SEARCH_PATH EN FUNCIONES EXISTENTES
-- =====================================================

-- Verificar si las funciones existen antes de corregirlas
DO $$
BEGIN
    -- update_product_category_name
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_product_category_name') THEN
        EXECUTE 'ALTER FUNCTION update_product_category_name() SET search_path = public, pg_temp';
    END IF;

    -- update_products_on_category_change
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_products_on_category_change') THEN
        EXECUTE 'ALTER FUNCTION update_products_on_category_change() SET search_path = public, pg_temp';
    END IF;

    -- generate_sku
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_sku') THEN
        EXECUTE 'ALTER FUNCTION generate_sku() SET search_path = public, pg_temp';
    END IF;

    -- set_product_sku
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_product_sku') THEN
        EXECUTE 'ALTER FUNCTION set_product_sku() SET search_path = public, pg_temp';
    END IF;

    -- update_order_status_timestamps
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_order_status_timestamps') THEN
        EXECUTE 'ALTER FUNCTION update_order_status_timestamps() SET search_path = public, pg_temp';
    END IF;

    -- delete_favorites_on_product_delete
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_favorites_on_product_delete') THEN
        EXECUTE 'ALTER FUNCTION delete_favorites_on_product_delete() SET search_path = public, pg_temp';
    END IF;

    -- set_default_category_name
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_default_category_name') THEN
        EXECUTE 'ALTER FUNCTION set_default_category_name() SET search_path = public, pg_temp';
    END IF;

    -- update_purchase_count
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_purchase_count') THEN
        EXECUTE 'ALTER FUNCTION update_purchase_count() SET search_path = public, pg_temp';
    END IF;

    -- delete_stripe_product
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_stripe_product') THEN
        EXECUTE 'ALTER FUNCTION delete_stripe_product() SET search_path = public, pg_temp';
    END IF;

    -- generate_order_number
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_order_number') THEN
        EXECUTE 'ALTER FUNCTION generate_order_number() SET search_path = public, pg_temp';
    END IF;
END $$;

-- 2. MOVER EXTENSIÓN PG_NET FUERA DE PUBLIC SCHEMA
-- =====================================================

-- Crear schema extensions si no existe
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover pg_net si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
    END IF;
END $$;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. VERIFICAR RLS EN SHIPPING_RATES (YA DEBERÍA ESTAR HABILITADO)
-- =====================================================

-- Solo habilitar si por alguna razón no está habilitado
ALTER TABLE IF EXISTS public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Verificar que las políticas existan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'shipping_rates'
        AND policyname = 'Tarifas visibles para todos'
    ) THEN
        CREATE POLICY "Tarifas visibles para todos" ON shipping_rates FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'shipping_rates'
        AND policyname = 'Solo admins modifican tarifas'
    ) THEN
        CREATE POLICY "Solo admins modifican tarifas" ON shipping_rates FOR ALL
            USING (auth.jwt() ->> 'email' = 'vetacreativalaser@gmail.com');
    END IF;
END $$;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Script de corrección de seguridad ejecutado correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Acciones completadas:';
    RAISE NOTICE '1. ✅ Corregido search_path en funciones existentes';
    RAISE NOTICE '2. ✅ Movida extensión pg_net a schema extensions';
    RAISE NOTICE '3. ✅ Verificado RLS en shipping_rates';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Configuraciones pendientes (requieren Dashboard de Supabase):';
    RAISE NOTICE '4. ⏰ Configurar OTP expiry a menos de 1 hora';
    RAISE NOTICE '5. 🔒 Habilitar verificación HaveIBeenPwned';
    RAISE NOTICE '6. 🔐 Habilitar más opciones MFA';
    RAISE NOTICE '7. ⬆️  Actualizar PostgreSQL a la última versión';
END $$;
