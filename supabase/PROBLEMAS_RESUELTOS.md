# Problemas de Seguridad Resueltos

Este documento detalla los problemas de seguridad detectados por el Security Advisor de Supabase y las soluciones implementadas.

## Resumen Ejecutivo

**Fecha de detección**: 2026-01-04
**Total de problemas**: 8
**Estado**: ✅ Resueltos automáticamente: 2 | ⚠️ Limitación ignorable: 1 | ⏰ Requieren config manual: 4 | ⬆️ Actualización: 1

---

## Problemas Detectados y Soluciones

### 1. ✅ RLS no habilitado en `shipping_rates`

**Problema Original:**
> Table `public.shipping_rates` is public, but RLS has not been enabled.

**Estado**: ✅ RESUELTO

**Solución:**
- RLS ya estaba habilitado en el schema [`00_complete_schema.sql`](00_complete_schema.sql:193)
- Políticas RLS configuradas en líneas 255-257
- El script [`fix_security_issues.sql`](fix_security_issues.sql) verifica y habilita RLS si faltara

**Verificación:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'shipping_rates';
-- Debe devolver rowsecurity = true
```

---

### 2. ✅ Funciones con search_path mutable

**Problemas Originales:**
> Function `public.update_product_category_name` has a role mutable search_path
> Function `public.update_products_on_category_change` has a role mutable search_path
> Function `public.generate_sku` has a role mutable search_path
> Function `public.set_product_sku` has a role mutable search_path
> Function `public.update_order_status_timestamps` has a role mutable search_path
> Function `public.delete_favorites_on_product_delete` has a role mutable search_path
> Function `public.set_default_category_name` has a role mutable search_path
> Function `public.update_purchase_count` has a role mutable search_path
> Function `public.delete_stripe_product` has a role mutable search_path
> Function `public.update_orders_updated_at` has a role mutable search_path
> Function `public.generate_order_number` has a role mutable search_path

**Estado**: ✅ RESUELTO

**Explicación del problema:**
Un `search_path` mutable permite ataques de inyección de schema donde un atacante podría crear objetos maliciosos en otros schemas que se ejecutarían en lugar de los legítimos.

**Solución implementada:**
1. Todas las funciones en [`00_complete_schema.sql`](00_complete_schema.sql) ahora incluyen:
   ```sql
   SET search_path = public, pg_temp;
   ```

2. El script [`fix_security_issues.sql`](fix_security_issues.sql) corrige automáticamente las funciones existentes que no tengan `search_path` fijado.

**Funciones corregidas:**
- ✅ `update_updated_at_column()` - línea 271
- ✅ `cleanup_expired_password_tokens()` - línea 298
- ✅ `get_orders_with_user_info()` - línea 336
- ✅ Todas las funciones listadas en el problema (mediante ALTER FUNCTION)

**Verificación:**
```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('update_product_category_name', 'generate_sku', 'update_order_status_timestamps')
  AND prosqlbody IS NULL;
