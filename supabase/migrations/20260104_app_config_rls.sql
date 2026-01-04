-- Habilitar RLS en app_config si no está habilitado
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir a todos leer la configuración
CREATE POLICY "Permitir lectura pública de configuración"
ON app_config
FOR SELECT
TO public
USING (true);

-- Política para permitir a usuarios autenticados insertar/actualizar configuración
-- (Solo administradores deberían tener acceso, pero por ahora permitimos a autenticados)
CREATE POLICY "Permitir a usuarios autenticados modificar configuración"
ON app_config
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Comentario sobre seguridad
COMMENT ON TABLE app_config IS 'Tabla de configuración de la aplicación. IMPORTANTE: Restringir acceso solo a administradores en producción usando metadata de usuario.';
