import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { orderService } from '../../services/orderService';
import { toast } from 'react-toastify';
import { Package, Calendar, DollarSign, User, Eye, Truck } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';

const FarmerOrders = () => {
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
    setLoading(true);
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDeliveryStatusColor = (status) => {
    const colors = {
      not_assigned: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      picked: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDeliveryStatusText = (status) => {
    const texts = {
      not_assigned: 'Not Assigned',
      assigned: 'Assigned',
      picked: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered'
    };
    return texts[status] || status;
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === filter);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600">Track and manage orders for your products</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: 'All Orders', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                {orders.filter(o => o.orderStatus === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't received any orders yet."
                : `No ${filter} orders found.`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order._id} className="hover:shadow-lg transition cursor-pointer">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Section - Order Info */}
                <div className="flex-1 space-y-3">
                  {/* Product Info */}
                  <div className="flex items-start gap-3">
                    {order.product?.photos?.[0] && (
                      <img
                        src={getImageUrl(order.product.photos[0])}
                        alt={order.product.cropName}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.product?.cropName || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Grade: {order.product?.grade || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {order.quantity} {order.product?.unit || 'units'}
                      </p>
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Buyer: {order.buyer?.name || 'Unknown'}</span>
                  </div>

                  {/* Order Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span>৳{order.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Right Section - Status & Actions */}
                <div className="flex flex-col gap-3 lg:items-end">
                  {/* Order Status */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
                    </span>
                  </div>

                  {/* Delivery Status */}
                  {(order.deliveryInfo?.status || order.deliveryStatus) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Delivery Status
                      </p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getDeliveryStatusColor(order.deliveryInfo?.status || order.deliveryStatus)}`}>
                        {getDeliveryStatusText(order.deliveryInfo?.status || order.deliveryStatus)}
                      </span>
                      {order.deliveryInfo?.transporter && (
                        <p className="text-xs text-gray-600 mt-1">
                          Transporter: {order.deliveryInfo.transporter.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/farmer/orders/${order._id}`)}
                    className="w-full lg:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
