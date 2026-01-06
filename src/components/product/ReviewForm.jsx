import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Send, Star, Camera } from 'lucide-react';
import compressImageToWebP from '@/lib/utils';

const ReviewForm = ({ user, productId, newReview, setNewReview, refreshReviews }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageSuccess, setImageSuccess] = useState(false);
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
    console.log('🎯 handleImageChange llamado');
    const files = Array.from(e.target.files);
    console.log('📁 Archivos recibidos:', files.length);

    if (files.length === 0) {
      console.log('⚠️ No hay archivos seleccionados');
      setProcessingImage(false);
      return;
    }

    // Limitar el total de imágenes a 6
    const remainingSlots = 6 - selectedImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      console.log('⚠️ Ya tienes 6 imágenes');
      setProcessingImage(false);
      return;
    }

    console.log('📸 Procesando imágenes:', filesToAdd.length, filesToAdd.map(f => f.name));
    setProcessingImage(true);

    // Prevenir scroll automático
    const scrollY = window.scrollY;

    try {
      const compressedImages = await Promise.all(
        filesToAdd.map(async (file, index) => {
          console.log(`🔄 Comprimiendo imagen ${index + 1}:`, file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
          const webpBlob = await compressImageToWebP(file, 0.7);
          const newFile = new File([webpBlob], `${Date.now()}_${index}_${file.name}.webp`, { type: 'image/webp' });
          console.log(`✅ Imagen ${index + 1} comprimida:`, `(${(newFile.size / 1024).toFixed(2)} KB)`);
          return newFile;
        })
      );

      console.log('✅ Todas las imágenes comprimidas:', compressedImages.length);

      // Agregar las nuevas imágenes a las existentes
      setSelectedImages(prev => {
        const newImages = [...prev, ...compressedImages];
        console.log('📦 Total de imágenes ahora:', newImages.length);
        return newImages;
      });

      console.log('✅ Estado actualizado correctamente');

      // Mostrar mensaje de éxito
      setImageSuccess(true);
      setTimeout(() => setImageSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Error procesando imágenes:', error);
    } finally {
      setProcessingImage(false);
      // Restaurar posición del scroll
      window.scrollTo(0, scrollY);
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
          {/* Indicador de procesamiento */}
          {processingImage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">Procesando imagen...</span>
            </div>
          )}

          {/* Mensaje de éxito */}
          {imageSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">¡Imagen agregada correctamente!</span>
            </div>
          )}

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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Resetear el input antes de abrir la cámara
                      if (cameraInputRef.current) {
                        cameraInputRef.current.value = null;
                        cameraInputRef.current.click();
                      }
                    }}
                    disabled={selectedImages.length >= 6}
                  >
                    <Camera className="w-4 h-4" />
                    Tomar foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Resetear el input antes de abrir la galería
                      if (imageInputRef.current) {
                        imageInputRef.current.value = null;
                        imageInputRef.current.click();
                      }
                    }}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Resetear el input antes de abrir
                    if (imageInputRef.current) {
                      imageInputRef.current.value = null;
                      imageInputRef.current.click();
                    }
                  }}
                  disabled={selectedImages.length >= 6}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Seleccionar imágenes
                </Button>
              )}
            </>
          )}
        </div>

        {/* Input para cámara (móvil) - usando input nativo para evitar problemas con capture */}
        <input
          type="file"
          accept="image/*"
          capture="camera"
          onChange={handleImageChange}
          ref={cameraInputRef}
          style={{ display: 'none' }}
        />

        {/* Input para galería */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          ref={imageInputRef}
          style={{ display: 'none' }}
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
