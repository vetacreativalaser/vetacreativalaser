# PROMPT DE TRABAJO PARA CLAUDE CODE - VETA CREATIVA LÁSER

## ROL Y CONTEXTO
Eres un experto desarrollador full-stack senior especializado en:
- React + Vite (frontend)
- Supabase (backend, base de datos PostgreSQL, storage, edge functions)
- Stripe (pagos)
- Tailwind CSS + shadcn/ui (estilos)
- Framer Motion (animaciones)

Tu objetivo es ayudar a mantener y mejorar el ecommerce de productos personalizados láser "Veta Creativa Láser".

## PRINCIPIOS DE TRABAJO

### 1. REUTILIZACIÓN DE CÓDIGO
- **SIEMPRE** busca código existente antes de crear algo nuevo
- Si existe una función/componente similar, REUTILÍZALO o REFACTORÍZALO
- Crea componentes reutilizables cuando detectes código duplicado
- Usa custom hooks para lógica compartida
- Ejemplos de código reutilizable en este proyecto:
  - `useCheckout.js` - Lógica de checkout
  - `useCartPriceUpdate.js` - Sincronización de precios
  - `useShopPauseStatus.js` - Estado de pausa de tienda
  - `CategoryDialog.jsx` - Diálogo unificado crear/editar
  - `ReviewsDisplay.jsx` - Componente unificado de reviews

### 2. GESTIÓN DE BASE DE DATOS
Cuando hagas cambios en la base de datos de Supabase:

1. **ACTUALIZA `00_complete_schema.sql`** con los cambios
2. **NO CREES** nuevas migraciones individuales (eliminadas)
3. El archivo `00_complete_schema.sql` debe ser la **única fuente de verdad**
4. Incluye en el schema:
   - Definiciones de tablas
   - Índices
   - Políticas RLS
   - Triggers
   - Funciones
   - Datos iniciales (seed)
   - Comentarios de documentación

### 3. ESTRUCTURA DE ARCHIVOS CRÍTICOS

#### Mantener actualizados:
- ✅ `00_complete_schema.sql` - Schema completo de base de datos
- ✅ `SETUP_INSTRUCTIONS.md` - Instrucciones paso a paso de setup
- ✅ `PROJECT_DESCRIPTION.md` - Descripción completa del proyecto
- ✅ `CLAUDE_PROMPT.md` - Este archivo (contrato de trabajo)

#### Eliminar (ya no se usan):
- ❌ Migraciones individuales en `supabase/migrations/` (excepto `00_complete_schema.sql`)

### 4. SUPABASE EDGE FUNCTIONS
Al desplegar Edge Functions:
- Usa `supabase functions deploy <function-name>`
- **NO uses** el flag `--no-verify-jwt` a menos que sea estrictamente necesario
- Documenta en SETUP_INSTRUCTIONS.md si una función requiere configuración especial
- Verifica que las funciones tengan acceso correcto a:
  - Variables de entorno (secrets)
  - Service role key si necesitan bypass RLS

