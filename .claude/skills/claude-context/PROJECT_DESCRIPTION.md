# VETA CREATIVA LÁSER - DESCRIPCIÓN DEL PROYECTO

## VISIÓN GENERAL

**Veta Creativa Láser** es una plataforma ecommerce completa para la venta de productos personalizados en madera cortados con láser. El proyecto combina una experiencia de usuario moderna con un panel de administración robusto, sistema de pagos integrado con Stripe, y gestión completa de pedidos.

---

## STACK TECNOLÓGICO

### Frontend
- **React 18** - Librería UI principal
- **Vite** - Build tool y dev server (ultra rápido)
- **React Router v6** - Enrutamiento SPA
- **Tailwind CSS** - Framework de estilos utility-first
- **shadcn/ui** - Componentes UI accesibles y personalizables
- **Framer Motion** - Animaciones fluidas
- **Zustand** - State management ligero
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de schemas

### Backend & Servicios
- **Supabase** - Backend as a Service
  - PostgreSQL (base de datos)
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Storage (almacenamiento de archivos)
  - Auth (autenticación)
- **Stripe** - Procesamiento de pagos
- **Netlify** - Hosting y CI/CD

---

## ARQUITECTURA DEL PROYECTO

```
VetaLaser/
├── src/
│   ├── components/          # Componentes React
│   │   ├── admin/          # Panel de administración
│   │   ├── commerce/       # Ecommerce (carrito, checkout)
│   │   ├── product/        # Productos y categorías
│   │   ├── profile/        # Perfil de usuario
│   │   ├── reviews/        # Sistema de reseñas
│   │   └── ui/             # Componentes UI base (shadcn)
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Utilidades y helpers
│   ├── pages/              # Páginas principales (routing)
│   ├── store/              # Zustand stores
│   ├── contexts/           # React Contexts
│   └── main.jsx            # Entry point
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   └── migrations/
│       └── 00_complete_schema.sql  # Schema completo BD
├── public/                 # Assets estáticos
├── index.html              # HTML base
├── vite.config.js          # Configuración Vite
└── tailwind.config.js      # Configuración Tailwind
```

---

## FUNCIONALIDADES PRINCIPALES

### 🛍️ ECOMMERCE (Usuario)

#### Catálogo de Productos
- Navegación por categorías
- Sistema de búsqueda con autocomplete
- Filtrado de productos activos
- Visualización de productos con imágenes en carrusel
- Precios: fijos, por unidad, por área (cm²)
- Modo de compra: estándar, solo contacto, deshabilitado

#### Personalización de Productos
- Campos personalizables por producto (texto, número, selección)
- Validación de campos requeridos
- Opciones con precios adicionales
- Vista previa de personalización

#### Sistema de Carrito
- Añadir/eliminar productos
- Actualización de cantidad
- Cálculo automático de precios
- Persistencia en localStorage
- Drawer lateral animado
- Página completa de carrito

#### Checkout y Pagos
- Integración completa con Stripe Checkout
- Cálculo de gastos de envío por peso
- Creación de sesión de pago segura
- Webhook de confirmación de pago
- Generación automática de número de pedido

#### Cuenta de Usuario
- Registro y login (Supabase Auth)
- Perfil editable (nombre, dirección, teléfono)
- Historial de pedidos
- Sistema de favoritos
- Sistema de reseñas con imágenes
- Puntos por compra (futuro)

#### Características Adicionales
- Reset de contraseña por email
- Búsqueda de productos (texto completo)
- Productos relacionados (cross-selling)
- Banner principal animado
- SEO optimizado por producto

### 🔧 PANEL DE ADMINISTRACIÓN

#### Gestión de Productos
- CRUD completo de productos
- Editor visual de imágenes (crop + compress)
- Gestión de especificaciones (JSONB)
- Campos personalizables dinámicos
- SEO por producto (title, description, slug)
- Productos relacionados
- Estados: activo, borrador, archivado

#### Gestión de Categorías
- CRUD de categorías
- Imagen de categoría
- Slug y filtros automáticos

#### Gestión de Pedidos
- Visualización de todos los pedidos
- Filtrado por estado (pending, processing, completed, etc.)
- Detalles completos de pedido
- Información de cliente
- Items del pedido con personalizaciones
- Estado de pago (Stripe)

#### Gestión de Reseñas
- Visualización de reseñas
- Eliminación de reseñas
- Moderación de imágenes

#### Configuración de Tienda
- Pausar/reanudar compras online
- Mensaje personalizable de pausa
- Actualización en tiempo real (Supabase Realtime)

#### Panel de Estadísticas (Futuro)
- Ventas totales
- Productos más vendidos
- Usuarios registrados
- Gráficas de analytics

### 🔐 SEGURIDAD

#### Row Level Security (RLS)
Políticas implementadas por tabla:

**categorias**:
- Lectura pública
- Modificación solo admin

**products**:
- Lectura pública
- Modificación solo admin

**profiles**:
- Usuarios leen su perfil
- Admin lee todos los perfiles

**favorites**:
- Usuario gestiona sus favoritos

