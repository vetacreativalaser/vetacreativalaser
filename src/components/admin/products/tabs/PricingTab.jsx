import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2, DollarSign, Package, TrendingUp, Truck } from 'lucide-react';

/**
 * PricingTab - Gestión de precios y dimensiones
 *
 * Características:
 * - Mantiene estructura JSONB de price existente
 * - Tres modos: Fixed, byQuantity, byReason
 * - Dimensiones para cálculo de envíos (weight, length, width, height)
 * - Preview visual del precio calculado
 */
const PricingTab = ({ formData, updateField }) => {
  // Asegurar que siempre haya un precio inicializado
  React.useEffect(() => {
    if (!formData.price || !formData.price.type) {
      updateField('price', { type: 'fixed', value: 0 });
    }
  }, []);

  const priceType = formData.price?.type || 'fixed';

  // Actualizar tipo de precio
  const handlePriceTypeChange = (newType) => {
    let newPriceConfig;

    switch (newType) {
      case 'fixed':
        newPriceConfig = { type: 'fixed', value: 0 };
        break;
      case 'byQuantity':
        newPriceConfig = {
          type: 'byQuantity',
          tiers: [{ min: 1, max: null, price: 0 }]
        };
        break;
      case 'byReason':
        newPriceConfig = {
          type: 'byReason',
          base: 0,
          selectorLabel: 'Selecciona una opción', // Título personalizable
          reasons: [{ reason: '', increment: 0 }]
        };
        break;
      default:
        newPriceConfig = { type: 'fixed', value: 0 };
    }

    updateField('price', newPriceConfig);
  };

  // Actualizar precio fijo
  const handleFixedPriceChange = (value) => {
    updateField('price', {
      ...formData.price,
      value: parseFloat(value) || 0
    });
  };

  // Añadir tier de cantidad
  const addQuantityTier = () => {
    const currentTiers = formData.price.tiers || [];
    const lastTier = currentTiers[currentTiers.length - 1];

    // Calcular min basado en el último tier
    const newMin = lastTier ? (lastTier.max || lastTier.min) + 1 : 1;

    updateField('price', {
      ...formData.price,
      tiers: [
        ...currentTiers,
        { min: newMin, max: null, price: 0 }
      ]
    });
  };

  // Actualizar tier específico
  const updateTier = (index, field, value) => {
    const updatedTiers = [...formData.price.tiers];
    updatedTiers[index] = {
      ...updatedTiers[index],
      [field]: field === 'price' ? parseFloat(value) || 0 : (value === '' ? null : parseInt(value))
    };

    updateField('price', {
      ...formData.price,
      tiers: updatedTiers
    });
  };

  // Eliminar tier
  const removeTier = (index) => {
    updateField('price', {
      ...formData.price,
      tiers: formData.price.tiers.filter((_, i) => i !== index)
    });
  };

  // Añadir motivo/razón
  const addReason = () => {
    updateField('price', {
      ...formData.price,
      reasons: [
        ...(formData.price.reasons || []),
        { reason: '', increment: 0 }
      ]
    });
  };

  // Actualizar motivo específico
  const updateReason = (index, field, value) => {
    const updatedReasons = [...formData.price.reasons];
    updatedReasons[index] = {
      ...updatedReasons[index],
      [field]: field === 'increment' ? parseFloat(value) || 0 : value
    };

    updateField('price', {
      ...formData.price,
      reasons: updatedReasons
    });
  };

  // Eliminar motivo
  const removeReason = (index) => {
    updateField('price', {
      ...formData.price,
      reasons: formData.price.reasons.filter((_, i) => i !== index)
    });
  };

  // Actualizar precio base para byReason
  const handleBasePriceChange = (value) => {
    updateField('price', {
      ...formData.price,
      base: parseFloat(value) || 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Precio */}
      <div className="space-y-2">
        <Label htmlFor="price-type" className="text-sm font-medium">
          Estrategia de Precios <span className="text-red-500">*</span>
        </Label>
        <Select value={priceType} onValueChange={handlePriceTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                Precio Fijo
              </div>
            </SelectItem>
            <SelectItem value="byQuantity">
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-blue-600" />
                Por Cantidad (Escalas)
              </div>
            </SelectItem>
            <SelectItem value="byReason">
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4 text-purple-600" />
                Por Motivos (Láser)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* PRECIO FIJO */}
      {priceType === 'fixed' && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-2">
            <Label htmlFor="fixed-price" className="text-sm font-medium">
              Precio Fijo (€)
            </Label>
            <Input
              id="fixed-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price.value || ''}
              onChange={(e) => handleFixedPriceChange(e.target.value)}
              className="text-lg font-semibold"
            />
            <p className="text-xs text-gray-500">
              Precio único para todas las cantidades
            </p>
          </div>
        </div>
      )}

      {/* PRECIO POR CANTIDAD */}
      {priceType === 'byQuantity' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              Define rangos de cantidad con precios escalonados. El precio unitario disminuye al comprar más unidades.
            </p>
          </div>

          <div className="space-y-3">
            {formData.price.tiers?.map((tier, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Min. Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={tier.min || ''}
                      onChange={(e) => updateTier(index, 'min', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Máx. Cantidad</Label>
                    <Input
                      type="number"
                      min={tier.min || 1}
                      placeholder="Ilimitado"
                      value={tier.max || ''}
                      onChange={(e) => updateTier(index, 'max', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Precio/Unidad (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={tier.price || ''}
                      onChange={(e) => updateTier(index, 'price', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTier(index)}
                  disabled={formData.price.tiers.length === 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addQuantityTier}
            className="w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Rango
          </Button>
        </div>
      )}

      {/* PRECIO POR MOTIVOS */}
      {priceType === 'byReason' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
            <p className="text-xs text-purple-800">
              Define un precio base y añade incrementos según el motivo del grabado láser.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-price" className="text-sm font-medium">
              Precio Base (€)
            </Label>
            <Input
              id="base-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price.base || ''}
              onChange={(e) => handleBasePriceChange(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="selector-label" className="text-sm font-medium">
              Título del Selector (Ej: "Tamaño", "Extras", "Acabado")
            </Label>
            <Input
              id="selector-label"
              type="text"
              placeholder="Selecciona una opción"
              value={formData.price.selectorLabel || ''}
              onChange={(e) => updateField('price', { ...formData.price, selectorLabel: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Este texto aparecerá como título del selector en la página del producto
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Opciones de Incremento</Label>
            {formData.price.reasons?.map((reason, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Motivo</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Logo, Nombre, Fecha"
                      value={reason.reason || ''}
                      onChange={(e) => updateReason(index, 'reason', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Incremento (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={reason.increment || ''}
                      onChange={(e) => updateReason(index, 'increment', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeReason(index)}
                  disabled={formData.price.reasons.length === 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addReason}
            className="w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Motivo
          </Button>
        </div>
      )}

      {/* COMPRA ONLINE Y STRIPE */}
      <div className="pt-6 border-t border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Compra Online
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="online-purchase" className="text-sm text-gray-600">
                Permitir compra online
              </Label>
              <Switch
                id="online-purchase"
                checked={formData.purchase_mode === 'standard'}
                onCheckedChange={(checked) => updateField('purchase_mode', checked ? 'standard' : 'contact_only')}
              />
            </div>
          </div>

          {formData.purchase_mode === 'standard' && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <p className="text-xs text-gray-600">
                Configura las dimensiones y peso para el cálculo automático de costes de envío con Correos.
              </p>

              {/* Dimensiones del paquete */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="shipping-length" className="text-xs text-gray-600">
                    Largo (cm)
                  </Label>
                  <Input
                    id="shipping-length"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.0"
                    value={formData.shipping_length ?? ''}
                    onChange={(e) => updateField('shipping_length', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping-width" className="text-xs text-gray-600">
                    Ancho (cm)
                  </Label>
                  <Input
                    id="shipping-width"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.0"
                    value={formData.shipping_width ?? ''}
                    onChange={(e) => updateField('shipping_width', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping-height" className="text-xs text-gray-600">
                    Alto (cm)
                  </Label>
                  <Input
                    id="shipping-height"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.0"
                    value={formData.shipping_height ?? ''}
                    onChange={(e) => updateField('shipping_height', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping-weight" className="text-xs text-gray-600">
                    Peso Real (kg)
                  </Label>
                  <Input
                    id="shipping-weight"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.0"
                    value={formData.shipping_weight ?? ''}
                    onChange={(e) => updateField('shipping_weight', e.target.value)}
                  />
                </div>
              </div>

              {/* Peso Volumétrico Calculado */}
              {formData.shipping_length && formData.shipping_width && formData.shipping_height && (() => {
                const length = parseFloat(formData.shipping_length);
                const width = parseFloat(formData.shipping_width);
                const height = parseFloat(formData.shipping_height);

                if (!isNaN(length) && !isNaN(width) && !isNaN(height) && length > 0 && width > 0 && height > 0) {
                  const volumetricWeight = (length * width * height) / 6000;
                  return (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium text-blue-900">
                            Peso Volumétrico (Correos)
                          </Label>
                          <p className="text-xs text-blue-700 mt-0.5">
                            Fórmula: (L × W × H) / 6000
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">
                            {volumetricWeight.toFixed(2)}
                          </div>
                          <div className="text-xs text-blue-700">kg</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Stripe Sync Info */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-xs text-purple-800">
                  💳 Al guardar, este producto se sincronizará automáticamente con Stripe para pagos online.
                </p>
              </div>
            </div>
          )}

          {formData.purchase_mode === 'contact_only' && (
            <div className="p-3 bg-gray-100 border border-gray-300 rounded-md">
              <p className="text-xs text-gray-600">
                ℹ️ Modo "Solo Consulta" activado. El producto mostrará precio de referencia pero los clientes deberán contactar para comprar.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PricingTab;
