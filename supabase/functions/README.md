# Edge Functions - Veta Creativa Láser

Este directorio contiene las Edge Functions de Supabase para el e-commerce.

## 📁 Estructura

```
supabase/functions/
├── create-checkout/     # Crea sesiones de Stripe Checkout
│   └── index.ts
├── stripe-webhook/      # Procesa webhooks de Stripe (TODO)
│   └── index.ts
└── deno.json           # Configuración de Deno
```

## 🚀 Despliegue

### Prerequisitos

1. Instalar Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login en Supabase:
   ```bash
   supabase login
   ```

3. Vincular proyecto:
   ```bash
   supabase link --project-ref TU_PROJECT_REF
   ```

### Desplegar función

```bash
# Desplegar create-checkout
supabase functions deploy create-checkout

# Ver logs en tiempo real
supabase functions logs create-checkout --follow
```

### Variables de Entorno

Configurar secrets en Supabase Dashboard o via CLI:

```bash
# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# URLs de Supabase (automáticas)
# SUPABASE_URL
# SUPABASE_ANON_KEY
```

## 🧪 Testing Local

Para probar localmente:

```bash
# Iniciar Supabase local
supabase start

# Servir función localmente
supabase functions serve create-checkout --env-file ./supabase/.env.local

# Invocar desde otro terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"cartItems":[{"productId":1,"quantity":2,"customization":{},"selectedReason":null}]}'
```

## 📋 Funciones Disponibles

### create-checkout

**Endpoint:** `https://YOUR_PROJECT.supabase.co/functions/v1/create-checkout`

**Método:** POST

**Headers:**
- `Authorization: Bearer YOUR_ANON_KEY`
- `Content-Type: application/json`

**Body:**
```json
{
  "cartItems": [
    {
      "productId": 1,
      "productName": "Llavero Personalizado",
      "quantity": 2,
      "priceConfig": { "type": "fixed", "value": 5 },
      "customization": { "Nombre": "Juan", "Color": "Azul (+1€)" },
      "selectedReason": null
    }
  ]
}
```

**Response:**
```json
{
  "sessionId": "cs_test_..."
}
```

**Funcionalidades:**
- ✅ Cálculo dinámico de precios (fixed, byQuantity, byReason)
- ✅ Detección automática de extras en personalización (ej: "+2€")
- ✅ Cálculo de envío por peso volumétrico
- ✅ Metadatos completos para el webhook
- ✅ Validación de productos habilitados para Stripe

## 🔧 Desarrollo

### Añadir nueva función

```bash
# Crear nueva función
supabase functions new nombre-funcion

# Editar el archivo
# supabase/functions/nombre-funcion/index.ts

# Desplegar
supabase functions deploy nombre-funcion
```

### Logs y Debugging

```bash
# Ver logs
supabase functions logs create-checkout

# Ver logs en tiempo real
supabase functions logs create-checkout --follow

# Ver logs con más detalle
supabase functions logs create-checkout --limit 100
```

## 📝 Notas

- Las Edge Functions usan Deno runtime
- Timeout máximo: 60 segundos
- Memoria máxima: 128MB (puede aumentarse en plan Pro)
- TypeScript nativo soportado
