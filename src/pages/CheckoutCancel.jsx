import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  const { openCart, items } = useCartStore();

  const handleBackToCart = () => {
    openCart();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icono */}
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-orange-600" />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago Cancelado
          </h1>

          {/* Mensaje */}
          <p className="text-gray-600 mb-6">
            No te preocupes, tu carrito sigue intacto. Puedes volver cuando quieras para completar tu pedido.
          </p>

          {/* Información del carrito */}
          {items.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">
                  Tienes {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
                </span>
              </div>
            </div>
          )}

          {/* Razones comunes */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              ¿Por qué cancelar?
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• ¿Necesitas cambiar algo? Edita tu carrito antes de pagar</li>
              <li>• ¿Tienes dudas? Contáctanos por WhatsApp</li>
              <li>• ¿Quieres pensar más? Tu carrito estará esperando</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              onClick={handleBackToCart}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al carrito
            </Button>
            <Button
              onClick={() => navigate('/productos')}
              variant="outline"
              className="w-full"
            >
              Seguir comprando
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="text-center mt-6 text-sm text-gray-600">
          ¿Necesitas ayuda? Contáctanos por{' '}
          <a
            href="https://wa.me/642571133"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
