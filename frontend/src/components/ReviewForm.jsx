import { useState } from 'react';
import { Star, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { reviewService } from '../services/reviewService';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

const ReviewForm = ({ order, product, onReviewSubmitted, onClose }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [aspects, setAspects] = useState({
    quality: 0,
    freshness: 0,
    packaging: 0,
    value: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error(t('components.reviewForm.ratingRequired'));
      return;
    }

    if (!comment.trim()) {
      toast.error(t('components.reviewForm.commentRequired'));
      return;
    }

    if (comment.trim().length < 10) {
      toast.error(t('components.reviewForm.minChars'));
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.createReview({
        productId: product._id,
        orderId: order._id,
        rating,
        comment: comment.trim(),
        aspects: Object.values(aspects).some(v => v > 0) ? aspects : undefined
      });

      toast.success(t('components.reviewForm.success'));
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('components.reviewForm.failedSubmit'));
      console.error('Review submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onHover, onClick }) => (
    <button
      type="button"
      className="focus:outline-none"
      onMouseEnter={() => onHover(value)}
      onMouseLeave={() => onHover(0)}
      onClick={() => onClick(value)}
    >
      <Star
        className={`w-6 h-6 transition-colors ${
          value <= (hoveredRating || rating)
            ? 'text-yellow-500 fill-current'
            : 'text-gray-300'
        }`}
      />
    </button>
  );

  const AspectRating = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                star <= value
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{t('components.reviewForm.title')}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('components.reviewForm.overallRating')}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <StarRating
                key={value}
                value={value}
                onHover={setHoveredRating}
                onClick={setRating}
              />
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 5 && t('components.reviewForm.excellent')}
              {rating === 4 && t('components.reviewForm.veryGood')}
              {rating === 3 && t('components.reviewForm.good')}
              {rating === 2 && t('components.reviewForm.fair')}
              {rating === 1 && t('components.reviewForm.poor')}
            </p>
          )}
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('components.reviewForm.yourReview')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('components.reviewForm.reviewPlaceholder')}
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('components.reviewForm.charCount', { count: comment.length })}
          </p>
        </div>

        {/* Additional Aspects (Optional) */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('components.reviewForm.additionalRatings')}
          </label>
          <div className="space-y-2">
            <AspectRating
              label={t('components.reviewForm.quality')}
              value={aspects.quality}
              onChange={(value) => setAspects({ ...aspects, quality: value })}
            />
            <AspectRating
              label={t('components.reviewForm.freshness')}
              value={aspects.freshness}
              onChange={(value) => setAspects({ ...aspects, freshness: value })}
            />
            <AspectRating
              label={t('components.reviewForm.packaging')}
              value={aspects.packaging}
              onChange={(value) => setAspects({ ...aspects, packaging: value })}
            />
            <AspectRating
              label={t('components.reviewForm.value')}
              value={aspects.value}
              onChange={(value) => setAspects({ ...aspects, value: value })}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('components.reviewForm.product')}</span> {product?.cropName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('components.reviewForm.order')}</span> #{order?.orderNumber}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={submitting || rating === 0 || !comment.trim()}
            className="flex-1"
          >
            {submitting ? t('components.reviewForm.submitting') : t('components.reviewForm.submit')}
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t('components.reviewForm.cancel')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default ReviewForm;

