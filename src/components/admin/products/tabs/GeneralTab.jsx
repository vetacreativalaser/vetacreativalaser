import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { Package, ShoppingCart, MessageCircle, AlertCircle } from 'lucide-react';

/**
 * GeneralTab - Información básica del producto
 *
 * Campos:
 * - Nombre, SKU, Categoría
 * - Descripción
 * - Estado (active, draft, archived)
 * - is_featured (destacado)
 * - purchase_mode (standard, contact_only, buy_and_clarify)
 */
const GeneralTab = ({ formData, updateField }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Cargar categorías desde Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, categoria, title')
          .order('categoria', { ascending: true });

        if (error) throw error;

        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Opciones de Purchase Mode
  const purchaseModes = [
    {
      value: 'standard',
      label: 'Estándar',
      description: 'Flujo normal: Personalizar → Carrito → Pagar',
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      value: 'contact_only',
      label: 'Solo Consulta',
      description: 'Precio visible (referencia). Botón "Contactar"',
      icon: MessageCircle,
      color: 'text-blue-600'
    },
    {
      value: 'buy_and_clarify',
      label: 'Comprar y Aclarar',
      description: 'Pago inmediato + detalles post-compra',
      icon: AlertCircle,
      color: 'text-orange-600'
    }
  ];

  const selectedMode = purchaseModes.find(m => m.value === formData.purchase_mode) || purchaseModes[0];

  return (
    <div className="space-y-6">
      {/* Nombre y SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nombre del Producto <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ej: Llavero personalizado madera"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku" className="text-sm font-medium">
            SKU (Código único)
          </Label>
          <Input
            id="sku"
            placeholder="Se genera automáticamente si vacío"
            value={formData.sku}
            onChange={(e) => updateField('sku', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Deja vacío para generar automáticamente
          </p>
        </div>
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          Categoría <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => updateField('category_id', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {loadingCategories ? (
              <SelectItem value="loading" disabled>
                Cargando categorías...
              </SelectItem>
            ) : categories.length === 0 ? (
              <SelectItem value="empty" disabled>
                No hay categorías disponibles
              </SelectItem>
            ) : (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.title || cat.categoria}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descripción del Producto
        </Label>
        <Textarea
          id="description"
          placeholder="Describe las características, materiales, usos, etc."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={5}
          className="w-full resize-none"
        />
        <p className="text-xs text-gray-500">
          Soporte para texto enriquecido. Describe el producto en detalle.
        </p>
      </div>

      {/* Estado y Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">
            Estado
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField('status', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Activo (visible en tienda)
                </span>
              </SelectItem>
              <SelectItem value="draft">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  Borrador
                </span>
              </SelectItem>
              <SelectItem value="archived">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                  Archivado
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_featured" className="text-sm font-medium">
            Destacar en Home
          </Label>
          <Select
            value={formData.is_featured ? 'yes' : 'no'}
            onValueChange={(value) => updateField('is_featured', value === 'yes')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No destacado</SelectItem>
              <SelectItem value="yes">
                <span className="flex items-center">
                  <Package className="mr-2 h-4 w-4 text-yellow-500" />
                  Destacado (aparece en Home)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Purchase Mode - Selector Visual */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Modo de Compra <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Define cómo los clientes pueden adquirir este producto
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {purchaseModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = formData.purchase_mode === mode.value;

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => updateField('purchase_mode', mode.value)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${isSelected
                    ? 'border-black bg-gray-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? mode.color : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${isSelected ? 'text-black' : 'text-gray-700'}`}>
                      {mode.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {mode.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Aviso según el modo seleccionado */}
        <div className={`p-3 rounded-md border ${selectedMode.color.replace('text-', 'border-')} bg-gray-50`}>
          <div className="flex items-start gap-2">
            <selectedMode.icon className={`h-4 w-4 mt-0.5 ${selectedMode.color}`} />
            <p className="text-xs text-gray-700">
              {formData.purchase_mode === 'standard' && (
                <>Flujo estándar de e-commerce. El cliente puede personalizar, añadir al carrito y pagar.</>
              )}
              {formData.purchase_mode === 'contact_only' && (
                <>El precio se muestra como referencia, pero el botón de acción es "Contactar" en lugar de "Añadir al carrito".</>
              )}
              {formData.purchase_mode === 'buy_and_clarify' && (
                <>El cliente paga el precio base inmediatamente. Los detalles de diseño se acuerdan después por WhatsApp/Email.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
