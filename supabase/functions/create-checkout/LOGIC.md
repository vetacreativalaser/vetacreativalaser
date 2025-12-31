# Lógica de create-checkout

## 🎯 Flujo General

```
1. Recibir cartItems del frontend
2. Validar datos
3. Consultar productos en DB
4. Para cada item:
   a. Calcular precio base (según tipo)
   b. Detectar y sumar extras de personalización
   c. Calcular peso
5. Calcular gastos de envío por peso total
6. Crear line_items de Stripe
7. Crear sesión con metadatos
8. Devolver sessionId
```

## 💰 Cálculo de Precios

### 1. Precio Base (calculateBaseUnitPrice)

Soporta 3 tipos de pricing:

#### a) Fixed Price
```json
{
  "type": "fixed",
  "value": 25.50
}
```
→ Precio fijo: **25.50€**

#### b) By Quantity (Tiered Pricing)
```json
{
  "type": "byQuantity",
  "tiers": [
    { "quantity": "1", "price": "3" },     // → { min: 1, max: 4, price: 3 }
    { "quantity": "5", "price": "2.5" },   // → { min: 5, max: 9, price: 2.5 }
    { "quantity": "+10", "price": "2" }    // → { min: 10, max: null, price: 2 }
  ]
}
```

**Normalización automática:**
- `quantity: "1"` → `min: 1, max: 4` (hasta antes del siguiente tier)
- `quantity: "+10"` → `min: 10, max: null` (último tier sin límite)

**Ejemplo:**
- Cantidad = 3 → Precio: **3€/ud**
- Cantidad = 7 → Precio: **2.5€/ud**
- Cantidad = 15 → Precio: **2€/ud**

#### c) By Reason
```json
{
  "type": "byReason",
  "base": "4",
  "reasons": [
    { "reason": "Boda", "increment": "2" },        // → { label: "Boda", price: 6 }
    { "reason": "Cumpleaños", "increment": "0" },  // → { label: "Cumpleaños", price: 4 }
    { "reason": "Empresa", "increment": "3" }      // → { label: "Empresa", price: 7 }
  ]
}
```

**Normalización automática:**
- `price = base + increment`
- Si no hay razón seleccionada → usa `base`

**Ejemplo:**
- selectedReason = "Boda" → Precio: **6€**
- selectedReason = "Cumpleaños" → Precio: **4€**
- selectedReason = null → Precio: **4€** (base)

### 2. Extras de Personalización (calculateCustomizationExtras)

Detecta patrones en los valores de customization:

```typescript
customization = {
  "Nombre": "Juan",                    // Sin extra
  "Color": "Azul (+1€)",              // Extra: +1€
  "Caja regalo": "Sí (+2.5€)",       // Extra: +2.5€
  "Grabado": "Texto largo (+3)"      // Extra: +3€
}
```

**Regex usado:** `/\(\+(\d+(?:\.\d+)?)\s*€?\)/`

**Resultado:**
- Extras totales: **1 + 2.5 + 3 = 6.5€**

### 3. Precio Final

```typescript
finalUnitPrice = basePrice + extrasTotal
```

**Ejemplo completo:**
```typescript
// Producto con precio byQuantity
priceConfig = {
  type: "byQuantity",
  tiers: [
    { quantity: "1", price: "10" },
    { quantity: "5", price: "8" }
  ]
}

// Compra de 6 unidades
quantity = 6
basePrice = 8€  // tier para 5-9 unidades

// Con personalización
customization = {
  "Nombre": "María",
  "Caja regalo": "Sí (+2€)"
}
extrasTotal = 2€

// Precio final
finalUnitPrice = 8 + 2 = 10€/ud
totalItem = 10€ × 6 = 60€
```

## 📦 Cálculo de Envío

### Lógica Actual (Simplificada)

```typescript
function calculateShippingCost(totalWeight: number): number {
  if (totalWeight < 2) {
    return 500; // 5€ en céntimos
  } else {
    return 800; // 8€ en céntimos
  }
}
```

### Peso Total

```typescript
totalWeight = Σ (product.weight × quantity)
```

**Ejemplo:**
```typescript
items = [
  { weight: 0.1, quantity: 5 },  // 0.5 kg
  { weight: 0.3, quantity: 2 },  // 0.6 kg
]

totalWeight = 0.5 + 0.6 = 1.1 kg
shippingCost = 5€  // < 2kg
```

### TODO: Lógica Avanzada

```typescript
// Futuro: añadir zonas
interface ShippingZone {
  name: string;
  weightRanges: {
    max: number;
    price: number;
  }[];
}

const zones = {
  peninsula: {
    ranges: [
      { max: 2, price: 5 },
      { max: 5, price: 8 },
      { max: 10, price: 12 }
    ]
  },
  baleares: {
    ranges: [
      { max: 2, price: 8 },
      { max: 5, price: 12 },
      { max: 10, price: 18 }
    ]
  },
  canarias: {
    ranges: [
      { max: 2, price: 15 },
      { max: 5, price: 25 },
      { max: 10, price: 40 }
    ]
  }
}
```

## 📝 Metadatos para Webhook

Los metadatos se guardan en `payment_intent_data.metadata`:

```typescript
metadata: {
  cartItemsCount: "3",
  totalWeight: "2.50",
  shippingCost: "8.00",
  items: JSON.stringify([
    {
      productId: 1,
      productName: "Llavero",
      quantity: 2,
      unitPrice: 12.5,  // Precio final con extras
      customization: {
        "Nombre": "Ana",
        "Color": "Rojo (+1€)"
      },
      selectedReason: null,
      basePrice: 11.5,
      extras: 1
    },
    // ...más items
  ])
}
```

**Uso en el Webhook:**
- Parsear `items` JSON
- Crear registros en `order_items` con toda la info
- Guardar customization para que el admin sepa qué grabar

## 🔍 Validaciones

### 1. Carrito Vacío
```typescript
if (!cartItems || cartItems.length === 0) {
  throw new Error('El carrito está vacío');
}
```

### 2. Productos No Encontrados
```typescript
const product = productsMap.get(cartItem.productId);
if (!product) {
  throw new Error(`Producto ${cartItem.productId} no encontrado`);
}
```

### 3. Producto No Habilitado para Stripe
```typescript
if (!product.stripe_enabled) {
  throw new Error(`Producto "${product.name}" no está disponible para compra online`);
}
```

## 🎨 Line Items de Stripe

Cada producto genera un line_item:

```typescript
{
  price_data: {
    currency: 'eur',
    product_data: {
      name: 'Llavero Personalizado',
      description: 'Motivo: Boda. Nombre: Juan, Color: Azul (+1€)',
      images: ['https://storage.supabase.co/...']
    },
    unit_amount: 1250  // 12.50€ en céntimos
  },
  quantity: 2
}
```

El envío se añade como un line_item adicional:

```typescript
{
  price_data: {
    currency: 'eur',
    product_data: {
      name: 'Gastos de envío',
      description: 'Envío calculado según peso total: 2.50 kg'
    },
    unit_amount: 800  // 8€ en céntimos
  },
  quantity: 1
}
```

## 🚀 Respuesta al Frontend

```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

El frontend usa este sessionId para redirigir con `stripe.redirectToCheckout()`.
