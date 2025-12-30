import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { Package, Clock, CheckCircle, XCircle, ArrowRight, Calendar, MapPin, Truck } from 'lucide-react';
import { getMyOrders } from '../../services/orderService';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';

export const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getMyOrders();
      // Filter to show only buyer's orders
      const buyerOrders = (response.data || []).filter(order => 
        order.buyer && (typeof order.buyer === 'object' ? order.buyer._id : order.buyer)
      );
      setOrders(buyerOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'confirmed':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDeliveryStatusColor = (status) => {
    const colors = {
      not_assigned: 'bg-gray-100 text-gray-700 border-gray-300',
      assigned: 'bg-blue-100 text-blue-700 border-blue-300',
      picked: 'bg-purple-100 text-purple-700 border-purple-300',
      in_transit: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      delivered: 'bg-green-100 text-green-700 border-green-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getDeliveryStatusText = (status) => {
    const texts = {
      not_assigned: 'Awaiting Delivery Partner',
      assigned: 'Delivery Partner Assigned',
      picked: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered'
    };
    return texts[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === filter);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">View and track all your orders</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === tab.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({tab.value === 'all' ? orders.length : orders.filter(o => o.orderStatus === tab.value).length})
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No ${filter} orders found`}
            </p>
            {filter === 'all' && (
              <Link to="/dashboard">
                <Button>Browse Products</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order._id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                            {getStatusIcon(order.orderStatus)}
                            <span className="ml-1 capitalize">{order.orderStatus}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                        {/* Delivery Status Badge */}
                        {order.deliveryInfo?.status && (
                          <div className="flex items-center gap-2 mt-2">
                            <Truck className="w-4 h-4 text-gray-500" />
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getDeliveryStatusColor(order.deliveryInfo.status)}`}>
                              {getDeliveryStatusText(order.deliveryInfo.status)}
                            </span>
                            {order.deliveryInfo.transporter && (
                              <span className="text-xs text-gray-600">
                                • {order.deliveryInfo.transporter.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    {order.product && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-4">
                          {order.product.photos && order.product.photos.length > 0 ? (
                            <img
                              src={getImageUrl(order.product.photos[0])}
                              alt={order.product.cropName}
                              className="w-20 h-20 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center" style={{ display: order.product.photos && order.product.photos.length > 0 ? 'none' : 'flex' }}>
                            <span className="text-3xl">🌾</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{order.product.cropName}</h4>
                            <p className="text-sm text-gray-600">Grade {order.product.grade}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Quantity: {order.quantity} {order.product.unit || 'kg'}
                            </p>
                            <p className="text-sm font-medium text-primary-600 mt-1">
                              ৳{order.pricePerUnit?.toLocaleString()}/{order.product.unit || 'kg'} × {order.quantity} = ৳{order.totalPrice?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {order.deliveryAddress && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                            <p className="text-sm text-gray-600">
                              {order.deliveryAddress.addressLine}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.deliveryAddress.thana}, {order.deliveryAddress.district}
                            </p>
                          </div>
                        </div>
                      )}

                      {order.deliverySlot && (
                        <div className="flex items-start space-x-2">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Delivery Slot</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(order.deliverySlot.date)}
                            </p>
                            {order.deliverySlot.timeSlot && (
                              <p className="text-sm text-gray-600">
                                {order.deliverySlot.timeSlot}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Payment: <span className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</span>
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus || 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="lg:w-48 flex flex-col space-y-2">
                    <div className="text-right mb-2">
                      <p className="text-2xl font-bold text-primary-600">
                        ৳{order.totalPrice?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Amount</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/buyer/orders/${order._id}`)}
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

