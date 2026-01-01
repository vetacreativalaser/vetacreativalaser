import React, { useState, useEffect } from 'react';
import { Star, Trash2, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { supabase } from '@/lib/supabaseClient';
import 'swiper/css';
import 'swiper/css/pagination';

const ReviewsTab = ({ reviews, user, refreshReviews }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [allSlides, setAllSlides] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const slides = [];
    reviews.forEach((review) => {
      const imageUrls =
        typeof review.image_urls === 'string'
          ? JSON.parse(review.image_urls)
          : review.image_urls;
      if (Array.isArray(imageUrls)) {
        imageUrls.forEach((url) => {
          slides.push({ url, review });
        });
      }
    });
    setAllSlides(slides);
  }, [reviews]);

  const openLightbox = (review, index) => {
    const imageUrls =
      typeof review.image_urls === 'string'
        ? JSON.parse(review.image_urls)
        : review.image_urls;
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
      const urls =
        typeof review.image_urls === 'string'
          ? JSON.parse(review.image_urls)
          : review.image_urls;

      if (Array.isArray(urls) && urls.length > 0) {
        const paths = urls.map((url) =>
          decodeURIComponent(
            new URL(url).pathname.split('/storage/v1/object/public/reviews/')[1]
          )
        );
        if (paths.length > 0) {
          await supabase.storage.from('reviews').remove(paths);
        }
      }

      await supabase.from('reviews').delete().eq('id', review.id);
      refreshReviews();
      alert('Reseña eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      alert('Error al eliminar la reseña');
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No has escrito reseñas todavía</p>
        <p className="text-gray-400 text-sm mt-2">
          Comparte tu experiencia con nuestros productos
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-6">
        {reviews.map((review) => {
          const imageUrls =
            typeof review.image_urls === 'string'
              ? JSON.parse(review.image_urls)
              : review.image_urls;
          const name = user.name?.split(' ').slice(0, 2).join(' ') || 'Usuario';

          const visibleImages = imageUrls?.slice(0, 2) || [];
          const extraImages = imageUrls?.length > 2 ? imageUrls.length - 2 : 0;
          const shouldStack = viewportWidth < 500;

          return (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div
                className={`flex ${
                  shouldStack ? 'flex-col' : 'flex-row items-start'
                } gap-4`}
              >
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{name}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(review)}
                      className="hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`w-4 h-4 ${
                          v <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill={v <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>

                  {review.product_id && (
                    <Link
                      to={`/productos/${review.product_id}`}
                      className="text-sm text-blue-600 hover:underline inline-block"
                    >
                      Ver producto →
                    </Link>
                  )}

                  <p className="text-sm text-gray-700 text-justify break-words whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>

                {Array.isArray(imageUrls) && imageUrls.length > 0 && (
                  <div
                    className={`image-grid-2 ${
                      shouldStack ? 'justify-start' : 'justify-center items-center self-center'
                    }`}
                  >
                    {visibleImages.map((url, index) => (
                      <div key={index} className="image-container">
                        <img
                          src={url}
                          onClick={() => openLightbox(review, index)}
                          className="review-image cursor-pointer"
                          alt={`img-${index}`}
                          draggable={false}
                        />
                        {index === visibleImages.length - 1 && extraImages > 0 && (
                          <div
                            className="image-overlay"
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
                <div className="text-center text-sm">
                  <p className="font-semibold text-black mb-1">
                    {user.name?.split(' ').slice(0, 2).join(' ') || 'Usuario'}
                  </p>
                  <div className="flex justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`w-4 h-4 ${
                          v <= selectedReview.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill={v <= selectedReview.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default ReviewsTab;
