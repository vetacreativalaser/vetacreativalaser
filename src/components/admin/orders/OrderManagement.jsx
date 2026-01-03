/**
 * ORDER MANAGEMENT - Admin Component
 *
 * Gestión completa de pedidos para administradores:
 * - Ver todos los pedidos
 * - Filtrar por estado
 * - Actualizar estado del pedido
 * - Añadir número de seguimiento
 * - Ver detalles completos (productos, personalización, cliente)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Search,
  Loader2,
  ExternalLink,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
} from 'lucide-react';
import { formatPrice } from '@/lib/priceUtils';

const STATUS_CONFIG = {
  paid: {
    label: 'Pagado',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    description: 'Pago recibido, pendiente de producción',
  },
  producing: {
    label: 'Produciendo',
    icon: Wrench,
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    description: 'En proceso de fabricación',
  },
  completed: {
    label: 'Completado',
    icon: Package,
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    description: 'Fabricación completada, listo para enviar',
  },
  shipped: {
    label: 'Enviado',
    icon: Truck,
    color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    description: 'Pedido enviado al cliente',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    description: 'Pedido cancelado',
  },
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders
  useEffect(() => {
    let result = [...orders];

    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.order_number.toLowerCase().includes(search) ||
          order.customer_email.toLowerCase().includes(search) ||
          order.customer_name?.toLowerCase().includes(search) ||
          order.tracking_number?.toLowerCase().includes(search)
      );
    }

    setFilteredOrders(result);
  }, [orders, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Llamar a la función RPC que hace JOIN con auth.users
      const { data, error } = await supabase.rpc('get_orders_with_user_info');

      if (error) throw error;

      // Transform data to match expected format
      const transformedOrders = (data || []).map(order => ({
        ...order,
        user: order.user_id ? {
          id: order.user_id,
          name: order.user_name,
          email: order.user_email,
          phone: order.user_phone
        } : null
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pedidos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `El pedido ahora está en estado: ${STATUS_CONFIG[newStatus].label}`,
      });

      fetchOrders();

      // Actualizar pedido seleccionado si está abierto
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido cancelado? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('status', 'cancelled'); // Solo permitir eliminar pedidos cancelados

      if (error) throw error;

      toast({
        title: 'Pedido eliminado',
        description: 'El pedido cancelado ha sido eliminado correctamente',
      });

      fetchOrders();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el pedido',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTrackingNumber = async (orderId, trackingNumber) => {
    setIsUpdating(true);
    try {
      const { error} = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          status: 'shipped',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Número de seguimiento guardado',
        description: 'El pedido ha sido marcado como enviado',
      });

      fetchOrders();

      // Actualizar pedido seleccionado
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          tracking_number: trackingNumber,
          status: 'shipped',
        });
      }

      // TODO: Enviar email al cliente con número de seguimiento
    } catch (error) {
      console.error('Error updating tracking number:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el número de seguimiento',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateAdminNotes = async (orderId, notes) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ admin_notes: notes })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Notas guardadas',
        description: 'Las notas del pedido se han actualizado',
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar las notas',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
          <p className="text-gray-600">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por estado */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
              <SelectItem value="producing">Produciendo</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="shipped">Enviados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = orders.filter((o) => o.status === status).length;
          const Icon = config.icon;
          return (
            <div
              key={status}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setStatusFilter(status)}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-sm text-gray-600">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay pedidos que mostrar
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-mono font-semibold text-sm">
                            {order.order_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {order.customer_name || 'Sin nombre'}
                          </div>
                          <div className="text-gray-500">{order.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOrderDetails(order)}
                        >
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de detalles del pedido */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdateStatus={updateOrderStatus}
        onUpdateTracking={updateTrackingNumber}
        onUpdateNotes={updateAdminNotes}
        onDeleteOrder={deleteOrder}
        isUpdating={isUpdating}
      />
    </div>
  );
}

// Componente de diálogo de detalles
function OrderDetailsDialog({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateTracking,
  onUpdateNotes,
  onDeleteOrder,
  isUpdating,
}) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number || '');
      setAdminNotes(order.admin_notes || '');
    }
  }, [order]);

  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            Pedido {order.order_number}
          </DialogTitle>
          <DialogDescription>
            Creado el {new Date(order.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Estado del Pedido</h3>
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{statusConfig.description}</p>

            {/* Cambiar estado */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                if (status === order.status) return null;
                const Icon = config.icon;
                return (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(order.id, status)}
                    disabled={isUpdating}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    Cambiar a {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Información de Pago (Stripe) */}
          <div>
            <h3 className="font-semibold mb-3">Información de Pago</h3>
            <div className="bg-gray-50 rounded p-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <p className="font-medium">{order.customer_name || 'Sin nombre'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Cuenta */}
          {order.user_id && order.user && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Información de Cuenta</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navegar al tab de usuarios con el user_id
                    window.location.href = `/admin/dashboard?tab=users&userId=${order.user_id}`;
                  }}
                >
                  Ver Perfil de Usuario
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="bg-blue-50 rounded p-3">
                <p className="text-sm text-gray-700 mb-3">
                  ✅ Pedido realizado desde cuenta registrada
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Nombre:</span>
                    <p className="text-gray-900">{order.user.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Email:</span>
                    <p className="text-gray-900 break-all">{order.user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Teléfono:</span>
                    <p className="text-gray-900">{order.user.phone || 'No proporcionado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">ID Usuario:</span>
                    <p className="text-xs text-gray-600 font-mono break-all">{order.user_id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!order.user_id && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <p className="text-yellow-800">
                ⚠️ Pedido realizado sin cuenta registrada (compra como invitado)
              </p>
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
                    <p className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>

                  {/* Personalización */}
                  {item.customization && Object.keys(item.customization).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Personalización:</p>
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

          {/* Número de seguimiento */}
          <div>
            <h3 className="font-semibold mb-3">Número de Seguimiento</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Introduce el número de seguimiento..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <Button
                onClick={() => onUpdateTracking(order.id, trackingNumber)}
                disabled={isUpdating || !trackingNumber}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar y marcar como enviado'}
              </Button>
            </div>
            {order.tracking_number && (
              <p className="text-sm text-gray-600 mt-2">
                Número actual: <span className="font-mono font-medium">{order.tracking_number}</span>
              </p>
            )}
          </div>

          {/* Notas del admin */}
          <div>
            <h3 className="font-semibold mb-3">Notas Internas</h3>
            <Textarea
              placeholder="Añade notas sobre este pedido..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onUpdateNotes(order.id, adminNotes)}
            >
              Guardar notas
            </Button>
          </div>

          {/* Información de Stripe */}
          <div className="bg-blue-50 rounded p-4">
            <h3 className="font-semibold mb-2 text-sm">Información de Stripe</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                Session ID:{' '}
                <a
                  href={`https://dashboard.stripe.com/payments/${order.stripe_session_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono"
                >
                  {order.stripe_session_id} <ExternalLink className="inline w-3 h-3" />
                </a>
              </p>
              {order.stripe_payment_intent_id && (
                <p>
                  Payment Intent: <span className="font-mono">{order.stripe_payment_intent_id}</span>
                </p>
              )}
            </div>
          </div>

          {/* Eliminar pedido cancelado */}
          {order.status === 'cancelled' && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteOrder(order.id)}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Eliminar Pedido Cancelado
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Esta acción es permanente y no se puede deshacer
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
