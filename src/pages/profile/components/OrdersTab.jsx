/**
 * ORDERS TAB - Customer Order History
 *
 * Vista de historial de pedidos para clientes
 * Muestra estado, detalles y número de seguimiento
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/priceUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
  Truck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG = {
  paid: {
    label: 'Pagado',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    description: 'Tu pedido ha sido recibido y está siendo procesado',
  },
  producing: {
    label: 'En Producción',
    icon: Wrench,
    color: 'bg-blue-100 text-blue-800',
    description: 'Estamos fabricando tu pedido',
  },
  completed: {
    label: 'Completado',
    icon: Package,
    color: 'bg-purple-100 text-purple-800',
    description: 'Tu pedido está listo para ser enviado',
  },
  shipped: {
    label: 'Enviado',
    icon: Truck,
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Tu pedido está en camino',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    description: 'Este pedido ha sido cancelado',
  },
};

export default function OrdersTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // RLS filtra automáticamente por user_id, no necesitamos filtrar manualmente
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tienes pedidos aún
        </h3>
        <p className="text-gray-600 mb-6">
          Cuando realices un pedido, aparecerá aquí con toda la información
        </p>
        <Button onClick={() => (window.location.href = '/productos')}>
          Ver productos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Mis Pedidos</h3>
        <p className="text-sm text-gray-600">
          Historial completo de tus pedidos y su estado actual
        </p>
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {orders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={order.id}
              className="bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openOrderDetails(order)}
            >
              <div className="p-6">
                {/* Header del pedido */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 rounded-full p-3">
                      <Package className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-sm">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Estado y total */}
                <div className="flex items-center justify-between">
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                </div>

                {/* Número de seguimiento si existe */}
                {order.tracking_number && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-600">Nº seguimiento:</span>
                      <span className="font-mono font-medium text-indigo-600">
                        {order.tracking_number}
                      </span>
                      <a
                        href={`https://www.correos.es/es/es/herramientas/localizador/envios?tracking=${order.tracking_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-indigo-600 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Rastrear <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog de detalles */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}

// Componente de diálogo de detalles
function OrderDetailsDialog({ order, isOpen, onClose }) {
  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            Pedido {order.order_number}
          </DialogTitle>
          <DialogDescription>
            Realizado el {formatDate(order.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Estado del Pedido</h3>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{statusConfig.description}</p>
          </div>

          {/* Timeline del pedido */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Línea de tiempo</h3>
            <div className="space-y-3">
              {order.paid_at && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">Pedido recibido</p>
                    <p className="text-gray-600">{formatDate(order.paid_at)}</p>
                  </div>
                </div>
              )}
              {order.producing_started_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Iniciada la producción</p>
                    <p className="text-gray-600">
                      {formatDate(order.producing_started_at)}
                    </p>
                  </div>
                </div>
              )}
              {order.completed_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Package className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-medium">Producción completada</p>
                    <p className="text-gray-600">{formatDate(order.completed_at)}</p>
                  </div>
                </div>
              )}
              {order.shipped_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="font-medium">Pedido enviado</p>
                    <p className="text-gray-600">{formatDate(order.shipped_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Número de seguimiento */}
          {order.tracking_number && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                Información de envío
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                Número de seguimiento:{' '}
                <span className="font-mono font-semibold text-indigo-600">
                  {order.tracking_number}
                </span>
              </p>
              <a
                href={`https://www.correos.es/es/es/herramientas/localizador/envios?tracking=${order.tracking_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
              >
                Rastrear envío en Correos <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Dirección de envío */}
          {order.shipping_address && (
            <div>
              <h3 className="font-semibold mb-3">Dirección de Envío</h3>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>
                  {order.shipping_address.postal_code} {order.shipping_address.city}
                </p>
                <p>{order.shipping_address.state}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          )}

          {/* Productos */}
          <div>
            <h3 className="font-semibold mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  {/* Personalización */}
                  {item.customization && Object.keys(item.customization).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Personalización:
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {Object.entries(item.customization).map(([key, value]) => (
                          <p key={key}>
                            <span className="font-medium">{key}:</span> {value}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Razón seleccionada */}
                  {item.selectedReason && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700">
                        Motivo: <span className="font-normal">{item.selectedReason}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-50 rounded p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gastos de envío:</span>
                <span className="font-medium">{formatPrice(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Información de ayuda */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <p className="text-gray-700">
              ¿Necesitas ayuda con tu pedido? Contáctanos por{' '}
              <a
                href="https://wa.me/642571133"
                className="text-blue-600 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>{' '}
              o{' '}
              <a
                href="mailto:vetacreativalaser@gmail.com"
                className="text-blue-600 hover:underline font-medium"
              >
                email
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
