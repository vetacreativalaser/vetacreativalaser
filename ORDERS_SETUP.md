# Sistema de Gestión de Pedidos - Guía de Configuración

Este documento explica cómo configurar el sistema completo de gestión de pedidos con Stripe y Supabase.

## 📋 Características Implementadas

### Para Administradores:
- ✅ Gestión completa de pedidos desde el Admin Dashboard
- ✅ Cambio de estado: Pagado → Produciendo → Completado → Enviado
- ✅ Campo para número de seguimiento de Correos
- ✅ Notas internas por pedido
- ✅ Filtrado por estado y búsqueda
- ✅ Vista detallada con toda la información del pedido

### Para Clientes:
- ✅ Historial de pedidos en su perfil
- ✅ Vista del estado actual del pedido
- ✅ Línea de tiempo del pedido
- ✅ Número de seguimiento con link directo a Correos
- ✅ Detalles de productos y personalización
- ✅ Dirección de envío

### Automatización:
- ✅ Creación automática de pedidos cuando se completa el pago en Stripe
- ✅ Generación automática de números de pedido (formato: VCL-26-00001)
- ✅ Actualización automática de timestamps al cambiar estados

## 🚀 Pasos de Configuración

### 1. Migrar la Base de Datos

Ejecuta la migración SQL en tu proyecto de Supabase:

```bash
# Opción A: Desde Supabase Dashboard
# - Ve a SQL Editor en tu proyecto de Supabase
# - Copia y pega el contenido de supabase/migrations/20260102_create_orders_table.sql
# - Ejecuta la consulta

# Opción B: Usando Supabase CLI (si lo tienes instalado)
supabase db push
```

Esto creará:
- ✅ Tabla `orders` con todos los campos necesarios
- ✅ Índices para búsquedas rápidas
- ✅ Funciones para generar números de pedido
- ✅ Triggers para actualizar timestamps automáticamente
- ✅ Políticas RLS (Row Level Security)

### 2. Desplegar el Webhook de Stripe

```bash
# Desplegar la Edge Function
supabase functions deploy stripe-webhook
```

### 3. Configurar Stripe Webhook

1. **Ir al Dashboard de Stripe:**
   - https://dashboard.stripe.com/webhooks

2. **Añadir endpoint:**
   - Click en "Add endpoint"
   - URL: `https://dspsrnprvrpjrkicxiso.supabase.co/functions/v1/stripe-webhook`
   - Reemplaza `[TU-PROYECTO]` con tu ID de proyecto de Supabase

3. **Seleccionar eventos:**
   - Marca el evento: `checkout.session.completed`

4. **Copiar el Webhook Secret:**
   - Después de crear el webhook, copia el "Signing secret"
   - Tiene el formato: `whsec_...`

### 4. Configurar Variables de Entorno

En tu proyecto de Supabase, añade la variable de entorno del webhook:

```bash
# Opción A: Desde Supabase Dashboard
# - Ve a Project Settings > Edge Functions > Secrets
# - Añade: STRIPE_WEBHOOK_SECRET = whsec_...

# Opción B: Usando CLI
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Asegúrate de que también tienes:
- `STRIPE_SECRET_KEY` - Tu clave secreta de Stripe
- `SUPABASE_URL` - URL de tu proyecto (se configura automáticamente)
- `SUPABASE_SERVICE_ROLE_KEY` - Service key (se configura automáticamente)

### 5. Verificar la Configuración

1. **Hacer un pedido de prueba:**
   - Usa el modo test de Stripe
   - Tarjeta de prueba: `4242 4242 4242 4242`
   - Fecha: cualquier fecha futura
   - CVC: cualquier 3 dígitos

2. **Verificar en Supabase:**
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
   ```
   Deberías ver tu pedido de prueba guardado

3. **Verificar en Admin Dashboard:**
   - Ve a `/admin/dashboard?tab=orders`
   - Deberías ver el pedido listado

## 📊 Flujo del Sistema

### Flujo Completo de un Pedido:

```
1. Cliente añade productos al carrito
   ↓
2. Cliente va a /carrito (página completa)
   ↓
3. Cliente hace click en "Tramitar Pedido"
   ↓
4. Se crea sesión de Stripe Checkout (create-checkout Edge Function)
   ↓
5. Cliente completa el pago en Stripe
   ↓
6. Stripe envía webhook 'checkout.session.completed'
   ↓
7. stripe-webhook Edge Function guarda el pedido en Supabase
   ↓
8. Se genera número de pedido automático (VCL-26-00001)
   ↓
9. Pedido aparece en:
   - Admin Dashboard (/admin/dashboard?tab=orders)
   - Perfil del cliente (/perfil → tab "Pedidos")
```

### Ciclo de Estados del Pedido:

```
paid (Pagado)
  ↓ Admin cambia estado
producing (Produciendo)
  ↓ Admin cambia estado
completed (Completado)
  ↓ Admin añade número de seguimiento
shipped (Enviado)
```

## 🔧 Uso del Sistema

### Para Administradores:

1. **Ver todos los pedidos:**
   - `/admin/dashboard` → Tab "Pedidos"

2. **Filtrar pedidos:**
   - Por estado: Dropdown "Todos / Pagados / Produciendo / etc."
   - Por búsqueda: Buscar por número de pedido, email, nombre

