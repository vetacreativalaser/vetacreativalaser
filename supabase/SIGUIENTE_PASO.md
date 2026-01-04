# Próximos Pasos - Seguridad de Supabase

## Lo que ya está listo

He corregido los problemas de seguridad automáticamente en el código:
- ✅ Funciones con `search_path` seguro
- ✅ RLS verificado en todas las tablas
- ✅ Documentación completa creada

## Lo que necesitas hacer AHORA

### 1. Ejecutar el script SQL (5 minutos)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → Tu proyecto
2. Clic en **SQL Editor** en el menú lateral
3. Clic en **New query**
4. Abre el archivo `supabase/fix_security_issues.sql` de este proyecto
5. Copia TODO el contenido
6. Pégalo en el SQL Editor
7. Clic en **Run** (o `Ctrl/Cmd + Enter`)
8. Deberías ver mensajes verdes confirmando que se ejecutó

**Resultado esperado:**
```
✅ Script de corrección de seguridad ejecutado correctamente

📋 Acciones completadas:
1. ✅ Corregido search_path en funciones existentes
2. ⚠️  Extensión pg_net no puede moverse (limitación de Supabase - puede ignorarse)
3. ✅ Verificado RLS en shipping_rates
```

### 2. Configurar autenticación en Dashboard (15 minutos)

Sigue la guía paso a paso en [`SECURITY_CONFIG_GUIDE.md`](SECURITY_CONFIG_GUIDE.md).

**Pasos rápidos:**

#### A. OTP Expiry (3 minutos)
- Dashboard → Authentication → Providers → Email
- Configurar **OTP expiry** a **1800 segundos** (30 min) o **3600 segundos** (1 hora)
- Guardar

#### B. HaveIBeenPwned (2 minutos)
- Dashboard → Authentication → Policies
- Activar **"Check passwords against HaveIBeenPwned"**
- Guardar

#### C. MFA con TOTP (5 minutos)
- Dashboard → Authentication → Providers
- Buscar **TOTP**
- Activar
- Configurar como **obligatorio para admins**
- Guardar

#### D. Actualizar PostgreSQL (5 minutos + tiempo de actualización)
1. Dashboard → Settings → Database → **Backups** → **Create backup** (IMPORTANTE)
2. Esperar a que termine el backup
3. Dashboard → Settings → Database
4. Si hay botón **Upgrade**, hacer clic
5. Esperar a que termine (puede tardar varios minutos)
6. Probar que todo funcione

## Warnings que puedes ignorar

### pg_net en schema public
Si después de ejecutar el script aún ves este warning en el Security Advisor:

> Extension `pg_net` is installed in the public schema

**Puedes ignorarlo.** Es una limitación técnica de Supabase que no representa riesgo real. Ver detalles en [`SECURITY_CONFIG_GUIDE.md sección 2`](SECURITY_CONFIG_GUIDE.md#2-extensión-pg_net-en-schema-public).

## Verificación final

Después de completar todos los pasos:

1. Ve a Dashboard → **Roles** → **Security Advisor**
2. Verifica que los warnings hayan desaparecido (excepto pg_net)
3. Prueba que la app funcione:
   - Login/registro
   - Crear productos
   - Hacer un pedido de prueba

## Archivos de referencia

- [`fix_security_issues.sql`](fix_security_issues.sql) - Script SQL a ejecutar
- [`SECURITY_CONFIG_GUIDE.md`](SECURITY_CONFIG_GUIDE.md) - Guía completa paso a paso
- [`PROBLEMAS_RESUELTOS.md`](PROBLEMAS_RESUELTOS.md) - Documentación técnica detallada

## ¿Necesitas ayuda?

Si encuentras algún problema:
1. Revisa los logs en Dashboard → Logs → Error logs
2. Consulta la sección de troubleshooting en [`SECURITY_CONFIG_GUIDE.md`](SECURITY_CONFIG_GUIDE.md)
3. Contacta a Supabase Support si es necesario

---

**Tiempo estimado total**: 20-30 minutos
**Prioridad**: Alta (seguridad)
**Puedes hacerlo en**: Horario de bajo tráfico recomendado
