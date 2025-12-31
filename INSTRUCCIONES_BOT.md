# PROTOCOLO DE DESARROLLO: VETA CREATIVA LÁSER 2.2

## 1. MISIÓN DEL PROYECTO
Consolidar el E-commerce de productos personalizados con una arquitectura robusta.
**Estado Actual:** Frontend del cliente (Carrito, Store, Customizer) funcional. Backend (Edge Functions) en despliegue.
**Foco Inmediato:** Gestión avanzada de productos (Admin Dashboard) y finalización del flujo de pagos (Stripe).

## 2. ARQUITECTURA TÉCNICA
### Stack Tecnológico
- **Frontend:** React 18, Vite, TailwindCSS, Shadcn UI (`src/components/ui`).
- **Estado:** Zustand (`useCartStore` implementado con persistencia).
- **Backend:** Supabase (Auth, DB, Storage).
- **Serverless:** Supabase Edge Functions (`create-checkout` desplegada).
- **Pagos:** Stripe (Checkout Session Mode).

### Estructura de Directorios (Admin)
src/
└── components/
    └── admin/
        └── products/
            ├── ProductForm.jsx  # Formulario Maestro (Modal)
            ├── ProductTable.jsx # Listado con filtros y paginación
            └── tabs/            # Pestañas modulares
                ├── GeneralTab.jsx
                ├── PricingTab.jsx
                ├── CustomizationTab.jsx
                ├── ImagesTab.jsx
                └── SeoRelTab.jsx

## 3. MODELO DE DATOS Y FUNCIONALIDADES DE PRODUCTO

El sistema de productos debe soportar las siguientes especificaciones detalladas:

### A. Información Básica y SEO
- **`sku`**: Generación automática si no existe, único.
- **`description`**: Soporte para texto enriquecido (Textarea grande).
- **`status`**: 'active' (visible), 'draft' (borrador), 'archived'.
- **`is_featured`**: Boolean para destacar en Home.
- **`slug`**: Generación automática desde título, pero editable manualmente.
- **`seo_title` / `seo_description`**: Campos específicos para meta tags.

### B. Modos de Compra (`purchase_mode`)
El producto debe comportarse de 3 formas distintas:
1.  **Standard:** Flujo normal (Personalizar -> Carrito -> Pagar).
2.  **Contact Only:** Sin precio ni carrito. Botón de "Consultar" o "Pedir Presupuesto".
3.  **Buy & Clarify:** Se paga el precio base, pero los detalles de diseño se acuerdan por WhatsApp/Email post-compra.

### C. Estrategia de Precios (`price` JSONB)
**REGLA CRÍTICA:** Se debe RESPETAR la estructura JSON existente:
- **Fijo:** `{ type: 'fixed', value: 15.00 }`
- **Por Cantidad:** `{ type: 'byQuantity', tiers: [{ quantity: 10, price: 12.00 }] }`
- **Por Motivos (Láser):** `{ type: 'byReason', base: 10.00, reasons: [{ reason: 'Logo', increment: 5 }] }`
- **Dimensiones:** Campos `weight`, `length`, `width`, `height` para cálculo de envíos.

### D. Sistema de Personalización (`custom_fields` JSONB)
El Admin debe poder construir el formulario que verá el cliente:
- **Tipos de Campo:** Texto (corto/largo), Selector/Dropdown, Archivo (imágenes/vectores), Booleano.
- **Configuración:** Label, Placeholder, Required, **Coste Extra** (se suma al precio base).

### E. Gestión de Imágenes Avanzada (`images` JSONB)
- **Subida Múltiple:** Drag & drop.
- **Recorte (Crop):** Integración obligatoria de `react-easy-crop`. Al subir, se abre modal para recortar (1:1 o 4:3).
- **Ordenación:** Poder elegir cuál es la imagen principal (portada).
- **Estructura:** Array unificado `[{ id, url, alt, text, position }]`.

### F. Productos Relacionados
- Buscador para seleccionar otros productos por nombre/SKU y vincularlos (Cross-selling).

## 4. PLAN DE EJECUCIÓN (ROADMAP)

### ✅ FASE 1: Core del Cliente (COMPLETADA)
- `useCartStore`, `ProductCustomizer`, `priceUtils`.

### 🚧 FASE 2: Gestión de Catálogo (Admin Dashboard) **(TAREA ACTUAL)**
**Objetivo:** Crear el CRUD completo de productos con las especificaciones de arriba.

1.  **Base de Datos:**
    - Ejecutar script SQL para añadir columnas nuevas (`images`, `seo_*`, `purchase_mode`, `slug`, `dimensions`).
    - **NO** alterar la columna `price` existente.

2.  **ProductForm (Componente):**
    - Implementar Modal con `Tabs`.
    - **GeneralTab:** Datos básicos + Selector visual de `purchase_mode`.
    - **PricingTab:** Lógica para alternar entre Precio Fijo/Calculadora y gestionar Tiers.
    - **CustomizationTab:** Builder visual (Añadir campo -> Definir tipo/coste).
    - **ImagesTab:** Implementar Dropzone + Modal de Crop + Subida a Supabase.
    - **SeoRelTab:** Campos SEO y buscador de productos relacionados.

3.  **ProductTable (Listado):**
    - Tabla con búsqueda por nombre/SKU y filtros por categoría/estado.

### 🔮 FASE 3: Infraestructura de Pagos (Backend)
- Conectar `create-checkout` con el frontend.
- Webhook de Stripe.

### 🔭 FASE 4: Post-Venta
- Historial de pedidos y Reseñas verificadas.
