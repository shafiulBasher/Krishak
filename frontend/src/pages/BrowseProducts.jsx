import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Loading } from '../components/Loading';
import { Search, Filter, ShoppingCart, MapPin, Package, Star, User } from 'lucide-react';
import { getProducts } from '../services/productService';
import { toast } from 'react-toastify';
import { BANGLADESH_DISTRICTS } from '../utils/bangladeshData';

export const BrowseProducts = () => {
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

  useEffect(() => {
    fetchProducts();
  }, [filters, sortBy]);

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
              <Card key={product._id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Product Image */}
                {product.photos && product.photos.length > 0 ? (
                  <img
                    src={product.photos[0]}
                    alt={product.cropName}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-6xl">🌾</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{product.cropName}</h3>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      Grade {product.grade}
                    </span>
                  </div>

                  {/* Farmer Info with Rating */}
                  {product.farmer && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">{product.farmer.name}</span>
                      {product.farmer.rating?.count > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium text-gray-700">
                            {product.farmer.rating.average.toFixed(1)}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ({product.farmer.rating.count} {product.farmer.rating.count === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {product.location?.village && `${product.location.village}, `}
                    {product.location?.thana && `${product.location.thana}, `}
                    {product.location?.district}
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        ৳{product.sellingPrice?.toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-sm ml-1">/{product.unit || 'kg'}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.quantity} {product.unit || 'kg'} available
                    </span>
                  </div>

                  {/* Price Comparison (if available) */}
                  {product.calculatedPrice && (
                    <div className="bg-blue-50 p-3 rounded mb-3">
                      <h4 className="font-medium text-sm mb-2">Price Comparison</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div>
                          <div className="font-medium">Wholesale</div>
                          <div>৳{((product.calculatedPrice.suggestedPrice || product.sellingPrice) * 0.8).toFixed(2)}</div>
                        </div>
                        <div className="font-semibold text-blue-600">
                          <div className="font-medium">You Pay</div>
                          <div>৳{product.sellingPrice}</div>
                        </div>
                        <div>
                          <div className="font-medium">Retail</div>
                          <div>৳{((product.calculatedPrice.suggestedPrice || product.sellingPrice) * 1.2).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Harvest Date */}
                  {product.harvestDate && (
                    <p className="text-xs text-gray-500 mb-2">
                      Harvested: {new Date(product.harvestDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  {product.isPreOrder && (
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/pre-order/${product._id}`)}
                    >
                      Pre-Order
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

