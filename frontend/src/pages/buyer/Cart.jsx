import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, loading } = useContext(CartContext);
  const [quantities, setQuantities] = useState({});

  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `${API_BASE_URL}${photoPath}`;
  };

  React.useEffect(() => {
    // Initialize quantities from cart
    if (cart && cart.items && Array.isArray(cart.items)) {
      const initialQuantities = {};
      cart.items.forEach(item => {
        if (item.product && item.product._id) {
          initialQuantities[item.product._id] = item.quantity;
        }
      });
      setQuantities(initialQuantities);
    }
  }, [cart]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
      await updateCartItem(productId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      const currentItem = cart?.items?.find(item => item.product._id === productId);
      setQuantities(prev => ({
        ...prev,
        [productId]: currentItem?.quantity || 1
      }));
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
      const newQuantities = { ...quantities };
      delete newQuantities[productId];
      setQuantities(newQuantities);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Link to="/" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {cart.items.map((item) => (
                <div key={item.product._id} className="p-6 border-b last:border-b-0">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.photos?.[0] ? (
                        <img 
                          src={getImageUrl(item.product.photos[0])} 
                          alt={item.product.cropName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <ShoppingCart className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.product.cropName}</h3>
                          <p className="text-sm text-gray-600">Grade: {item.product.grade}</p>
                          <p className="text-sm text-gray-600">Farmer: {item.farmer.name}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.product._id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.product._id, quantities[item.product._id] - 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantities[item.product._id] || item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              handleQuantityChange(item.product._id, value);
                            }}
                            className="w-12 text-center border-l border-r"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.product._id, quantities[item.product._id] + 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="text-sm text-gray-600">kg</span>
                      </div>

                      {/* Price */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Price: ৳{item.pricePerUnit}/kg</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ৳{(item.totalPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">৳{(cart.cartSummary?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee (5%)</span>
                  <span className="font-medium">৳{(cart.cartSummary?.platformFee || 0).toFixed(2)}</span>
                </div>
                {cart.cartSummary?.estimatedDeliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">৳{(cart.cartSummary.estimatedDeliveryFee || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-green-600">
                  ৳{(cart.cartSummary?.total || 0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={20} />
              </button>

              <Link to="/" className="block text-center mt-4 text-green-600 hover:text-green-700 font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
