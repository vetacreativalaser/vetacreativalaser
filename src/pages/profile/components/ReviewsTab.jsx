import React, { useMemo } from 'react';
import ReviewsDisplay from '@/components/reviews/ReviewsDisplay';

const ReviewsTab = ({ reviews, user, refreshReviews }) => {
  // Create a user names map from the current user
  const userNamesMap = useMemo(() => {
    if (!user?.id) return {};
    return { [user.id]: user.name };
  }, [user]);

  return (
    <ReviewsDisplay
      reviews={reviews}
      currentUser={user}
      refreshReviews={refreshReviews}
      showProductLink={true}
      userNamesMap={userNamesMap}
      emptyMessage="No has escrito reseñas todavía"
      containerClassName="space-y-4"
    />
  );
};

export default ReviewsTab;
