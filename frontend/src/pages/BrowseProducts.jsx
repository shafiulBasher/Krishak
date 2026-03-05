import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Loading } from '../components/Loading';
import { Search, Filter, ShoppingCart, MapPin, Package, Star, User, MessageSquare, X } from 'lucide-react';
import { getProducts } from '../services/productService';
import { toast } from 'react-toastify';
import { BANGLADESH_DISTRICTS } from '../utils/bangladeshData';
import ProductReviews from '../components/ProductReviews';
import MapSelector from '../components/MapSelector';

export const BrowseProducts = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    cropName: '',
    district: '',
    grade: '',
    minPrice: '',
    maxPrice: ''
  });
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, price-high
  const [selectedProductForReviews, setSelectedProductForReviews] = useState(null);
  const [buyerLocation, setBuyerLocation] = useState(() => {
    try {
      const stored = localStorage.getItem('buyerDeliveryLocation');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showLocationGate, setShowLocationGate] = useState(false);
  const [showLocationMapSelector, setShowLocationMapSelector] = useState(false);

  useEffect(() => {
    // Show location gate for buyers who haven't set a delivery location
    if (user?.role === 'buyer' && !buyerLocation) {
      setShowLocationGate(true);
    }
    fetchProducts();
  }, [filters, sortBy, buyerLocation]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = {
        status: 'approved'
      };

      // Add filters
      if (filters.cropName) queryParams.cropName = filters.cropName;
      if (filters.district) queryParams.district = filters.district;
      if (filters.grade) queryParams.grade = filters.grade;

      // Add proximity filter if buyer location is set
      if (user?.role === 'buyer' && buyerLocation?.lat && buyerLocation?.lng) {
        queryParams.lat = buyerLocation.lat;
        queryParams.lng = buyerLocation.lng;
        queryParams.radius = 50;
      }

      const response = await getProducts(queryParams);
      let fetchedProducts = response.data || [];

      // Client-side filtering for price range
      if (filters.minPrice) {
        fetchedProducts = fetchedProducts.filter(
          p => p.sellingPrice >= parseFloat(filters.minPrice)
        );
      }
      if (filters.maxPrice) {
        fetchedProducts = fetchedProducts.filter(
          p => p.sellingPrice <= parseFloat(filters.maxPrice)
        );
      }

      // Client-side search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        fetchedProducts = fetchedProducts.filter(product =>
          product.cropName.toLowerCase().includes(term) ||
          product.location?.district?.toLowerCase().includes(term) ||
          product.location?.thana?.toLowerCase().includes(term)
        );
      }

      // Sorting
      fetchedProducts.sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return a.sellingPrice - b.sellingPrice;
          case 'price-high':
            return b.sellingPrice - a.sellingPrice;
          case 'newest':
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });

      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      cropName: '',
      district: '',
      grade: '',
      minPrice: '',
      maxPrice: ''
    });
    setSortBy('newest');
  };

  const handleLocationSelect = (coords, address) => {
    const location = { lat: coords.lat, lng: coords.lng, label: address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` };
    setBuyerLocation(location);
    localStorage.setItem('buyerDeliveryLocation', JSON.stringify(location));
    setShowLocationGate(false);
    setShowLocationMapSelector(false);
    toast.success('Delivery location set! Showing nearby products.');
  };

  const handleClearLocation = () => {
    setBuyerLocation(null);
    localStorage.removeItem('buyerDeliveryLocation');
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.cropName} added to cart!`);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length + (searchTerm ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Browse Products</h1>
          <p className="text-gray-600 mt-1">Find the best agricultural products from local farmers</p>
        </div>

        {/* Buyer Location Banner */}
        {user?.role === 'buyer' && (
          <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
            buyerLocation ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className={`w-4 h-4 flex-shrink-0 ${buyerLocation ? 'text-green-600' : 'text-yellow-600'}`} />
              {buyerLocation ? (
                <span className="text-green-800">
                  Showing products within 50km of <strong>{buyerLocation.label}</strong>
                </span>
              ) : (
                <span className="text-yellow-800">
                  Set your delivery location to see nearby products within 50km
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowLocationMapSelector(true)}>
                <MapPin className="w-3 h-3 mr-1" />
                {buyerLocation ? 'Change' : 'Set Location'}
              </Button>
              {buyerLocation && (
                <button onClick={handleClearLocation} className="text-gray-400 hover:text-gray-600" title="Clear location (show all)">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by crop name, district, or location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <Button type="submit">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Name
              </label>
              <input
                type="text"
                value={filters.cropName}
                onChange={(e) => handleFilterChange('cropName', e.target.value)}
                placeholder="e.g., Rice, Potato"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Districts</option>
                {BANGLADESH_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                value={filters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (৳)
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (৳)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort and Clear */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="secondary" onClick={clearFilters} size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `Found ${products.length} product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-6">
              {activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'No products available at the moment'}
            </p>
            {activeFiltersCount > 0 && (
              <Button onClick={clearFilters}>Clear All Filters</Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200">
                {/* Product Image */}
                <div className="w-full h-56 relative overflow-hidden group">
                  {product.photos && product.photos.length > 0 ? (
                    <img
                      src={`http://localhost:5000${product.photos[0]}`}
                      alt={product.cropName}
                      className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        // Hide image and show placeholder on error
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`image-placeholder w-full h-56 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center ${product.photos && product.photos.length > 0 ? 'hidden' : ''}`}>
                    <span className="text-7xl opacity-60">🌾</span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 flex-1">{product.cropName}</h3>
                    <span className="text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full shadow-sm">
                      Grade {product.grade}
                    </span>
                  </div>

                  {/* Farmer Info with Rating */}
                  {product.farmer && (
                    <div className="flex items-center gap-2 mb-2 text-sm bg-gray-50 p-2 rounded-lg">
                      <User className="w-4 h-4 text-primary-600" />
                      <span className="text-gray-700 font-semibold">{product.farmer.name}</span>
                      {product.farmer.rating?.count > 0 && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-bold text-gray-900">
                            {product.farmer.rating.average.toFixed(1)}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ({product.farmer.rating.count})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Rating */}
                  {product.reviewCount > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900 text-sm">
                          {product.averageRating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-600 text-xs">
                          ({product.reviewCount})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium">
                      {product.location?.village && `${product.location.village}, `}
                      {product.location?.thana && `${product.location.thana}, `}
                      {product.location?.district}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 mb-1 font-medium">Price</div>
                      <div>
                        <span className="text-3xl font-bold text-primary-600">
                          ৳{product.sellingPrice?.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-base ml-1 font-medium">/{product.unit || 'kg'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Available</div>
                      <span className="text-sm font-bold text-gray-700">
                        {product.quantity} {product.unit || 'kg'}
                      </span>
                    </div>
                  </div>

                  {/* Price Comparison (if available) */}
                  {product.calculatedPrice && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-3 border border-blue-100">
                      <h4 className="font-semibold text-sm mb-2 text-gray-700">Price Comparison</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-xs font-medium text-gray-500 mb-1">Wholesale</div>
                          <div className="text-sm font-bold text-gray-700 bg-white py-2 rounded-md shadow-sm">৳{((product.calculatedPrice.suggestedPrice || product.sellingPrice) * 0.8).toFixed(0)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-blue-600 mb-1">You Pay</div>
                          <div className="text-base font-bold text-blue-600 bg-white py-2 rounded-md shadow-md border-2 border-blue-500">৳{product.sellingPrice}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-gray-500 mb-1">Retail</div>
                          <div className="text-sm font-bold text-gray-700 bg-white py-2 rounded-md shadow-sm">৳{((product.calculatedPrice.suggestedPrice || product.sellingPrice) * 1.2).toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Harvest Date */}
                  {product.harvestDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Harvested:</span>
                      <span>{new Date(product.harvestDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {/* Actions */}
                  <div className="flex flex-col space-y-2 mt-2 pt-2 border-t border-gray-100">
                    <div className="flex space-x-2">
                      {user?.role === 'buyer' && (
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          <span>Add to Cart</span>
                        </Button>
                      )}
                    {product.isPreOrder && user?.role === 'buyer' && (
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/pre-order/${product._id}`)}
                      >
                        Pre-Order
                      </Button>
                    )}
                  </div>
                  {product.reviewCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProductForReviews(product._id)}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Reviews ({product.reviewCount})
                    </Button>
                  )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reviews Modal */}
        {selectedProductForReviews && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Product Reviews</h2>
                <button
                  onClick={() => setSelectedProductForReviews(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <ProductReviews productId={selectedProductForReviews} />
              </div>
            </div>
          </div>
        )}

        {/* Location Gate Modal (shown when buyer has no location set) */}
        {showLocationGate && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
              <div className="text-center mb-5">
                <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900">Set Your Delivery Location</h2>
                <p className="text-gray-600 mt-2 text-sm">
                  KRISHAK shows you products within 50km of your delivery location.
                  Pin your location to see relevant products.
                </p>
              </div>
              <div className="space-y-3">
                <Button fullWidth onClick={() => { setShowLocationGate(false); setShowLocationMapSelector(true); }}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Pin My Location on Map
                </Button>
                <Button fullWidth variant="secondary" onClick={() => setShowLocationGate(false)}>
                  Browse All Products
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Location MapSelector */}
        {showLocationMapSelector && (
          <MapSelector
            onSelect={handleLocationSelect}
            onClose={() => setShowLocationMapSelector(false)}
            initialPosition={buyerLocation}
          />
        )}
      </div>
    </div>
  );
};

