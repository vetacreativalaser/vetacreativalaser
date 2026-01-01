import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FavoritesSection = ({ favorites, products }) => {
  return (
    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Favoritos
        </h2>
        <Link to="/favoritos">
          <Button size="sm" variant="link" className="text-blue-600 hover:text-blue-800">
            Ver todos →
          </Button>
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-6">
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
                className="flex items-center gap-2 text-sm text-gray-700 py-2 border-b border-gray-100 last:border-0"
              >
                <Heart className="w-3 h-3 text-red-400 fill-red-400" />
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
