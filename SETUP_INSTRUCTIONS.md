# INSTRUCCIONES DE SETUP - VETA CREATIVA LÁSER

Guía paso a paso para configurar el proyecto desde cero.

## REQUISITOS PREVIOS

- Node.js 18+ instalado
- npm o yarn instalado
- Git instalado
- Cuenta de GitHub
- Cuenta de Supabase
- Cuenta de Stripe
- Cuenta de Netlify (para deploy)

---

## 1. CLONAR EL REPOSITORIO

```bash
# Clonar el repositorio
git clone https://github.com/vetacreativalaser/vetacreativalaser.git
cd vetacreativalaser

# O si empiezas desde cero
git init
git remote add origin https://github.com/vetacreativalaser/vetacreativalaser.git
```

---

## 2. INSTALAR DEPENDENCIAS

```bash
# Instalar dependencias del proyecto
npm install
```

### Dependencias principales instaladas:
- **React 18** - Framework frontend
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **Supabase JS** - Cliente de Supabase
- **Stripe JS** - Cliente de Stripe
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes UI
- **Framer Motion** - Animaciones
- **Zustand** - State management
- **React Hook Form** - Formularios
- **Zod** - Validación de schemas

---

## 3. CONFIGURAR SUPABASE

### 3.1 Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales:
   - Project URL
   - Anon (public) key
   - Service role key

### 3.2 Configurar Base de Datos

1. En el dashboard de Supabase → SQL Editor
2. Copia todo el contenido de `supabase/migrations/00_complete_schema.sql`
3. Pégalo en el editor SQL
4. Ejecuta el script (Run)

Esto creará:
- ✅ Todas las tablas (products, orders, reviews, etc.)
- ✅ Índices de performance
- ✅ Políticas RLS (Row Level Security)
- ✅ Triggers automáticos
- ✅ Funciones auxiliares
- ✅ Datos iniciales (seed data)

### 3.2.1 Aplicar Correcciones de Seguridad

**IMPORTANTE**: Después de ejecutar el schema principal, ejecuta las correcciones de seguridad:

1. En el mismo SQL Editor de Supabase
2. Copia todo el contenido de `supabase/fix_security_issues.sql`
3. Pégalo en el editor SQL
4. Ejecuta el script (Run)
5. Verifica que aparezca el mensaje de confirmación

Esto corregirá:
- ✅ search_path en todas las funciones (seguridad contra ataques de injection)
- ✅ Moverá la extensión pg_net al schema extensions
- ✅ Verificará RLS en shipping_rates

### 3.2.2 Configurar Seguridad de Autenticación

Sigue la guía completa en [supabase/SECURITY_CONFIG_GUIDE.md](supabase/SECURITY_CONFIG_GUIDE.md) para:

- ⏰ Configurar OTP expiry a menos de 1 hora
- 🔒 Habilitar verificación de contraseñas contra HaveIBeenPwned
- 🔐 Habilitar opciones MFA adicionales (TOTP recomendado)
- ⬆️ Actualizar PostgreSQL a la última versión con parches de seguridad

### 3.3 Configurar Storage Buckets

En Supabase Dashboard → Storage, crea los siguientes buckets **públicos**:

- `productos` - Imágenes de productos
- `reviews` - Imágenes de reseñas
- `categorias` - Imágenes de categorías
- `portadacategorias` - Banners de home
- `imgadmins` - Imágenes administrativas

### 3.4 Instalar Supabase CLI

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Verificar instalación
supabase --version

# Login en Supabase
supabase login
```

### 3.5 Vincular Proyecto Local

```bash
# Vincular con tu proyecto de Supabase
supabase link --project-ref TU_PROJECT_REF

# TU_PROJECT_REF lo encuentras en: Project Settings → General → Reference ID
```

---

## 4. CONFIGURAR STRIPE

### 4.1 Crear Cuenta Stripe

1. Ve a [https://stripe.com](https://stripe.com)
2. Crea una cuenta o inicia sesión
3. Activa modo Test

### 4.2 Obtener Credenciales

En Dashboard de Stripe → Developers → API keys:
- **Publishable key** (pk_test_...)
- **Secret key** (sk_test_...)
- **Webhook signing secret** (necesario para webhooks)

### 4.3 Configurar Webhook (para producción)

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint
3. URL: `https://TU_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Guarda el **Signing secret**

---

## 5. VARIABLES DE ENTORNO

### 5.1 Frontend (.env)

Crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu-publishable-key
```

⚠️ **IMPORTANTE**: El archivo `.env` está en `.gitignore` y NO se debe subir a GitHub

### 5.2 Supabase Secrets (Backend)

```bash
# Configurar secrets en Supabase para Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_tu-secret-key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu-webhook-secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Verificar secrets configurados
supabase secrets list
```

---

## 6. DESPLEGAR EDGE FUNCTIONS

Las Edge Functions son funciones serverless en Deno que corren en Supabase.

### 6.1 Funciones Disponibles

- **create-checkout** - Crea sesión de pago en Stripe
- **stripe-webhook** - Recibe eventos de Stripe
- (Añadir más según se creen)

### 6.2 Desplegar Funciones

```bash
# Desplegar todas las funciones
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook

# Ver logs de una función
supabase functions logs create-checkout --tail
```

⚠️ **NO uses** `--no-verify-jwt` a menos que sea absolutamente necesario

---

## 7. DESARROLLO LOCAL

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará en http://localhost:5173
```

### Cuentas de Prueba

**Admin**:
- Email: `vetacreativalaser@gmail.com`
- Contraseña: (la que tengas configurada)

**Usuario normal**: Crea uno nuevo desde la app

---

## 8. BUILD Y DEPLOY

### 8.1 Build Local

```bash
# Crear build de producción
npm run build

# Previsualizar build
npm run preview
```

### 8.2 Deploy en Netlify

#### Opción A: Deploy Automático (Recomendado)

1. Ve a [https://netlify.com](https://netlify.com)
2. Conecta tu repositorio de GitHub
3. Configuración de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Variables de entorno en Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
5. Deploy automático al hacer push a `main`

#### Opción B: Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 9. CONFIGURACIÓN POST-DEPLOY

### 9.1 Configurar Dominio (Opcional)

1. En Netlify → Domain settings
2. Añade tu dominio personalizado
3. Configura DNS según instrucciones

### 9.2 Actualizar URLs en Stripe

1. Stripe Dashboard → Webhooks
2. Actualiza URL a producción: `https://TU_DOMINIO.netlify.app/...`

### 9.3 Configurar CORS en Supabase

En Supabase Dashboard → Settings → API:
- Añade tu dominio de Netlify a allowed origins

---

## 10. VERIFICACIÓN FINAL

### Checklist de Verificación:

- [ ] Frontend corre en local (`npm run dev`)
- [ ] Base de datos configurada (schema ejecutado)
- [ ] Storage buckets creados
- [ ] Variables de entorno configuradas
- [ ] Edge Functions desplegadas
- [ ] Stripe webhook configurado
- [ ] Deploy en Netlify exitoso
- [ ] Login funciona
- [ ] Creación de productos funciona
- [ ] Proceso de checkout funciona

---

## 11. TROUBLESHOOTING

### Error: "Invalid API key"
- Verifica que las keys en `.env` sean correctas
- Reinicia el servidor de desarrollo

### Error: "RLS policy violation"
- Verifica que el schema SQL se ejecutó correctamente
- Revisa las políticas RLS en Supabase Dashboard

### Error: "Stripe webhook failed"
- Verifica que el webhook secret esté configurado
- Revisa logs en Stripe Dashboard

### Error: "Function not found"
- Despliega la función: `supabase functions deploy <nombre>`
- Verifica que existe en `supabase/functions/`

### Edge Function errors
- Revisa logs: `supabase functions logs <nombre> --tail`
- Verifica que los secrets estén configurados

---

## 12. COMANDOS ÚTILES

```bash
# Frontend
npm run dev              # Desarrollo
npm run build            # Build producción
npm run preview          # Preview build

# Supabase
supabase login           # Login CLI
supabase link            # Vincular proyecto
supabase functions deploy <name>  # Desplegar función
supabase functions logs <name>    # Ver logs
supabase secrets set KEY=value    # Configurar secret
supabase db reset        # Reset base de datos (⚠️ destructivo)

# Git
git status               # Ver cambios
git add .                # Añadir todos los archivos
git commit -m "mensaje"  # Commit
git push                 # Push a GitHub

# Netlify
netlify deploy --prod    # Deploy manual
netlify open             # Abrir dashboard
```

---

## 13. RECURSOS

- **Documentación Supabase**: https://supabase.com/docs
- **Documentación Stripe**: https://stripe.com/docs
- **Documentación React**: https://react.dev
- **Documentación Vite**: https://vitejs.dev
- **shadcn/ui Components**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

---

## 14. SOPORTE

Para problemas o dudas:
- Email: vetacreativalaser@gmail.com
- GitHub Issues: https://github.com/vetacreativalaser/vetacreativalaser/issues

---

**ÚLTIMA ACTUALIZACIÓN**: 2026-01-04
**VERSIÓN**: 1.0