**reviews**:
- Lectura pública
- Usuario gestiona sus reseñas
- Admin puede eliminar cualquiera

**orders**:
- Usuario ve sus pedidos
- Admin ve todos
- Service role gestiona (para webhooks)

**app_config**:
- Lectura pública
- Modificación usuarios autenticados (⚠️ mejorar en futuro)

#### Validaciones
- Frontend: React Hook Form + Zod
- Backend: Supabase RLS + validaciones en Edge Functions
- Stripe: Webhook signatures verificadas

---

## MODELOS DE DATOS

### Tabla: **categorias**
```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- categoria (TEXT, UNIQUE) -- slug interno
- filter (TEXT) -- filtro para búsquedas
- image_url (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### Tabla: **products**
```sql
- id (UUID, PK)
- name (TEXT)
- slug (TEXT, UNIQUE) -- URL amigable
- full_description (TEXT)
- brief_description (TEXT)
- specifications (JSONB) -- [{name, value}]
- custom_fields (JSONB) -- [{name, type, required, options, price}]
- category_id (UUID FK → categorias)
- images (JSONB) -- [{url, alt}]
- image_urls (JSONB) -- Array URLs (legacy)
- image_alts (JSONB) -- Array alts (legacy)
- price (JSONB) -- {type, value, unit}
- purchase_mode (TEXT) -- standard | contact | disabled
- status (TEXT) -- active | draft | archived
- shipping_weight (DECIMAL) -- Peso en kg
- related_products (UUID[]) -- IDs de productos relacionados
- seo_title, seo_description (TEXT)
- stripe_product_id, stripe_price_id (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

### Tabla: **profiles**
```sql
- id (UUID, PK FK → auth.users)
- full_name (TEXT)
- phone (TEXT)
- address, city, postal_code, country (TEXT)
- points (INTEGER) -- Sistema de puntos
- created_at, updated_at (TIMESTAMPTZ)
```

### Tabla: **favorites**
```sql
- id (UUID, PK)
- user_id (UUID FK → auth.users)
- product_id (UUID FK → products)
- created_at (TIMESTAMPTZ)
- UNIQUE(user_id, product_id)
```

### Tabla: **reviews**
```sql
- id (UUID, PK)
- product_id (UUID FK → products)
- user_id (UUID FK → auth.users)
- rating (INTEGER 1-5)
- comment (TEXT)
- image_urls (JSONB) -- Array de URLs
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(product_id, user_id)
```

### Tabla: **orders**
```sql
- id (UUID, PK)
- order_number (TEXT, UNIQUE) -- VL-YYYYMMDD-XXXX
- user_id (UUID FK → auth.users)
- user_email, user_name, user_phone, user_address (TEXT)
- stripe_session_id (TEXT, UNIQUE)
- stripe_payment_intent_id (TEXT)
- status (TEXT) -- pending | processing | completed | cancelled | refunded
- total_amount (DECIMAL)
- currency (TEXT)
- items (JSONB) -- [{productId, name, quantity, price, customization}]
- shipping_address, billing_address (JSONB)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

### Tabla: **password_reset_tokens**
```sql
- id (UUID, PK)
- token (TEXT, UNIQUE)
- email (TEXT)
- used (BOOLEAN)
- expires_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

### Tabla: **app_config**
```sql
- key (TEXT, PK)
- value (JSONB)
- created_at, updated_at (TIMESTAMPTZ)

Configuraciones actuales:
- site_name
- contact_email
- points_per_euro
- free_shipping_threshold
- shop_paused (true/false)
- shop_pause_message
```

---

## EDGE FUNCTIONS (Supabase)

### create-checkout
**Endpoint**: `/functions/v1/create-checkout`
**Método**: POST
**Auth**: Requerido (JWT)

**Funcionalidad**:
1. Recibe items del carrito
2. Verifica que tienda no esté pausada
3. Calcula precios desde BD (no confía en frontend)
4. Calcula shipping por peso
5. Crea productos en Stripe (si no existen)
6. Crea sesión de Stripe Checkout
7. Retorna URL de pago

**Parámetros**:
```javascript
{
  cartItems: [{
    productId: UUID,
    productName: string,
    quantity: number,
    priceConfig: {type, value, unit?},
    customization: {...},
    selectedReason: string?
  }]
}
```

**Respuesta**:
```javascript
{
  url: string, // URL de Stripe Checkout
  sessionId: string
}
```

### stripe-webhook
**Endpoint**: `/functions/v1/stripe-webhook`
**Método**: POST
**Auth**: Webhook signature

**Funcionalidad**:
1. Verifica firma del webhook
2. Procesa evento `checkout.session.completed`
3. Crea orden en base de datos
4. Genera número de pedido
5. Asocia con usuario si está logueado

**Eventos escuchados**:
- `checkout.session.completed`

---

## CUSTOM HOOKS

### useCheckout
**Ubicación**: `src/hooks/useCheckout.js`
**Uso**: Maneja el proceso de checkout

```javascript
const { handleCheckout, isProcessing } = useCheckout(items);
```

### useCartPriceUpdate
**Ubicación**: `src/hooks/useCartPriceUpdate.js`
**Uso**: Sincroniza precios del carrito con BD

```javascript
useCartPriceUpdate(items, updateItemPrice);
```

### useShopPauseStatus
**Ubicación**: `src/hooks/useShopPauseStatus.js`
**Uso**: Verifica si la tienda está pausada

```javascript
const { isPaused, pauseMessage, isLoading } = useShopPauseStatus();
```

### useImageCropCompress
**Ubicación**: `src/hooks/useImageCropCompress.js`
**Uso**: Crop y compresión de imágenes

```javascript
const {
  imageSrc, setImageSrc,
  zoom, setZoom,
  crop, setCrop,
  croppedAreaPixels,
  onCropComplete,
  uploadImage
} = useImageCropCompress();
```

### useCartPriceUpdate
**Ubicación**: `src/hooks/useCartPriceUpdate.js`
**Uso**: Actualiza precios del carrito desde BD

---

## COMPONENTES REUTILIZABLES

### CategoryDialog
**Ubicación**: `src/components/product/CategoryDialog.jsx`
**Uso**: Crear y editar categorías (componente unificado)

```javascript
<CategoryDialog
  isOpen={isOpen}
  setIsOpen={setIsOpen}
  category={category} // null para crear, objeto para editar
  onSuccess={handleSuccess}
/>
```

### ReviewsDisplay
**Ubicación**: `src/components/reviews/ReviewsDisplay.jsx`
**Uso**: Mostrar reviews (perfil y producto)

```javascript
<ReviewsDisplay
  reviews={reviews}
  currentUser={user}
  refreshReviews={refresh}
  showProductLink={true}
  userNamesMap={namesMap}
  emptyMessage="Sin reseñas"
/>
```

---

## FLUJO DE DATOS

### Flujo de Compra
```
1. Usuario añade producto al carrito (localStorage)
   ↓
2. Va a checkout → clic "Tramitar Pedido"
   ↓
3. Frontend → Edge Function create-checkout
   ↓
4. Edge Function:
   - Verifica precios en BD
   - Calcula shipping
   - Crea sesión Stripe
   ↓
5. Usuario redirigido a Stripe Checkout
   ↓
6. Usuario paga
   ↓
7. Stripe → Webhook → Edge Function stripe-webhook
   ↓
8. Edge Function crea orden en BD
   ↓
9. Usuario redirigido a /success
```

### Flujo de Autenticación
```
1. Usuario hace login/register
   ↓
2. Supabase Auth valida
   ↓
3. Se crea perfil en tabla profiles (trigger)
   ↓
4. JWT almacenado en localStorage
   ↓
5. RLS policies aplican automáticamente
```

---

## OPTIMIZACIONES

### Performance
- ✅ Lazy loading de imágenes
- ✅ Code splitting con React.lazy
- ✅ Compresión de imágenes (webp, max 0.2MB)
- ✅ Índices en BD para queries frecuentes
- ✅ Debounce en búsqueda (300ms)
- ✅ Persistencia de carrito (localStorage)
- ✅ Preload de logo principal

### SEO
- ✅ Meta tags dinámicos por producto
- ✅ URLs amigables (slugs)
- ✅ Sitemap (futuro)
- ✅ Open Graph tags
- ✅ Schema.org markup (futuro)

### UX
- ✅ Animaciones Framer Motion
- ✅ Loading states
- ✅ Error boundaries
- ✅ Toast notifications
- ✅ Responsive design (mobile-first)
- ✅ Accesibilidad (ARIA labels)

---

## ROADMAP / FUTURAS MEJORAS

### Corto Plazo
- [ ] Dashboard de analytics
- [ ] Sistema de puntos funcional
- [ ] Cupones de descuento
- [ ] Wishlist pública compartible
- [ ] Chat de soporte

### Medio Plazo
- [ ] Notificaciones por email (pedidos, reseñas)
- [ ] Sistema de afiliados
- [ ] Comparador de productos
- [ ] Recomendaciones personalizadas
- [ ] Multi-idioma (i18n)

### Largo Plazo
- [ ] App móvil (React Native)
- [ ] AR preview de productos
- [ ] Suscripciones mensuales
- [ ] Marketplace de diseñadores
- [ ] API pública

---

## MÉTRICAS Y KPIs

### Técnicas
- Tiempo de carga: < 2s
- Core Web Vitals: Bueno
- Lighthouse Score: 90+
- Uptime: 99.9%

### Negocio
- Tasa de conversión: tracking en Stripe
- Valor promedio de pedido: calculado en orders
- Productos más vendidos: analytics futuro
- Reviews promedio: calculado por producto

---

## CONTACTO Y SOPORTE

**Email**: vetacreativalaser@gmail.com
**GitHub**: https://github.com/vetacreativalaser/vetacreativalaser
**Admin**: vetacreativalaser@gmail.com

---

**ÚLTIMA ACTUALIZACIÓN**: 2026-01-04
**VERSIÓN**: 1.0
**AUTOR**: Desarrollado con Claude Code (Sonnet 4.5)
