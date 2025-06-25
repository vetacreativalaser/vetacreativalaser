// src/utils/getProductPopularity.js
import { supabase } from '../lib/supabaseClient'; // Asegúrate de tener esta ruta bien configurada

export const getProductPopularity = async () => {
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('product_id');

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  const popularity = {};
  favorites.forEach(fav => {
    popularity[fav.product_id] = (popularity[fav.product_id] || 0) + 1;
  });

  const topProducts = Object.entries(popularity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topProductIds = topProducts.map(([productId]) => parseInt(productId));

  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .in('id', topProductIds);

  if (productError) {
    console.error('Error fetching product details:', productError);
    return [];
  }

  return topProducts.map(([productId, count]) => {
    const product = products.find(p => p.id === parseInt(productId));
    return {
      name: product ? product.name : `Producto ID ${productId}`,
      count,
    };
  });
};
