import React, { useEffect, useState } from 'react';
import { Trash, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const ReviewsList = ({ reviews, user, refreshReviews }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [userEmails, setUserEmails] = useState({});
  const [allSlides, setAllSlides] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchEmails = async () => {
      const uniqueIds = [...new Set(reviews.map((r) => r.user_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', uniqueIds);

      if (!error && data) {
        const emailMap = {};
        data.forEach((u) => {
          emailMap[u.id] = { email: u.email, name: u.name };
        });
        setUserEmails(emailMap);
      }
    };

    const slides = [];
    reviews.forEach((review) => {
      const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
      if (Array.isArray(imageUrls)) {
        imageUrls.forEach((url) => {
          slides.push({ url, review });
        });
      }
    });
    setAllSlides(slides);

    if (reviews.length > 0) fetchEmails();
  }, [reviews]);

  const openLightbox = (review, index) => {
    const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
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
      const urls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
      if (Array.isArray(urls) && urls.length > 0) {
        const paths = urls.map(url =>
          decodeURIComponent(new URL(url).pathname.split('/storage/v1/object/public/reviews/')[1])
        );
        if (paths.length > 0) {
          await supabase.storage.from('reviews').remove(paths);
        }
      }

      await supabase.from('reviews').delete().eq('id', review.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points, name')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        const updatedPoints = Math.max(0, profile.points - 5);
        await supabase.from('profiles').update({ points: updatedPoints }).eq('id', user.id);

        const { data: { session } } = await supabase.auth.getSession();

        await fetch('https://dspsrnprvrpjrkicxiso.functions.supabase.co/send-points-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            email: user.email,
            name: profile.name,
            points: updatedPoints,
            changeType: 'lose'
          })
        });
      }

      refreshReviews();
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
    }
  };

  return (
    <div className="pt-10 pb-10 min-h-screen space-y-8">
      {reviews.map((review) => {
        const imageUrls = typeof review.image_urls === 'string' ? JSON.parse(review.image_urls) : review.image_urls;
        const name = userEmails[review.user_id]?.name?.split(' ').slice(0, 2).join(' ') || 'Usuario';

        const visibleImages = imageUrls?.slice(0, 2) || [];
        const extraImages = imageUrls?.length > 2 ? imageUrls.length - 2 : 0;

        const shouldStack = viewportWidth < 500;

        return (
          <div key={review.id} className="bg-white rounded-xl border shadow-sm p-4 select-none">
            <div className={`flex ${shouldStack ? 'flex-col' : 'flex-row items-start'} gap-4`}>
              <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                <p className="text-sm font-semibold text-black truncate">{name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`w-4 h-4 ${v <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill={v <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  {user?.id === review.user_id && (
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(review)}>
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-700 text-justify break-words whitespace-pre-wrap">{review.content}</p>
              </div>

              {Array.isArray(imageUrls) && imageUrls.length > 0 && (
                <div className={`image-grid-2 ${shouldStack ? 'justify-start' : 'justify-center items-center self-center'}`}>
                  {visibleImages.map((url, index) => (
                    <div key={index} className="image-container">
                      <img
                        src={url}
                        onClick={() => openLightbox(review, index)}
                        className="review-image"
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

      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={closeLightbox}>
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
            <div className="bg-white rounded shadow-lg max-w-3xl w-full p-4" onClick={(e) => e.stopPropagation()}>
              <Swiper
                initialSlide={selectedImageIndex}
                modules={[Pagination, Navigation]}
                pagination={{ clickable: true }}
                navigation={{
                  nextEl: '.custom-swiper-next',
                  prevEl: '.custom-swiper-prev'
                }}
                allowTouchMove={true}
                className="mb-4 select-none relative"
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
                <button className="custom-swiper-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 z-10">
                  <ChevronLeft className="h-5 w-5 text-black" />
                </button>
                <button className="custom-swiper-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 shadow hover:bg-opacity-90 z-10">
                  <ChevronRight className="h-5 w-5 text-black" />
                </button>
              </Swiper>
              {selectedReview && (
                <div className="text-center text-sm">
                  <p className="font-semibold text-black mb-1">{userEmails[selectedReview.user_id]?.name || 'Usuario'}</p>
                  <div className="flex justify-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`w-4 h-4 ${v <= selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill={v <= selectedReview.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="text-justify px-2">{selectedReview.content}</p>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewsList;
