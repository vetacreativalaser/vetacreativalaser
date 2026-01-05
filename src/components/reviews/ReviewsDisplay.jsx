import React, { useEffect, useState } from 'react';
import { Trash2, Star, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { parseImageUrls as parseImageUrlsUtil, extractImagePaths } from '@/lib/imageUtils';
import 'swiper/css';
import 'swiper/css/pagination';

/**
 * Componente reutilizable para mostrar reseñas con lightbox y gestión de imágenes
 *
 * @param {Array} reviews - Lista de reseñas a mostrar
 * @param {Object} currentUser - Usuario actual (para permisos de eliminación)
 * @param {Function} refreshReviews - Callback para actualizar lista después de eliminar
 * @param {boolean} showProductLink - Si mostrar enlace al producto (para perfil de usuario)
 * @param {Object} userNamesMap - Mapa de ID de usuario a nombre (opcional, si no se provee se consulta profiles)
 * @param {string} emptyMessage - Mensaje personalizado cuando no hay reseñas
 * @param {string} containerClassName - Clases CSS personalizadas para el contenedor
 */
const ReviewsDisplay = ({
  reviews,
  currentUser,
  refreshReviews,
  showProductLink = false,
  userNamesMap = null,
  emptyMessage = 'No hay reseñas todavía',
  containerClassName = ''
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [userNames, setUserNames] = useState(userNamesMap || {});
  const [allSlides, setAllSlides] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user names if not provided
  useEffect(() => {
    const fetchUserNames = async () => {
      if (userNamesMap) return; // Skip if names already provided

      const uniqueIds = [...new Set(reviews.map((r) => r.user_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', uniqueIds);

      if (!error && data) {
        const nameMap = {};
        data.forEach((u) => {
          nameMap[u.id] = u.name;
        });
        setUserNames(nameMap);
      }
    };

    if (reviews.length > 0) fetchUserNames();
  }, [reviews, userNamesMap]);

  // Build slides array for lightbox
  useEffect(() => {
    const slides = [];
    reviews.forEach((review) => {
      const imageUrls = parseImageUrlsUtil(review.image_urls);
      if (Array.isArray(imageUrls)) {
        imageUrls.forEach((url) => {
          slides.push({ url, review });
        });
      }
    });
    setAllSlides(slides);
  }, [reviews]);

  const openLightbox = (review, index) => {
    const imageUrls = parseImageUrlsUtil(review.image_urls);
    const globalIndex = allSlides.findIndex(
      (slide) => slide.review.id === review.id && imageUrls[index] === slide.url
    );
    setSelectedImageIndex(globalIndex);
    setSelectedReview(review);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    setSelectedReview(null);
  };

  const handleDelete = async (review) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta reseña?')) return;
    try {
      const urls = parseImageUrlsUtil(review.image_urls);
      const paths = extractImagePaths(urls, 'reviews');

      if (paths.length > 0) {
        await supabase.storage.from('reviews').remove(paths);
      }

      await supabase.from('reviews').delete().eq('id', review.id);
      refreshReviews();
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      alert('Error al eliminar la reseña');
    }
  };

  const getUserDisplayName = (userId) => {
    const name = userNames[userId];
    return name?.split(' ').slice(0, 2).join(' ') || 'Usuario';
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const shouldStack = viewportWidth < 500;

  return (
    <>
      <div className={containerClassName || 'space-y-4'}>
        {reviews.map((review) => {
          const imageUrls = parseImageUrlsUtil(review.image_urls);
          const name = getUserDisplayName(review.user_id);
          const visibleImages = imageUrls?.slice(0, 2) || [];
          const extraImages = imageUrls?.length > 2 ? imageUrls.length - 2 : 0;
          const canDelete = currentUser?.id === review.user_id;

          return (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div
                className={`flex ${
                  shouldStack ? 'flex-col' : 'flex-row items-start'
                } gap-4`}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(review)}
                        className="hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`w-4 h-4 ${
                          v <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {showProductLink && review.product_id && (
                    <Link
                      to={`/productos/${review.product_id}`}
                      className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
                    >
                      Ver producto →
                    </Link>
                  )}

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.content}
                  </p>
                </div>

                {Array.isArray(imageUrls) && imageUrls.length > 0 && (
                  <div
                    className={`flex gap-2 ${
                      shouldStack ? 'justify-start mt-3' : 'justify-center items-start'
                    }`}
                  >
                    {visibleImages.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          onClick={() => openLightbox(review, index)}
                          className="w-20 h-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                          alt={`img-${index}`}
                          draggable={false}
                        />
                        {index === visibleImages.length - 1 && extraImages > 0 && (
                          <div
                            className="absolute inset-0 bg-black/50 rounded flex items-center justify-center text-white text-sm font-medium cursor-pointer"
                            onClick={() => openLightbox(review, index)}
                          >
                            +{extraImages}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={closeLightbox}>
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div
              className="bg-white rounded shadow-lg max-w-3xl w-full p-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Swiper
                initialSlide={selectedImageIndex}
                modules={[Pagination, Navigation]}
                pagination={{ clickable: true }}
                loop
                allowTouchMove
                className="mb-4 select-none swiper"
                onSlideChange={({ activeIndex }) => {
                  const newReview = allSlides[activeIndex]?.review;
                  if (newReview?.id !== selectedReview?.id) {
                    setSelectedReview(newReview);
                  }
                }}
              >
                {allSlides.map((slide, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={slide.url}
                      alt={`slide-${i}`}
                      className="w-full h-auto max-h-[70vh] object-contain mx-auto select-none"
                      draggable={false}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <button
                onClick={() => document.querySelector('.swiper')?.swiper?.slidePrev()}
                className="custom-swiper-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 z-10"
              >
                <ChevronLeft className="h-5 w-5 text-black" />
              </button>
              <button
                onClick={() => document.querySelector('.swiper')?.swiper?.slideNext()}
                className="custom-swiper-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 z-10"
              >
                <ChevronRight className="h-5 w-5 text-black" />
              </button>
              {selectedReview && (
                <div className="text-center text-sm border-t border-gray-200 pt-3">
                  <p className="font-medium text-gray-900 mb-2">
                    {getUserDisplayName(selectedReview.user_id)}
                  </p>
                  <div className="flex justify-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`w-4 h-4 ${
                          v <= selectedReview.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm">{selectedReview.content}</p>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default ReviewsDisplay;
