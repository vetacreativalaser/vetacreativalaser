import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const RelatedProducts = ({ currentProductId, allProducts }) => {
  const related = allProducts.filter(p => p.id !== currentProductId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-16 pt-12 border-t border-gray-200"
    >
      <h2 className="text-2xl font-semibold text-black mb-8 text-center">
        También te podría interesar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        {related.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
            className="group relative transition-transform hover:scale-[1.015]"
          >
            <div className="w-full aspect-square bg-gray-100 overflow-hidden">
              <Link to={`/productos/${product.id}`}>
                <img
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  alt={
                    product.images?.[0]?.alt ||
                    product.image_alts?.[0] ||
                    product.name
                  }
                  src={(() => {
                    // Formato nuevo JSONB
                    if (product.images?.[0]?.url) {
                      return product.images[0].url;
                    }
                    // Formato antiguo (array de URLs)
                    try {
                      const urls = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls;
                      return Array.isArray(urls) && urls.length > 0 ? urls[0] : '';
                    } catch {
                      return '';
                    }
                  })()}
                />
              </Link>
            </div>

            {/* ZONA DE TEXTO CON HOVER COMPLETO */}
            <div className="transition-colors duration-300 group-hover:bg-gray-100 px-3 py-3">
              <p className="text-md font-medium text-black text-left leading-snug">
                <Link to={`/productos/${product.id}`}>
                  {product.name}
                </Link>
              </p>
              <p className="mt-1 text-sm text-left text-gray-500">
                {(() => {
                  try {
                    const parsedPrice = typeof product.price === 'string' ? JSON.parse(product.price) : product.price;
                    if (parsedPrice?.type === 'fixed') return `${parsedPrice.value || parsedPrice.fixedPrice} €`;
                    return 'variable €';
                  } catch {
                    return 'variable €';
                  }
                })()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RelatedProducts;