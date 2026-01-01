/**
 * CART ITEM - Veta Creativa Láser
 *
 * Componente individual de item del carrito
 * Muestra producto, cantidad, personalización y controles
 */

import { Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, calculateItemTotal } from '@/lib/priceUtils';

/**
 * CartItem Component
 *
 * @param {Object} props
 * @param {Object} props.item - Item del carrito desde Zustand store
 * @param {Function} props.onUpdateQuantity - Callback (itemId, newQuantity) => void
 * @param {Function} props.onRemove - Callback (itemId) => void
 */
export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { itemId, product, quantity, customization, selectedReason, priceConfig } = item;

  // Validar priceConfig antes de calcular
  if (!priceConfig || !priceConfig.type) {
    console.error('Invalid priceConfig for cart item:', item);
    return null; // No renderizar item inválido
  }

  // Calcular precio del item
  const itemTotal = calculateItemTotal(priceConfig, quantity, selectedReason);

  // Obtener primera imagen del producto
  const productImage = product.image_urls?.[0] || '/placeholder-product.png';

  // Incrementar cantidad
  const handleIncrement = () => {
    onUpdateQuantity(itemId, quantity + 1);
  };

  // Decrementar cantidad
  const handleDecrement = () => {
    if (quantity > 1) {
      onUpdateQuantity(itemId, quantity - 1);
    }
  };

  // Cambio manual de cantidad
  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    if (newQuantity >= 1) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  // Verificar si hay personalizaciones
  const hasCustomization = customization && Object.keys(customization).length > 0;

  return (
    <div className="flex gap-3 py-4 border-b border-gray-200 last:border-b-0">
      {/* Imagen del producto */}
      <div className="flex-shrink-0">
        <img
          src={productImage}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-md border border-gray-200"
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        {/* Nombre del producto */}
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {product.name}
        </h3>

        {/* Precio unitario */}
        <p className="text-xs text-gray-500 mt-1">
          {formatPrice(itemTotal / quantity)} / unidad
        </p>

        {/* Motivo seleccionado (para byReason) */}
        {selectedReason && (
          <p className="text-xs text-gray-600 mt-1">
            <span className="font-medium">Motivo:</span> {selectedReason}
          </p>
        )}

        {/* Personalizaciones */}
        {hasCustomization && (
          <div className="mt-2 space-y-0.5">
            {Object.entries(customization).map(([label, value]) => (
              <p key={label} className="text-xs text-gray-500">
                <span className="font-medium">{label}:</span> {value}
              </p>
            ))}
          </div>
        )}

        {/* Controles de cantidad */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleDecrement}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>

          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="h-7 w-14 text-center text-xs"
          />

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleIncrement}
          >
            <Plus className="h-3 w-3" />
          </Button>

          {/* Botón eliminar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(itemId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Precio total del item */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(itemTotal)}
        </p>
      </div>
    </div>
  );
}