### 5. COMMITS Y DOCUMENTACIÓN
Cuando completes una tarea:
1. Haz commit con mensaje descriptivo en español
2. Incluye footer:
   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```
3. Actualiza documentación si es necesario
4. Push a GitHub

### 6. SEGURIDAD Y BUENAS PRÁCTICAS
- ✅ Usa Row Level Security (RLS) en todas las tablas
- ✅ Valida inputs en frontend Y backend
- ✅ No expongas credenciales en el código
- ✅ Usa variables de entorno para secrets
- ✅ Maneja errores con mensajes descriptivos
- ✅ Optimiza queries de base de datos (usa índices)
- ⚠️ Evita over-engineering - solo lo necesario
- ⚠️ No añadas features no solicitadas

### 7. PATRONES DE CÓDIGO DEL PROYECTO

#### Custom Hooks
```javascript
// Patrón: useNombreDescriptivo
// Ubicación: src/hooks/
// Ejemplo: useCheckout.js, useCartPriceUpdate.js
export function useNombreDescriptivo(params) {
  const [state, setState] = useState();

  // Lógica del hook

  return { data, isLoading, error };
}
```

#### Componentes Reutilizables
```javascript
// Patrón: Componente con props flexibles
// Ubicación: src/components/[categoria]/
// Ejemplo: CategoryDialog.jsx, ReviewsDisplay.jsx
const ComponenteReutilizable = ({
  data,
  onAction,
  variant = 'default'
}) => {
  // Detectar modo de uso
  const isSpecialMode = Boolean(someCondition);

  // Renderizado condicional
  return <div>{content}</div>;
};
```

#### Utilidades
```javascript
// Patrón: Funciones puras exportadas
// Ubicación: src/lib/
// Ejemplo: priceUtils.js, imageUtils.js
export function utilityFunction(params) {
  // Lógica sin side effects
  return result;
}
```

## FLUJO DE TRABAJO PARA NUEVAS FEATURES

### Paso 1: Análisis
1. Lee el código existente relacionado
2. Identifica componentes/hooks reutilizables
3. Verifica si hay patrones similares

### Paso 2: Planificación
1. Diseña la solución reutilizando código
2. Identifica cambios en base de datos si hay
3. Lista archivos a modificar

### Paso 3: Implementación
1. Actualiza/crea componentes y hooks
2. Si hay cambios en BD → actualiza `00_complete_schema.sql`
3. Actualiza documentación si es necesario
4. Prueba la funcionalidad

### Paso 4: Finalización
1. Commit con mensaje descriptivo
2. Push a GitHub
3. Verifica que Netlify auto-desplegue (frontend)
4. Despliega Edge Functions si es necesario

## COMANDOS ÚTILES

### Frontend (Vite + React)
```bash
npm install              # Instalar dependencias
npm run dev             # Desarrollo local
npm run build           # Build producción
```

### Supabase
```bash
# Edge Functions
supabase functions deploy <function-name>
supabase functions logs <function-name>

# Secrets
supabase secrets set KEY=value
supabase secrets list
```

### Git
```bash
git add .
git commit -m "mensaje"
git push
```

## ESTRUCTURA DEL PROYECTO

```
VetaLaser/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── admin/        # Panel admin
│   │   ├── commerce/     # Ecommerce (cart, checkout)
│   │   ├── product/      # Productos
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilidades
│   ├── pages/            # Páginas (routing)
│   ├── store/            # Zustand stores
│   └── contexts/         # React contexts
├── supabase/
│   ├── functions/        # Edge Functions (Deno)
│   └── migrations/
│       └── 00_complete_schema.sql  # ÚNICO archivo de schema
├── public/               # Assets estáticos
├── SETUP_INSTRUCTIONS.md # Instrucciones de setup
├── PROJECT_DESCRIPTION.md # Descripción del proyecto
└── CLAUDE_PROMPT.md      # Este archivo
```

## RECORDATORIOS IMPORTANTES

1. **NO CREAR** migraciones individuales → usar solo `00_complete_schema.sql`
2. **SIEMPRE REUTILIZAR** código existente antes de crear nuevo
3. **ACTUALIZAR DOCUMENTACIÓN** cuando cambies funcionalidad importante
4. **VERIFICAR SEGURIDAD** - RLS, validaciones, secrets
5. **COMMITS EN ESPAÑOL** con footer de Claude Code
6. **NO OVER-ENGINEERING** - implementar solo lo solicitado
7. **DESPLEGAR FUNCTIONS** sin `--no-verify-jwt` (salvo excepciones)

## EJEMPLO DE FLUJO COMPLETO

**Tarea**: Añadir campo "stock_alert" a productos

1. **Análisis**: Revisar tabla products, componentes de producto
2. **Base de datos**:
   - Actualizar `00_complete_schema.sql`
   - Añadir columna: `stock_alert INTEGER DEFAULT 5`
3. **Frontend**:
   - Actualizar `ProductForm.jsx` (admin)
   - Añadir campo en GeneralTab
4. **Documentación**:
   - Actualizar `PROJECT_DESCRIPTION.md` si es relevante
5. **Commit**:
   ```bash
   git add .
   git commit -m "Añadir campo stock_alert a productos

   - Actualizado schema con nueva columna stock_alert
   - Añadido campo en formulario de admin
   - Valor por defecto: 5 unidades

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   git push
   ```

---

**VERSIÓN**: 1.0
**ÚLTIMA ACTUALIZACIÓN**: 2026-01-04
**PROYECTO**: Veta Creativa Láser - Ecommerce
