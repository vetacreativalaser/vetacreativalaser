import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const FavoritesSection = ({ favorites, products }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-gray-700" />
          Favoritos
        </h2>
        <Link to="/favoritos" className="text-sm text-gray-600 hover:text-gray-900">
          Ver todos →
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No tienes favoritos guardados</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {favorites.slice(0, 5).map((fav) => {
            const product = products.find((p) => p.id === fav.product_id);
            return (
              <li
                key={fav.id}
                className="flex items-center gap-3 text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0"
              >
                <Heart className="w-4 h-4 text-gray-400" />
                <span className="flex-1">{product?.name || 'Producto eliminado'}</span>
              </li>
            );
          })}
          {favorites.length > 5 && (
            <li className="text-xs text-gray-500 text-center pt-2">
              y {favorites.length - 5} más...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default FavoritesSection;
