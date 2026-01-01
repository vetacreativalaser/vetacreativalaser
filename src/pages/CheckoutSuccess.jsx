import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Obtener session_id de la URL
    const session = searchParams.get('session_id');
    setSessionId(session);

    // Limpiar el carrito después de un pago exitoso
    clearCart();
  }, [searchParams, clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Icono de éxito */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pedido Confirmado!
          </h1>

          {/* Mensaje */}
          <p className="text-gray-600 mb-6">
            Tu pedido ha sido procesado correctamente. Recibirás un email de confirmación en breve.
          </p>

          {/* Session ID (para debugging) */}
          {sessionId && (
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">ID de transacción</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {sessionId}
              </p>
            </div>
          )}

          {/* Próximos pasos */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
            <div className="flex items-start gap-3 mb-4">
              <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  ¿Qué sigue?
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Recibirás un email de confirmación</li>
                  <li>• Revisaremos tu pedido y personalizaciones</li>
                  <li>• Te contactaremos si necesitamos aclarar algo</li>
                  <li>• Prepararemos tu pedido con cariño</li>
                  <li>• Te notificaremos cuando esté listo para envío</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Agradecimiento */}
          <p className="text-sm text-gray-600 mb-6">
            Gracias por confiar en <span className="font-semibold">Veta Creativa Láser</span>.
            ¡Estamos emocionados de crear algo especial para ti! ✨
          </p>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full"
              size="lg"
            >
              Volver al inicio
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/productos')}
              variant="outline"
              className="w-full"
            >
              Seguir comprando
            </Button>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="text-center mt-6 text-sm text-gray-600">
          ¿Tienes preguntas? Contáctanos por{' '}
          <a href="https://wa.me/642571133" className="text-blue-600 hover:underline">
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
