-- =====================================================
-- Añadir columnas de ordenación
-- - categorias.sort_order: orden manual (drag & drop)
-- - products.priority: prioridad (menor = primero)
-- =====================================================

ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
