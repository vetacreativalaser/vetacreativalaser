import React from 'react';
import ReviewsDisplay from '@/components/reviews/ReviewsDisplay';

const ReviewsList = ({ reviews, user, refreshReviews }) => {
  return (
    <ReviewsDisplay
      reviews={reviews}
      currentUser={user}
      refreshReviews={refreshReviews}
      showProductLink={false}
      emptyMessage="No hay reseñas todavía"
      containerClassName="pt-10 pb-10 min-h-screen space-y-8"
    />
  );
};

export default ReviewsList;
