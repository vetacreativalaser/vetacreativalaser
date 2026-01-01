import React from 'react';
import { ShoppingBag, Package, Truck, CheckCircle } from 'lucide-react';

const PurchasesTab = ({ purchases }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'En preparación':
        return <Package className="w-4 h-4" />;
      case 'Enviado':
        return <Truck className="w-4 h-4" />;
      case 'Finalizada':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'En preparación':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Finalizada':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Aún no has realizado ninguna compra</p>
        <p className="text-gray-400 text-sm mt-2">
          Tus pedidos aparecerán aquí cuando realices tu primera compra
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {purchase.name || 'Compra'}
            </h3>
          </div>

          {purchase.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {purchase.description}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                purchase.status
              )}`}
            >
              {getStatusIcon(purchase.status)}
              <span>{purchase.status || 'Sin estado'}</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {new Date(purchase.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PurchasesTab;
