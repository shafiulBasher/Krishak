import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProduct } from '../services/productService';
import { getImageUrl } from '../utils/imageHelper';
import { Loading } from '../components/Loading';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import ProductReviews from '../components/ProductReviews';
import {
  MapPin, Phone, Package, Star, ShoppingCart,
  Edit, ArrowLeft, CheckCircle, Tag, Wheat, Weight
} from 'lucide-react';
import { toast } from 'react-toastify';

const GRADE_COLORS = {
  'A': 'bg-green-100 text-green-800',
  'B': 'bg-blue-100 text-blue-800',
  'C': 'bg-yellow-100 text-yellow-800',
  'Organic': 'bg-emerald-100 text-emerald-800',
};

const STATUS_BADGES = {
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700 border border-green-200' },
  pending:  { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border border-red-200' },
  sold:     { label: 'Sold Out', cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [error, setError] = useState('');

  const isFarmer = user?.role === 'farmer';
  const isOwnListing = isFarmer && product?.farmer?._id === user?._id;
  const isBuyer = user?.role === 'buyer';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProduct(id);
        const data = response.data || response;
        setProduct(data);
      } catch (err) {
        setError(err.message || 'Failed to load product');
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <Loading fullScreen />;

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-lg">{error || 'Product not found'}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const photos = product.photos?.length ? product.photos : [];
  const statusBadge = STATUS_BADGES[product.status] || STATUS_BADGES.pending;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Product Detail</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Photos ─────────────────────────────────── */}
          <div className="space-y-3">
            {/* Main photo */}
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow">
              {photos.length > 0 ? (
                <img
                  src={getImageUrl(photos[selectedPhoto])}
                  alt={product.cropName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Wheat className="w-24 h-24 text-gray-300" />
                </div>
              )}
              {/* Status badge overlay */}
              <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      selectedPhoto === i ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={getImageUrl(photo)}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ──────────────────────────────────── */}
          <div className="space-y-5">

            {/* Name + grade */}
            <div>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">{product.cropName}</h1>
                {product.grade && (
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${GRADE_COLORS[product.grade] || 'bg-gray-100 text-gray-700'}`}>
                    Grade {product.grade}
                  </span>
                )}
              </div>
              {product.variety && (
                <p className="text-gray-500 mt-1 text-sm">{product.variety}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-primary-600">৳{product.pricePerUnit}</span>
              <span className="text-gray-500 text-lg">/kg</span>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <Weight className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-gray-400">Available</p>
                  <p className="text-sm font-semibold text-gray-800">{product.quantity} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <Package className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-gray-400">Min. Order</p>
                  <p className="text-sm font-semibold text-gray-800">{product.minimumOrderQuantity || 1} kg</p>
                </div>
              </div>
              {product.farmer?.rating?.average > 0 && (
                <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Farmer Rating</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {product.farmer.rating.average.toFixed(1)} / 5
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <Tag className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-gray-400">Views</p>
                  <p className="text-sm font-semibold text-gray-800">{product.viewCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">
                {[product.location?.village, product.location?.thana, product.location?.district]
                  .filter(Boolean).join(', ')}
              </span>
            </div>

            {/* Farmer info */}
            <Card className="bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Farmer</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{product.farmer?.name}</p>
                    {product.farmer?.isVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                {product.farmer?.phone && (
                  <a
                    href={`tel:${product.farmer.phone}`}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    {product.farmer.phone}
                  </a>
                )}
              </div>
            </Card>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Harvest date */}
            {product.harvestDate && (
              <p className="text-xs text-gray-400">
                Harvested: {new Date(product.harvestDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              {isOwnListing && product.status !== 'sold' && (
                <Link
                  to={`/farmer/edit-listing/${product._id}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Listing
                  </Button>
                </Link>
              )}
              {isBuyer && product.status === 'approved' && product.quantity > 0 && (
                <Link to={`/buyer/checkout?product=${product._id}`} className="flex-1">
                  <Button className="w-full flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Buy Now
                  </Button>
                </Link>
              )}
              {isBuyer && (product.status !== 'approved' || product.quantity === 0) && (
                <Button disabled className="flex-1">
                  {product.status === 'sold' ? 'Sold Out' : 'Not Available'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <ProductReviews productId={id} />
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
