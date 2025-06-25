import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Share2 } from 'lucide-react';

const ProductInfo = ({ product, isFavorite, isLoadingFavorite, toggleWishlist, handleShare, handleContact }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="flex flex-col justify-start"
  >
    <h1 className="text-3xl lg:text-4xl font-semibold text-black mb-3">
      {product.name}
    </h1>

    {/* Precio */}
    <div className="text-2xl text-gray-700 mb-6">
      {product.price?.type === 'fixed' && (
        <p>PVP: {product.price.value} €</p>
      )}

      {product.price?.type === 'variable' && (
        <>
          {product.price.base && (
            <p className="mb-2">PVP base: {product.price.base} €</p>
          )}
          {product.price.unidad && Array.isArray(product.price.unidad) && (
            <div className="mb-2">
              <p className="font-semibold text-lg">Precio por unidad:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm">
                {product.price.unidad.map((u, idx) => (
                  <li key={idx}>{u.nombre}: {u.precio} €</li>
                ))}
              </ul>
            </div>
          )}
          {product.price.motivo && Array.isArray(product.price.motivo) && (
            <div>
              <p className="font-semibold text-lg">Precio por motivo:</p>
              <ul className="list-disc list-inside text-gray-600 text-sm">
                {product.price.motivo.map((m, idx) => (
                  <li key={idx}>{m.nombre}: {m.precio} €</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>

    {/* Botones */}
    <div className="flex items-center space-x-3 mb-6">
      <Button
        onClick={toggleWishlist}
        variant="outline"
        size="icon"
        className="border-gray-300 hover:border-black h-10 w-10"
        disabled={isLoadingFavorite}
      >
        {isLoadingFavorite
          ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
          : <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} strokeWidth={1.5} />}
      </Button>

      <Button onClick={handleShare} variant="outline" size="icon" className="border-gray-300 hover:border-black h-10 w-10">
        <Share2 className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
      </Button>
    </div>

    {/* Descripción */}
    {product.full_description && (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-2">Descripción</h2>
        <p className="text-gray-600 leading-relaxed text-sm">{product.full_description}</p>
      </div>
    )}

    {/* Especificaciones */}
    {product.specifications && product.specifications.length > 0 && (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-black mb-2">Especificaciones</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
          {product.specifications.map((spec, index) => (
            <li key={index}>{spec}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Cómo comprar */}
    <div className="mb-8 p-4 border border-gray-200 bg-gray-50 rounded">
      <h2 className="text-lg font-semibold text-black mb-2">Cómo Comprar</h2>
      <p className="text-gray-600 leading-relaxed text-sm mb-2">
        ¡Gracias por tu interés! Al ser una empresa pequeña y artesanal, gestionamos los pedidos de forma personalizada.
      </p>
      <ol className="list-decimal list-inside text-gray-600 space-y-1 text-sm mb-3">
        <li>Contacta con nosotros a través de WhatsApp o email.</li>
        <li>Indícanos el producto que te interesa y cualquier personalización.</li>
        <li>Te confirmaremos los detalles y el precio final.</li>
        <li>El pago se realiza de forma segura por Bizum o transferencia.</li>
      </ol>
      <p className="text-gray-600 text-sm font-medium mb-1">¡Soy una persona fiable! Puedes comprobar las reseñas de otros clientes.</p>
    </div>
  </motion.div>
);

export default ProductInfo;
