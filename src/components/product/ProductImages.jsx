import React from 'react';
import { motion } from 'framer-motion';

const ProductImages = ({ images = [], alts = [], name = "Producto" }) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="w-full aspect-square bg-gray-100 overflow-hidden">
      <img 
        className="w-full h-full object-cover"
        alt={alts[0] || name}
        src={images[0] || "https://images.unsplash.com/photo-1635865165118-917ed9e20936"} 
      />
    </div>
    <div className="grid grid-cols-4 gap-2 mt-4">
      {images.slice(1, 5).map((url, index) => (
         <div key={index} className="aspect-square bg-gray-100 cursor-pointer border border-transparent hover:border-black">
           <img 
             className="w-full h-full object-cover"
             alt={alts[index + 1] || `${name} - vista ${index + 2}`}
             src={url}
            />
         </div>
      ))}
      {images.length < 5 && Array(4 - images.slice(1, 5).length).fill(0).map((_, idx) => (
        <div key={`placeholder-${idx}`} className="aspect-square bg-gray-100 border border-transparent">
          <img 
             className="w-full h-full object-cover opacity-30"
             alt={`Imagen de producto ${idx + images.slice(1, 5).length + 1}`}
             src="https://images.unsplash.com/photo-1549675613-fdbe1223679b" 
          />
        </div>
      ))}
    </div>
  </motion.div>
);

export default ProductImages;
