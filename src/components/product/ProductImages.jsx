import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductImages = ({ images = [], alts = [], name = "Producto" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = images.length;

  const handleThumbnailClick = (index) => setCurrentIndex(index);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <img
          className="w-full h-full object-cover"
          alt={alts[currentIndex] || name}
          src={images[currentIndex]}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90"
            >
              <ChevronLeft className="h-5 w-5 text-black" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90"
            >
              <ChevronRight className="h-5 w-5 text-black" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {images.map((url, index) => (
            <div
              key={index}
              className={`aspect-square bg-gray-100 cursor-pointer border ${index === currentIndex ? 'border-black' : 'border-transparent'} hover:border-black`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img
                className="w-full h-full object-cover"
                alt={alts[index] || `${name} - vista ${index + 1}`}
                src={url}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ProductImages;
