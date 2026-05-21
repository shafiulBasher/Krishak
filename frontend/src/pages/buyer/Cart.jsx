import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';
import { useLanguage } from '../../context/LanguageContext';

export const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart, getCartTotalQuantity } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error(t('buyer.cart.emptyCart'));
      return;
    }
    
    // Check if any item is below MOQ
    const itemsBelowMOQ = cartItems.filter(item => 
      item.product.moq && item.quantity < item.product.moq
    );
    
    if (itemsBelowMOQ.length > 0) {
      const firstItem = itemsBelowMOQ[0];
      toast.error(t('buyer.cart.moqError', { name: firstItem.product.cropName, moq: firstItem.product.moq, unit: firstItem.product.unit }));
      return;
    }
    
    navigate('/buyer/checkout');
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
    toast.success(t('buyer.cart.removeItem'));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const item = cartItems.find((item) => item.product._id === productId);
    if (item) {
      if (newQuantity < 1) {
        return;
      }
      
      if (newQuantity > item.product.quantity) {
        toast.error(t('buyer.cart.onlyAvailable', { count: item.product.quantity, unit: item.product.unit }));
        return;
      }
      
      updateQuantity(productId, newQuantity);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('buyer.cart.empty')}</h2>
            <p className="text-gray-600 mb-6">{t('buyer.cart.emptyDesc')}</p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/dashboard')}>
                {t('buyer.cart.browseProducts')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('buyer.cart.shoppingCart')}</h1>
          <p className="text-gray-600 mt-1">{t('buyer.cart.itemCount', { count: cartItems.length })}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.product._id} className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Product Image */}
                  {item.product.photos && item.product.photos.length > 0 ? (
                    <img
                      src={getImageUrl(item.product.photos[0])}
                      alt={item.product.cropName}
                      className="w-full sm:w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="60" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🌾%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full sm:w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🌾</span>
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {item.product.cropName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {t('common.grade', { g: item.product.grade })} • {item.product.location?.district || 'N/A'}
                        </p>
                        {item.product.moq && (
                          <p className="text-xs text-blue-600 mt-1">
                            {t('buyer.cart.minOrder', { moq: item.product.moq, unit: item.product.unit })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.product._id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-100"
                          disabled={item.quantity >= item.product.quantity}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 ml-2">
                          {item.product.unit}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary-600">
                          ৳{(item.pricePerUnit * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          ৳{item.pricePerUnit.toLocaleString()}/{item.product.unit}
                        </p>
                      </div>
                    </div>

                    {item.quantity >= item.product.quantity && (
                      <p className="text-sm text-amber-600 mt-2">
                        {t('buyer.cart.maxReached')}
                      </p>
                    )}
                    {item.product.moq && item.quantity < item.product.moq && (
                      <p className="text-sm text-orange-600 mt-2 font-medium">
                        {t('buyer.cart.belowMoq', { moq: item.product.moq, unit: item.product.unit })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h2 className="text-xl font-semibold mb-4">{t('buyer.cart.orderSummary')}</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>{t('buyer.cart.subtotal', { count: getCartTotalQuantity() })}</span>
                  <span>৳{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 italic">
                  <span>{t('buyer.cart.deliveryFee')}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t('buyer.cart.total')}</span>
                    <span className="text-primary-600">
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full mb-3"
                size="lg"
              >
                {t('buyer.cart.checkout')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-center text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                {t('buyer.cart.continueShopping')}
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

