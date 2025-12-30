import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User, ShoppingCart, Truck, Shield, RefreshCw } from 'lucide-react';
import { getProducts, getFarmerStats } from '../services/productService';
import { getBuyerStats, getTransporterStats } from '../services/orderService';
import { toast } from 'react-toastify';
import PreOrderModal from '../components/PreOrderModal';

export const Dashboard = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const location = useLocation();
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
  }, [user, location.pathname]); // Refresh when location changes (user navigates back)

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
      console.log('✅ Buyer stats response:', response);
      
      // API interceptor returns response.data, so response is already { success: true, data: {...} }
      // Extract the data object
      const stats = response?.data || response || {};
      console.log('📊 Extracted stats:', stats);
      
      if (stats.totalOrders !== undefined || stats.totalSpent !== undefined) {
        setBuyerStats({
          totalOrders: Number(stats.totalOrders) || 0,
          totalSpent: Number(stats.totalSpent) || 0,
          pendingOrders: Number(stats.pendingOrders) || 0,
          completedOrders: Number(stats.completedOrders) || 0
        });
        console.log('✅ Stats updated successfully');
      } else {
        console.warn('⚠️ Stats data structure unexpected:', stats);
      }
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Featured Products</h2>
                <Link to="/browse-products" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{product.cropName}</h3>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          Grade {product.grade}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-2">
                        {product.location.village}, {product.location.district}
                      </p>

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-primary-600">
                          ৳{product.sellingPrice}/{product.unit}
                        </span>
                        <span className="text-sm text-gray-500">
                          {product.quantity} {product.unit} available
                        </span>
                      </div>

                      {/* Cost Breakdown for Buyers */}
                      {product.costBreakdown && (
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <h4 className="font-medium text-sm mb-2">Cost Breakdown</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Seed: ৳{product.costBreakdown.seedCost || 0}</div>
                            <div>Fertilizer: ৳{product.costBreakdown.fertilizerCost || 0}</div>
                            <div>Labor: ৳{product.costBreakdown.laborCost || 0}</div>
                            <div>Transport: ৳{product.costBreakdown.transportCost || 0}</div>
                          </div>
                          <div className="mt-2 pt-2 border-t text-xs">
                            <div className="flex justify-between">
                              <span>Total Cost:</span>
                              <span>৳{(product.costBreakdown.seedCost + product.costBreakdown.fertilizerCost + product.costBreakdown.laborCost + product.costBreakdown.transportCost + (product.costBreakdown.otherCost || 0)).toFixed(2)}</span>
                            </div>
                            {product.calculatedPrice && (
                              <div className="flex justify-between text-green-600">
                                <span>Farmer Earnings:</span>
                                <span>৳{(product.sellingPrice - (product.costBreakdown.seedCost + product.costBreakdown.fertilizerCost + product.costBreakdown.laborCost + product.costBreakdown.transportCost + (product.costBreakdown.otherCost || 0)) / product.quantity).toFixed(2)}/{product.unit}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price Comparison */}
                      {product.calculatedPrice && (
                        <div className="bg-blue-50 p-3 rounded">
                          <h4 className="font-medium text-sm mb-2">Price Comparison</h4>
                          <div className="grid grid-cols-3 gap-2 text-xs text-center">
                            <div>
                              <div className="font-medium">Wholesale</div>
                              <div>৳{(product.calculatedPrice.suggestedPrice * 0.8).toFixed(2)}</div>
                            </div>
                            <div className="font-semibold text-blue-600">
                              <div className="font-medium">You Pay</div>
                              <div>৳{product.sellingPrice}</div>
                            </div>
                            <div>
                              <div className="font-medium">Retail</div>
                              <div>৳{(product.calculatedPrice.suggestedPrice * 1.2).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => {
                            addToCart(product, 1);
                            toast.success(`${product.cropName} added to cart!`);
                          }}
                          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition"
                        >
                          Add to Cart
                        </button>
                        {product.isPreOrder && (
                          <button
                            onClick={() => handlePreOrder(product)}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                          >
                            Pre-Order
                          </button>
                        )}
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