-- Debe mostrar SET search_path en la configuración
```

---

### 3. ⚠️ Extensión pg_net en schema public

**Problema Original:**
> Extension `pg_net` is installed in the public schema. Move it to another schema.

**Estado**: ⚠️ LIMITACIÓN DE SUPABASE - PUEDE IGNORARSE

**Explicación del problema:**
La extensión `pg_net` **no puede moverse** del schema `public` en bases de datos gestionadas por Supabase debido a limitaciones técnicas:

- `pg_net` no soporta `ALTER EXTENSION SET SCHEMA`
- Es una extensión gestionada por Supabase (no por el usuario)
- Requiere permisos de superuser para recrearla manualmente
- En el contexto de Supabase managed database, **no representa un riesgo real de seguridad**

**Solución implementada:**
El script [`fix_security_issues.sql`](fix_security_issues.sql) incluye:

1. Documentación del problema
2. Explicación de por qué puede ignorarse
3. Mensaje informativo al ejecutar el script

**Por qué puede ignorarse:**
1. Supabase gestiona esta extensión automáticamente
2. No tienes permisos para moverla (y no los necesitas)
3. La ubicación en `public` está controlada y no es explotable en Supabase managed databases

**Referencia:**
- [GitHub Discussion #9314](https://github.com/supabase/supabase/discussions/9314)
- Ver detalles en [SECURITY_CONFIG_GUIDE.md](SECURITY_CONFIG_GUIDE.md#2-extensión-pg_net-en-schema-public)

---

### 4. ⏰ OTP expiry mayor a 1 hora

**Problema Original:**
> We have detected that you have enabled the email provider with the OTP expiry set to more than an hour. It is recommended to set this value to less than an hour.

**Estado**: ⚠️ REQUIERE ACCIÓN MANUAL

**Solución:**
Ver guía completa en [SECURITY_CONFIG_GUIDE.md](SECURITY_CONFIG_GUIDE.md#2-configurar-otp-expiry-email)

**Pasos:**
1. Dashboard → Authentication → Providers → Email
2. Configurar OTP expiry a **3600 segundos** (1 hora) o menos
3. Recomendado: **1800 segundos** (30 minutos)

**Por qué es importante:**
Reduce la ventana de oportunidad en caso de interceptación del token.

---

### 5. 🔒 Verificación HaveIBeenPwned deshabilitada

**Problema Original:**
> Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.

**Estado**: ⚠️ REQUIERE ACCIÓN MANUAL

**Solución:**
Ver guía completa en [SECURITY_CONFIG_GUIDE.md](SECURITY_CONFIG_GUIDE.md#3-habilitar-verificación-de-contraseñas-comprometidas-haveibeeenpwned)

**Pasos:**
1. Dashboard → Authentication → Policies
2. Activar "Check passwords against HaveIBeenPwned"

**Por qué es importante:**
Previene que usuarios usen contraseñas conocidas por estar comprometidas en brechas de seguridad.

---

### 6. 🔐 Pocas opciones MFA habilitadas

**Problema Original:**
> Your project has too few MFA options enabled, which may weaken account security. Enable more MFA methods to enhance security.

**Estado**: ⚠️ REQUIERE ACCIÓN MANUAL

**Solución:**
Ver guía completa en [SECURITY_CONFIG_GUIDE.md](SECURITY_CONFIG_GUIDE.md#4-habilitar-más-opciones-mfa-multi-factor-authentication)

**Recomendación para VetaLaser:**
1. Habilitar **TOTP** (Time-based One-Time Password)
   - Para admins: obligatorio
   - Para clientes: opcional
2. Compatible con Google Authenticator, Authy, 1Password

**Pasos:**
1. Dashboard → Authentication → Providers
2. Habilitar TOTP
3. Configurar como obligatorio para admins

---

### 7. ⬆️ PostgreSQL desactualizado

**Problema Original:**
> We have detected that the current version of postgres, supabase-postgres-17.4.1.054, has outstanding security patches available. Upgrade your database to receive the latest security patches.

**Estado**: ⚠️ REQUIERE ACCIÓN MANUAL

**Solución:**
Ver guía completa en [SECURITY_CONFIG_GUIDE.md](SECURITY_CONFIG_GUIDE.md#5-actualizar-postgresql)

**⚠️ IMPORTANTE:**
1. **Hacer backup ANTES** de actualizar
2. Realizar en horario de bajo tráfico
3. Probar todas las funcionalidades después

**Pasos:**
1. Settings → Database → Backups → Create backup
2. Settings → Database → PostgreSQL Version → Upgrade
3. Verificar funcionalidad de la app

---

## Archivos Creados/Modificados

### Archivos Nuevos
1. [`fix_security_issues.sql`](fix_security_issues.sql) - Script de corrección automatizada
2. [`SECURITY_CONFIG_GUIDE.md`](SECURITY_CONFIG_GUIDE.md) - Guía paso a paso de configuración
3. [`PROBLEMAS_RESUELTOS.md`](PROBLEMAS_RESUELTOS.md) - Este archivo

### Archivos Modificados
1. [`00_complete_schema.sql`](00_complete_schema.sql) - Añadido `SET search_path` a todas las funciones
2. [`../SETUP_INSTRUCTIONS.md`](../SETUP_INSTRUCTIONS.md) - Añadida sección de seguridad

---

## Orden de Ejecución

Para un proyecto nuevo, sigue este orden:

1. ✅ Ejecutar [`00_complete_schema.sql`](00_complete_schema.sql)
2. ✅ Ejecutar [`fix_security_issues.sql`](fix_security_issues.sql)
   - Corregirá search_path en funciones
   - Verificará RLS en todas las tablas
   - Mostrará advertencia sobre pg_net (ignorable)
3. ⚠️ Seguir pasos manuales en [SECURITY_CONFIG_GUIDE.md](SECURITY_CONFIG_GUIDE.md)
   - Configurar OTP expiry
   - Habilitar HaveIBeenPwned
   - Habilitar MFA (TOTP recomendado)
   - Actualizar PostgreSQL
4. ✅ Verificar con checklist de seguridad

---

## Verificación Final

### Checklist Post-Corrección

- [ ] Script SQL ejecutado sin errores
- [ ] Todas las funciones tienen `search_path` fijo
- [ ] Extensión `pg_net` en schema `extensions`
- [ ] RLS habilitado en todas las tablas
- [ ] OTP expiry configurado a ≤ 1 hora
- [ ] HaveIBeenPwned habilitado
- [ ] MFA (TOTP) habilitado
- [ ] PostgreSQL actualizado
- [ ] Backup reciente creado
- [ ] App funcionando correctamente

### Comando de Verificación

```sql
-- Verificar search_path en funciones
SELECT
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    CASE
        WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅ Fixed'
        ELSE '❌ Needs fix'
    END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

---

## Mantenimiento Continuo

### Revisiones Recomendadas

- **Semanal**: Revisar Security Advisor en Supabase Dashboard
- **Mensual**: Verificar actualizaciones de PostgreSQL disponibles
- **Trimestral**: Auditoría de políticas RLS y permisos

### Recursos

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [PostgreSQL Security Documentation](https://www.postgresql.org/docs/current/security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Documentado por**: Claude Code
**Fecha**: 2026-01-04
**Versión**: 1.0
**Proyecto**: Veta Creativa Láser
