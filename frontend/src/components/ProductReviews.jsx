import { useState, useEffect } from 'react';
import { Star, User, ChevronDown, ChevronUp } from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { Loading } from './Loading';
import Card from './Card';
import { useLanguage } from '../context/LanguageContext';

const ProductReviews = ({ productId }) => {
  const { t, n } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const response = await reviewService.getProductReviews(productId, {
        page: 1,
        limit: showAll ? 20 : 3,
        sortBy
      });
      setReviews(response.data || []);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sortBy]);

  useEffect(() => {
    if (showAll) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('components.reviews.title')}</h3>
        <p className="text-gray-500 text-center py-4">{t('components.reviews.noReviewsFirst')}</p>
      </Card>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('components.reviews.title')}</h3>
        {stats.totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-semibold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-600 text-sm">
              {stats.totalReviews === 1
                ? t('components.reviews.reviewCount', { count: n(stats.totalReviews) })
                : t('components.reviews.reviewsCount', { count: n(stats.totalReviews) })}
            </span>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <div className="mb-6 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = (count / stats.totalReviews) * 100;
            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 1 && (
        <div className="mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="newest">{t('components.reviews.newestFirst')}</option>
            <option value="oldest">{t('components.reviews.oldestFirst')}</option>
            <option value="highest">{t('components.reviews.highestRating')}</option>
            <option value="lowest">{t('components.reviews.lowestRating')}</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {review.buyer?.avatar ? (
                    <img
                      src={review.buyer.avatar}
                      alt={review.buyer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {review.buyer?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(review.createdAt)}
                    {review.isVerified && (
                      <span className="ml-2 text-green-600">{t('components.reviews.verifiedPurchase')}</span>
                    )}
                  </p>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>
            <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
            
            {/* Additional Aspects */}
            {review.aspects && Object.keys(review.aspects).some(key => review.aspects[key] > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {review.aspects.quality > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">{t('components.reviews.quality')}</span>
                      {renderStars(review.aspects.quality)}
                    </div>
                  )}
                  {review.aspects.freshness > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">{t('components.reviews.freshness')}</span>
                      {renderStars(review.aspects.freshness)}
                    </div>
                  )}
                  {review.aspects.packaging > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">{t('components.reviews.packaging')}</span>
                      {renderStars(review.aspects.packaging)}
                    </div>
                  )}
                  {review.aspects.value > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">{t('components.reviews.value')}</span>
                      {renderStars(review.aspects.value)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t('components.reviews.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t('components.reviews.showAllReviews', { count: n(reviews.length) })}
            </>
          )}
        </button>
      )}
    </Card>
  );
};

export default ProductReviews;

