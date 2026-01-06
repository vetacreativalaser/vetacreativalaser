import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Send, Star, Camera } from 'lucide-react';
import compressImageToWebP from '@/lib/utils';

const ReviewForm = ({ user, productId, newReview, setNewReview, refreshReviews }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const imageInputRef = useRef();
  const cameraInputRef = useRef();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    // Limitar el total de imágenes a 6
    const remainingSlots = 6 - selectedImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) return;

    const compressedImages = await Promise.all(
      filesToAdd.map(async (file) => {
        const webpBlob = await compressImageToWebP(file, 0.7);
        return new File([webpBlob], `${Date.now()}_${file.name}.webp`, { type: 'image/webp' });
      })
    );

    // Agregar las nuevas imágenes a las existentes
    setSelectedImages(prev => [...prev, ...compressedImages]);

    // Limpiar el input para poder seleccionar la misma foto de nuevo si es necesario
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let image_urls = [];
      if (selectedImages.length > 0) {
        const uploads = await Promise.all(
          selectedImages.map(async (file) => {
            const { data, error } = await supabase.storage
              .from('reviews')
              .upload(`review-images/${user.id}/${file.name}`, file, {
                cacheControl: '3600',
                upsert: false,
              });
            if (error) throw error;
            const { data: publicUrlData } = supabase.storage
              .from('reviews')
              .getPublicUrl(`review-images/${user.id}/${file.name}`);
            return publicUrlData.publicUrl;
          })
        );
        image_urls = uploads;
      }

      const { error: insertError } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: productId,
        comment: newReview.comment,
        rating: newReview.rating,
        image_urls
      });

      if (insertError) throw insertError;

      setNewReview({ comment: '', rating: 0 });
      setSelectedImages([]);
      refreshReviews();
    } catch (error) {
      console.error('Error al enviar la reseña:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <p className="text-center text-gray-500">Inicia sesión para dejar una reseña.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="comment">Tu reseña</Label>
        <Textarea
          id="comment"
          value={newReview.comment}
          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          placeholder="Escribe tu opinión sobre el producto..."
          required
        />
      </div>
      <div>
        <Label htmlFor="rating">Valoración</Label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`w-6 h-6 cursor-pointer ${value <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
              onClick={() => setNewReview({ ...newReview, rating: value })}
              fill={value <= newReview.rating ? 'currentColor' : 'none'}
            />
          ))}
        </div>
      </div>
      <div>
        {/* Preview de imágenes con botones para agregar más */}
        <div className="space-y-3">
          {/* Mostrar imágenes seleccionadas */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`preview ${index + 1}`}
                    className="w-full h-full object-cover rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botones para agregar fotos (solo si no se alcanzó el límite) */}
          {selectedImages.length < 6 && (
            <>
              <Label className="text-sm text-gray-600">
                {selectedImages.length === 0
                  ? 'Añade fotos de tu producto (opcional, máx 6)'
                  : `${selectedImages.length}/6 fotos agregadas`}
              </Label>

              {isMobile ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={selectedImages.length >= 6}
                  >
                    <Camera className="w-4 h-4" />
                    Tomar foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={selectedImages.length >= 6}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Galería
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={selectedImages.length >= 6}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Seleccionar imágenes
                </Button>
              )}
            </>
          )}
        </div>

        {/* Input para cámara (móvil) */}
        <Input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          ref={cameraInputRef}
          className="hidden"
        />

        {/* Input para galería */}
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          ref={imageInputRef}
          className="hidden"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Enviando...' : (
          <div className="flex items-center gap-2"><Send className="w-4 h-4" /> Enviar reseña</div>
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;