3. **Cambiar estado de un pedido:**
   - Click en "Ver detalles" del pedido
   - Click en el botón "Cambiar a [Estado]"

4. **Añadir número de seguimiento:**
   - Click en "Ver detalles" del pedido
   - Scroll hasta "Número de Seguimiento"
   - Introducir número y click en "Guardar y marcar como enviado"
   - El pedido automáticamente cambia a estado "Enviado"

5. **Añadir notas internas:**
   - En los detalles del pedido
   - Scroll hasta "Notas Internas"
   - Escribir notas y guardar

### Para Clientes:

1. **Ver mis pedidos:**
   - `/perfil` → Tab "Pedidos"

2. **Ver detalles de un pedido:**
   - Click en cualquier pedido

3. **Rastrear envío:**
   - Si el pedido tiene número de seguimiento
   - Click en "Rastrear" para ir a Correos
   - O copiar el número de seguimiento

## 📁 Estructura de Archivos Creados

```
VetaLaser/
├── supabase/
│   ├── functions/
│   │   ├── create-checkout/index.ts      # Edge Function para Stripe Checkout (actualizada)
│   │   └── stripe-webhook/index.ts       # 🆕 Edge Function para webhook de Stripe
│   └── migrations/
│       └── 20260102_create_orders_table.sql  # 🆕 Migración de tabla orders
│
├── src/
│   ├── components/
│   │   └── admin/
│   │       └── orders/
│   │           └── OrderManagement.jsx   # 🆕 Componente de gestión de pedidos (admin)
│   ├── pages/
│   │   ├── Cart.jsx                      # 🆕 Página completa del carrito
│   │   ├── AdminDashboard.jsx            # Actualizado con tab "Pedidos"
│   │   └── profile/
│   │       ├── Profile.jsx               # Actualizado con tab "Pedidos"
│   │       └── components/
│   │           └── OrdersTab.jsx         # 🆕 Historial de pedidos (cliente)
│   └── App.jsx                           # Actualizado con ruta /carrito
│
└── ORDERS_SETUP.md                       # 🆕 Esta guía
```

## 🔍 Esquema de la Tabla Orders

```sql
orders (
  id                    BIGSERIAL PRIMARY KEY,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  -- Identificación
  order_number          TEXT UNIQUE,              -- VCL-26-00001
  stripe_session_id     TEXT UNIQUE,
  stripe_payment_intent_id TEXT,

  -- Cliente
  customer_email        TEXT NOT NULL,
  customer_name         TEXT,

  -- Direcciones
  shipping_address      JSONB NOT NULL,
  billing_address       JSONB,

  -- Detalles del pedido
  items                 JSONB NOT NULL,           -- Array de productos
  subtotal              NUMERIC(10, 2),
  shipping_cost         NUMERIC(10, 2),
  total                 NUMERIC(10, 2),
  total_weight          NUMERIC(10, 2),           -- kg

  -- Estado
  status                TEXT DEFAULT 'paid',      -- paid/producing/completed/shipped/cancelled

  -- Envío
  tracking_number       TEXT,
  shipped_at            TIMESTAMPTZ,

  -- Admin
  admin_notes           TEXT,

  -- Timestamps de estados
  paid_at               TIMESTAMPTZ DEFAULT NOW(),
  producing_started_at  TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ
)
```

## 🎨 Personalización Adicional

### Enviar Emails Automáticos (TODO):

Puedes añadir lógica en `stripe-webhook/index.ts` para enviar emails:

```typescript
// Después de crear el pedido exitosamente...

// 1. Email de confirmación al cliente
await sendCustomerEmail({
  to: customerEmail,
  subject: `Pedido confirmado - ${orderNumber}`,
  body: `Tu pedido ha sido recibido...`
});

// 2. Notificación al admin
await sendAdminNotification({
  to: 'vetacreativalaser@gmail.com',
  subject: `Nuevo pedido - ${orderNumber}`,
  body: `Se ha recibido un nuevo pedido por ${total}€...`
});
```

### Webhooks Adicionales de Stripe:

Puedes añadir más eventos en `stripe-webhook/index.ts`:

```typescript
// Reembolso procesado
if (event.type === 'charge.refunded') {
  // Marcar pedido como cancelado
}

// Pago fallido
if (event.type === 'payment_intent.payment_failed') {
  // Notificar al admin
}
```

## ❓ Preguntas Frecuentes

**P: ¿Cómo puedo probar el webhook localmente?**
R: Usa Stripe CLI:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

**P: ¿Qué pasa si el webhook falla?**
R: Stripe reintenta automáticamente. Puedes ver intentos fallidos en el dashboard de Stripe.

**P: ¿Puedo cambiar el formato del número de pedido?**
R: Sí, edita la función `generate_order_number()` en la migración SQL.

**P: ¿Cómo elimino pedidos de prueba?**
R: Desde Supabase SQL Editor:
```sql
DELETE FROM orders WHERE stripe_session_id LIKE 'cs_test_%';
```

## 📞 Soporte

Si necesitas ayuda:
1. Revisa los logs de Supabase Edge Functions
2. Revisa los logs de webhooks en Stripe Dashboard
3. Verifica las políticas RLS en Supabase

---

**Sistema creado con:** Stripe + Supabase + React
**Última actualización:** 2 de Enero 2026
