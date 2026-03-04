import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { User, ShoppingCart, Truck, Shield, RefreshCw, ArrowRight, MapPin } from 'lucide-react';
import { getProducts, getFarmerStats } from '../services/productService';
import { getBuyerStats, getTransporterStats } from '../services/orderService';
import { toast } from 'react-toastify';
import PreOrderModal from '../components/PreOrderModal';

export const Dashboard = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [farmerStats, setFarmerStats] = useState({
    activeListings: 0,
    pendingListings: 0,
    totalOrders: 0,
    totalEarnings: 0
  });
  const [buyerStats, setBuyerStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [transporterStats, setTransporterStats] = useState({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedTrips: 0,
    totalEarnings: 0
  });

  // Redirect admin users to the proper admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect transporter users to the proper transporter dashboard
  if (user?.role === 'transporter') {
    return <Navigate to="/transporter/dashboard" replace />;
  }

  useEffect(() => {
    if (!user) return;
    
    // Fetch stats based on user role
    if (user.role === 'buyer') {
      fetchProducts();
      fetchBuyerStats();
    } else if (user.role === 'farmer') {
      fetchFarmerStats();
    } else if (user.role === 'transporter') {
      fetchTransporterStats();
    }
  }, [user?.role]); // Re-run only when the user's role changes

  const fetchFarmerStats = async () => {
    try {
      const response = await getFarmerStats();
      // API interceptor returns response.data, so response is already { success: true, data: {...} }
      const stats = response?.data || response || {};
      setFarmerStats({
        activeListings: Number(stats.activeListings) || 0,
        pendingListings: Number(stats.pendingListings) || 0,
        totalOrders: Number(stats.totalOrders) || 0,
        totalEarnings: Number(stats.totalEarnings) || 0
      });
    } catch (error) {
      console.error('Error fetching farmer stats:', error);
      setFarmerStats({
        activeListings: 0,
        pendingListings: 0,
        totalOrders: 0,
        totalEarnings: 0
      });
    }
  };

  const fetchBuyerStats = async () => {
    try {
      console.log('🔄 Fetching buyer stats from:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No auth token found');
        return;
      }
      
      const response = await getBuyerStats();
      console.log('✅ Buyer stats response (full):', JSON.stringify(response, null, 2));
      
      // API interceptor returns response.data
      // Backend sends: { success: true, data: { totalOrders, ... } }
      // Interceptor extracts: response.data = { success: true, data: {...} }
      // So response = { success: true, data: { totalOrders, pendingOrders, ... } }
      // We need response.data to get the actual stats
      const stats = response?.data || {};
      console.log('📊 Extracted stats object:', stats);
      console.log('📊 Stats values:', {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        pendingOrders: stats.pendingOrders,
        completedOrders: stats.completedOrders
      });
      
      // Always update stats (even if 0)
      const updatedStats = {
        totalOrders: Number(stats.totalOrders ?? 0),
        totalSpent: Number(stats.totalSpent ?? 0),
        pendingOrders: Number(stats.pendingOrders ?? 0),
        completedOrders: Number(stats.completedOrders ?? 0)
      };
      
      setBuyerStats(updatedStats);
      console.log('✅ Stats state updated:', updatedStats);
    } catch (error) {
      console.error('❌ Error fetching buyer stats:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      
      // If it's a 404, the route might not exist
      if (error.status === 404 || error.message?.includes('404')) {
        console.error('⚠️ Route not found (404). Backend might not be running or route not registered.');
        console.error('💡 Try: 1) Hard refresh browser (Ctrl+Shift+R), 2) Check backend is running, 3) Restart backend server');
      }
      
      // Set default values on error
      setBuyerStats({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        completedOrders: 0
      });
    }
  };

  const fetchTransporterStats = async () => {
    try {
      const response = await getTransporterStats();
      // API interceptor returns response.data, so response is already { success: true, data: {...} }
      const stats = response?.data || response || {};
      setTransporterStats({
        totalDeliveries: Number(stats.totalDeliveries) || 0,
        activeDeliveries: Number(stats.activeDeliveries) || 0,
        completedTrips: Number(stats.completedTrips) || 0,
        totalEarnings: Number(stats.totalEarnings) || 0
      });
    } catch (error) {
      console.error('Error fetching transporter stats:', error);
      setTransporterStats({
        totalDeliveries: 0,
        activeDeliveries: 0,
        completedTrips: 0,
        totalEarnings: 0
      });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({ status: 'approved', limit: 6 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreOrder = (product) => {
    setSelectedProduct(product);
    setShowPreOrderModal(true);
  };

  const handlePreOrderSuccess = () => {
    toast.success('Pre-order placed successfully!');
    fetchProducts(); // Refresh products
  };

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'farmer':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">{farmerStats.activeListings}</h3>
                <p className="text-gray-600 mt-2">Active Listings</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-yellow-600">{farmerStats.pendingListings}</h3>
                <p className="text-gray-600 mt-2">Pending Listings</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-blue-600">{farmerStats.totalOrders}</h3>
                <p className="text-gray-600 mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-green-600">৳{farmerStats.totalEarnings.toLocaleString()}</h3>
                <p className="text-gray-600 mt-2">Total Earnings</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/farmer/create-listing" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">+ Create New Listing</p>
                  <p className="text-sm text-gray-600">Add a new product to sell</p>
                </Link>
                <Link to="/farmer/my-listings" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">View My Listings</p>
                  <p className="text-sm text-gray-600">Manage your products</p>
                </Link>
                <Link to="/farmer/orders" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                  <p className="font-medium text-blue-700">View My Orders</p>
                  <p className="text-sm text-gray-600">Track orders and shipments</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      case 'buyer':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Statistics</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  fetchBuyerStats();
                  fetchProducts();
                  toast.info('Stats refreshed');
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">{buyerStats.totalOrders}</h3>
                <p className="text-gray-600 mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳{buyerStats.totalSpent.toLocaleString()}</h3>
                <p className="text-gray-600 mt-2">Total Spent</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-yellow-600">{buyerStats.pendingOrders}</h3>
                <p className="text-gray-600 mt-2">Pending Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-green-600">{buyerStats.completedOrders}</h3>
                <p className="text-gray-600 mt-2">Completed Orders</p>
              </Card>
            </div>

            <div className="flex justify-end">
              <Link to="/buyer/orders">
                <Button variant="secondary">
                  View All Orders →
                </Button>
              </Link>
            </div>


            {/* Featured Products */}
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                <Link to="/browse-products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-12"><Loading /></div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      {/* Product Image */}
                      {product.photos && product.photos.length > 0 ? (
                        <div className="w-full h-48 overflow-hidden group">
                          <img
                            src={`http://localhost:5000${product.photos[0]}`}
                            alt={product.cropName}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          <div className="image-placeholder hidden w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                            <span className="text-7xl opacity-60">🌾</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          <span className="text-7xl opacity-60">🌾</span>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-gray-900 flex-1">{product.cropName}</h3>
                          <span className="text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full shadow-sm">
                            Grade {product.grade}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600 text-sm mb-3">
                          <MapPin className="w-4 h-4 mr-2 text-red-500" />
                          <span className="font-medium">
                            {product.location.village}, {product.location.district}
                          </span>
                        </div>

                        <div className="flex justify-between items-end mb-3 pb-3 border-b border-gray-100">
                          <div>
                            <div className="text-xs text-gray-500 mb-1 font-medium">Price</div>
                            <div>
                              <span className="text-3xl font-bold text-primary-600">
                                ৳{product.sellingPrice}
                              </span>
                              <span className="text-gray-500 text-base ml-1 font-medium">/{product.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Available</div>
                            <span className="text-sm font-bold text-gray-700">
                              {product.quantity} {product.unit}
                            </span>
                          </div>
                        </div>

                        {/* Price Comparison - Only show market comparison, not cost breakdown */}
                        {product.calculatedPrice && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-3 border border-blue-100">
                            <h4 className="font-semibold text-sm mb-2 text-gray-700">Market Price Comparison</h4>
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

                        <div className="flex space-x-2 mt-2 pt-2 border-t border-gray-100">
                          <Button
                            onClick={() => {
                              addToCart(product, 1);
                              toast.success(`${product.cropName} added to cart!`);
                            }}
                            className="flex-1"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            <span>Add to Cart</span>
                          </Button>
                          {product.isPreOrder && (
                            <Button
                              variant="secondary"
                              onClick={() => handlePreOrder(product)}
                            >
                              Pre-Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No products available at the moment.
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/browse-products" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">Browse Products</p>
                  <p className="text-sm text-gray-600">Find fresh produce from farmers</p>
                </Link>
                <Link to="/buyer/addresses" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">Delivery Addresses</p>
                  <p className="text-sm text-gray-600">Manage your delivery locations</p>
                </Link>
                <Link to="/buyer/orders" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">My Orders</p>
                  <p className="text-sm text-gray-600">Track your purchases</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      case 'transporter':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">{transporterStats.totalDeliveries}</h3>
                <p className="text-gray-600 mt-2">Total Deliveries</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-yellow-600">{transporterStats.activeDeliveries}</h3>
                <p className="text-gray-600 mt-2">Active Deliveries</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-green-600">{transporterStats.completedTrips}</h3>
                <p className="text-gray-600 mt-2">Completed Trips</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳{transporterStats.totalEarnings.toLocaleString()}</h3>
                <p className="text-gray-600 mt-2">Total Earnings</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/deliveries" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">Available Jobs</p>
                  <p className="text-sm text-gray-600">Find delivery jobs near you</p>
                </Link>
                <Link to="/deliveries/active" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">My Deliveries</p>
                  <p className="text-sm text-gray-600">Track your assigned deliveries</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Pending Listings</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Total Users</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳0</h3>
                <p className="text-gray-600 mt-2">Platform Revenue</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
              <div className="space-y-2">
                <Link to="/admin/listings" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">Moderate Listings</p>
                  <p className="text-sm text-gray-600">Approve or reject farmer listings</p>
                </Link>
                <Link to="/admin/users" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">Manage Users</p>
                  <p className="text-sm text-gray-600">View and manage all users</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'farmer':
        return <User className="w-12 h-12 text-primary-600" />;
      case 'buyer':
        return <ShoppingCart className="w-12 h-12 text-primary-600" />;
      case 'transporter':
        return <Truck className="w-12 h-12 text-primary-600" />;
      case 'admin':
        return <Shield className="w-12 h-12 text-primary-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <div className="flex items-center">
            {getRoleIcon()}
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 capitalize">{user?.role} Dashboard</p>
            </div>
          </div>
        </Card>

        {getDashboardContent()}
      </div>


      {showPreOrderModal && selectedProduct && (
        <PreOrderModal
          product={selectedProduct}
          onClose={() => setShowPreOrderModal(false)}
          onSuccess={handlePreOrderSuccess}
        />
      )}

    </div>
  );
};
