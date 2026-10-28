-- Habilitar RLS en la tabla profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Los usuarios pueden ver todos los perfiles (lectura pública)
-- Esto es necesario para mostrar nombres de usuarios en reseñas, etc.
CREATE POLICY "Perfiles visibles para todos"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Política 2: Los usuarios solo pueden insertar su propio perfil
-- Esto previene que un usuario cree perfiles para otros
CREATE POLICY "Usuarios pueden crear su propio perfil"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política 3: Los usuarios solo pueden actualizar su propio perfil
-- Permite que los usuarios editen su información personal
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 4: Solo admins pueden eliminar perfiles
-- Previene que usuarios eliminen sus propios perfiles o los de otros
-- NOTA: Necesitarás una columna 'role' en profiles o auth.users para esto
-- Por ahora, bloqueamos DELETE para todos menos service_role
CREATE POLICY "Solo admins pueden eliminar perfiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (false); -- Nadie puede eliminar excepto service_role que bypasea RLS

-- Comentarios sobre las políticas
COMMENT ON POLICY "Perfiles visibles para todos" ON public.profiles IS
'Permite que cualquiera (incluso usuarios no autenticados) pueda ver los perfiles.
Esto es necesario para mostrar nombres de usuarios en reseñas y otros lugares públicos.';

COMMENT ON POLICY "Usuarios pueden crear su propio perfil" ON public.profiles IS
'Previene que usuarios creen perfiles para otros usuarios. Solo pueden crear su propio perfil
donde el ID coincide con su auth.uid().';

COMMENT ON POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles IS
'Permite que los usuarios actualicen su propia información (nombre, teléfono, etc.)
pero no la de otros usuarios.';

COMMENT ON POLICY "Solo admins pueden eliminar perfiles" ON public.profiles IS
'Bloquea la eliminación de perfiles para usuarios normales. Solo service_role (backend/admin)
puede eliminar perfiles, lo que bypasea RLS automáticamente.';
