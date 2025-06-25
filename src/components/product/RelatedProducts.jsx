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
        {related.map((relatedProduct) => (
          <div key={relatedProduct.id} className="group relative">
            <div className="w-full aspect-square bg-gray-100 overflow-hidden">
             <Link to={`/productos/${relatedProduct.id}`}>
                <img 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  alt={relatedProduct.image_alts && relatedProduct.image_alts.length > 0 ? relatedProduct.image_alts[0] : relatedProduct.name}
                  src={(relatedProduct.image_urls && relatedProduct.image_urls.length > 0) ? relatedProduct.image_urls[0] : "https://images.unsplash.com/photo-1635865165118-917ed9e20936"}
                />
              </Link>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-md font-medium text-black">
                <Link to={`/productos/${relatedProduct.id}`}>
                  {relatedProduct.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-gray-500">{relatedProduct.price}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RelatedProducts;