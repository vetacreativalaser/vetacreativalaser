# Guía de Configuración de Seguridad en Supabase

Esta guía detalla cómo resolver los problemas de seguridad detectados en el proyecto VetaLaser.

## Resumen de Problemas

- ✅ **RLS en shipping_rates**: Ya resuelto en el schema
- ✅ **search_path en funciones**: Corregido en `fix_security_issues.sql`
- ✅ **Extensión pg_net**: Movida a schema `extensions` en `fix_security_issues.sql`
- ⚠️ **OTP expiry**: Requiere configuración en Dashboard
- ⚠️ **HaveIBeenPwned**: Requiere configuración en Dashboard
- ⚠️ **Opciones MFA**: Requiere configuración en Dashboard
- ⚠️ **Actualización PostgreSQL**: Requiere acción en Dashboard

---

## 1. Ejecutar Script SQL de Corrección

### Paso 1: Acceder al SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New query**

### Paso 2: Ejecutar el Script

1. Copia todo el contenido de `supabase/fix_security_issues.sql`
2. Pégalo en el editor SQL
3. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`
4. Verifica que aparezca el mensaje de confirmación verde

**Esto corregirá:**
- ✅ search_path en todas las funciones
- ✅ Moverá pg_net al schema `extensions`
- ✅ Verificará RLS en shipping_rates

---

## 2. Configurar OTP Expiry (Email)

### Ubicación
**Dashboard → Authentication → Providers → Email**

### Problema
> *We have detected that you have enabled the email provider with the OTP expiry set to more than an hour. It is recommended to set this value to less than an hour.*

### Solución

1. Ve a **Authentication** en el menú lateral
2. Haz clic en **Providers**
3. Busca **Email** en la lista de providers
4. Haz clic en el ícono de editar (lápiz)
5. Busca la configuración **OTP expiry** o **Magic Link expiry**
6. Cámbialo a **3600 segundos** (1 hora) o menos
   - Recomendado: **1800 segundos** (30 minutos)
7. Haz clic en **Save**

### Por qué es importante
Los tokens de un solo uso (OTP) deben tener una vida útil corta para reducir la ventana de oportunidad en caso de interceptación.

---

## 3. Habilitar Verificación de Contraseñas Comprometidas (HaveIBeenPwned)

### Ubicación
**Dashboard → Authentication → Policies**

### Problema
> *Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.*

### Solución

1. Ve a **Authentication** en el menú lateral
2. Haz clic en **Policies** (o **Settings**)
3. Busca la sección **Password Protection** o **Security**
4. Activa la opción **Check passwords against HaveIBeenPwned**
5. Guarda los cambios

### Por qué es importante
HaveIBeenPwned es una base de datos de contraseñas comprometidas. Esto previene que los usuarios usen contraseñas conocidas por haber sido filtradas en brechas de seguridad.

---

## 4. Habilitar Más Opciones MFA (Multi-Factor Authentication)

### Ubicación
**Dashboard → Authentication → Providers**

### Problema
> *Your project has too few MFA options enabled, which may weaken account security. Enable more MFA methods to enhance security.*

### Solución

Actualmente solo tienes habilitada la autenticación por email. Se recomienda habilitar al menos una de estas opciones de MFA:

#### Opción A: TOTP (Time-based One-Time Password)

1. Ve a **Authentication** → **Providers**
2. Busca **TOTP** en la lista
3. Haz clic en **Enable**
4. Configura si quieres forzar MFA para todos los usuarios o hacerlo opcional
5. Guarda los cambios

**Ventajas:**
- Compatible con Google Authenticator, Authy, 1Password, etc.
- No requiere conexión a internet después de la configuración inicial
- Muy seguro

#### Opción B: Phone (SMS)

1. Ve a **Authentication** → **Providers**
2. Busca **Phone** en la lista
3. Haz clic en **Enable**
4. Configura un proveedor de SMS (Twilio, MessageBird, etc.)
5. Añade las credenciales del proveedor
6. Guarda los cambios

**Ventajas:**
- Familiar para la mayoría de usuarios
- Buena opción de recuperación

**Desventajas:**
- Requiere configurar un servicio de SMS de pago
- Menos seguro que TOTP

#### Recomendación para VetaLaser

Para un ecommerce, se recomienda:

1. **Habilitar TOTP** para cuentas administrativas (obligatorio)
2. **Hacer opcional TOTP** para clientes (mejoraría su seguridad)
3. Si el presupuesto lo permite, añadir **Phone** como backup

### Configuración Sugerida

```yaml
MFA para Admins: TOTP (obligatorio)
MFA para Clientes: TOTP (opcional)
```

---

## 5. Actualizar PostgreSQL

### Ubicación
**Dashboard → Settings → Database**

### Problema
> *We have detected that the current version of postgres, supabase-postgres-17.4.1.054, has outstanding security patches available. Upgrade your database to receive the latest security patches.*

### Solución

1. Ve a **Settings** en el menú lateral
2. Haz clic en **Database**
3. Busca la sección **PostgreSQL Version**
4. Si hay una actualización disponible, verás un botón **Upgrade**
5. Lee las notas de la versión
6. **IMPORTANTE**: Haz un backup antes de actualizar
   - Ve a **Database** → **Backups**
   - Haz clic en **Create backup**
   - Espera a que se complete
7. Vuelve a **Settings** → **Database**
8. Haz clic en **Upgrade**
9. Espera a que se complete el proceso (puede tardar varios minutos)
10. Verifica que la aplicación sigue funcionando correctamente

### ⚠️ PRECAUCIONES

- **Haz un backup antes** de actualizar
- Realiza la actualización en **horario de bajo tráfico**
- Ten a mano el script `fix_security_issues.sql` por si necesitas reejecutarlo
- Prueba todas las funcionalidades críticas después de actualizar:
  - Login/Registro
  - Crear productos
  - Procesar pedidos
  - Subir imágenes

### Si algo sale mal

1. Ve a **Database** → **Backups**
2. Encuentra el backup que creaste antes de actualizar
3. Haz clic en **Restore**
4. Contacta al soporte de Supabase si el problema persiste

---

## 6. Verificación Post-Configuración

### Checklist de Seguridad

Una vez completados todos los pasos, verifica:

- [ ] Script SQL ejecutado correctamente
- [ ] OTP expiry configurado a ≤ 1 hora
- [ ] HaveIBeenPwned habilitado
- [ ] Al menos 1 método MFA adicional habilitado
- [ ] PostgreSQL actualizado a la última versión
- [ ] Backup reciente creado
- [ ] Todas las funcionalidades funcionan correctamente

### Cómo Verificar

1. Ve a **Database** → **Roles** → **Security Advisor**
2. Verifica que no haya nuevas alertas de seguridad
3. Si aún aparecen alertas:
   - Lee el mensaje de error
   - Revisa esta guía
   - Consulta la documentación de Supabase

---

## 7. Mantenimiento Continuo

### Recomendaciones

1. **Backups automáticos**: Verifica que estén habilitados
   - Ve a **Settings** → **Database** → **Backups**
   - Configura backups diarios

2. **Monitoreo de seguridad**: Revisa el Security Advisor cada semana
   - **Database** → **Roles** → **Security Advisor**

3. **Actualizaciones**: Mantén PostgreSQL actualizado
   - Supabase notifica cuando hay actualizaciones disponibles
   - Programa actualizaciones mensuales

4. **Auditoría de permisos**: Revisa las políticas RLS trimestralmente
   - Verifica que solo los admins tengan acceso a datos sensibles
   - Asegúrate de que las políticas sigan siendo correctas

---

## 8. Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Best Practices de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Advisor Guide](https://supabase.com/docs/guides/platform/security-advisor)
- [PostgreSQL Upgrade Guide](https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects)

---

## Contacto y Soporte

Si encuentras problemas durante la configuración:

1. Revisa los logs en **Logs** → **Error logs**
2. Consulta [Supabase Discord](https://discord.supabase.com)
3. Abre un ticket en [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**Última actualización**: 2026-01-04
**Versión**: 1.0
**Proyecto**: Veta Creativa Láser
