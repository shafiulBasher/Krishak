import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ShoppingCart, Star, MapPin, Phone, Mail } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ProductCard = ({ product }) => {
  const { addToCart, loading } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Construct full image URL
  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `${API_BASE_URL}${photoPath}`;
  };

  const handleAddToCart = async () => {
    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    if (quantity > product.quantity) {
      setError(`Only ${product.quantity} kg available`);
      return;
    }

    try {
      setAddingToCart(true);
      setError(null);
      await addToCart(product._id, quantity);
      setSuccess(true);
      setShowModal(false);
      setQuantity(1);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Product Image */}
        <Link to={`/products/${product._id}`} className="block relative overflow-hidden bg-gray-100 h-48">
          {product.photos && product.photos[0] ? (
            <img
              src={getImageUrl(product.photos[0])}
              alt={product.cropName}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <ShoppingCart className="text-gray-400" size={40} />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {product.isPreOrder ? (
              <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                Pre-Order
              </span>
            ) : (
              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                In Stock
              </span>
            )}
          </div>

          {/* Grade Badge */}
          <div className="absolute top-2 left-2">
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
              Grade {product.grade}
            </span>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <Link to={`/products/${product._id}`}>
            <h3 className="font-semibold text-gray-900 hover:text-green-600 truncate">
              {product.cropName}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-600 text-sm mt-1 truncate">
            <MapPin size={14} />
            <span className="truncate">
              {product.location?.village}, {product.location?.district}
            </span>
          </div>

          {/* Quantity Available */}
          <p className="text-sm text-gray-600 mt-2">
            Available: <span className="font-medium">{product.quantity} kg</span>
          </p>

          {/* Farmer Info */}
          <Link 
            to={`/farmer/${product.farmer._id}`}
            className="mt-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors block"
          >
            <p className="text-sm font-medium text-gray-900">{product.farmer.name}</p>
            {product.farmer.phone && (
              <div className="flex items-center gap-1 text-gray-600 text-xs mt-1">
                <Phone size={12} />
                {product.farmer.phone}
              </div>
            )}
            {product.farmer.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600">
                  {product.farmer.rating.average.toFixed(1)} ({product.farmer.rating.count} reviews)
                </span>
              </div>
            )}
          </Link>

          {/* Price and Rating */}
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold text-green-600">
                ৳{product.sellingPrice}
              </p>
              <p className="text-xs text-gray-600">/kg</p>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={() => setShowModal(true)}
            disabled={product.quantity === 0 || loading}
            className={`w-full mt-4 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              product.quantity === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }`}
          >
            <ShoppingCart size={18} />
            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Cost Breakdown */}
          {product.costBreakdown && (
            <details className="mt-3 text-xs text-gray-600">
              <summary className="cursor-pointer font-medium hover:text-gray-900">
                Cost Breakdown
              </summary>
              <div className="mt-2 space-y-1 text-gray-600">
                {product.costBreakdown.seedCost && (
                  <p>Seed: ৳{product.costBreakdown.seedCost}</p>
                )}
                {product.costBreakdown.laborCost && (
                  <p>Labor: ৳{product.costBreakdown.laborCost}</p>
                )}
                {product.costBreakdown.fertilizerCost && (
                  <p>Fertilizer: ৳{product.costBreakdown.fertilizerCost}</p>
                )}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Add to Cart Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            {/* Modal Header */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">{product.cropName}</h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Quantity Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (kg)
              </label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    if (value <= product.quantity) {
                      setQuantity(value);
                    }
                  }}
                  className="flex-grow text-center border-l border-r font-medium"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Available: {product.quantity} kg
              </p>
            </div>

            {/* Price Calculation */}
            <div className="mb-6 p-3 bg-gray-50 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Price per kg:</span>
                <span className="font-medium">৳{product.sellingPrice}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-600 border-t pt-2">
                <span>Total:</span>
                <span>৳{(quantity * product.sellingPrice).toFixed(2)}</span>
              </div>
            </div>

            {/* Farmer Info */}
            <div className="mb-6 p-3 bg-blue-50 rounded">
              <p className="text-sm font-medium text-gray-900">From: {product.farmer.name}</p>
              {product.farmer.phone && (
                <p className="text-xs text-gray-600 mt-1">{product.farmer.phone}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                  setQuantity(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <ShoppingCart size={20} />
          Added to cart successfully!
        </div>
      )}
    </>
  );
};

export default ProductCard;
