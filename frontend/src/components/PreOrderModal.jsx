import { useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { createOrder } from '../services/orderService';
import { useLanguage } from '../context/LanguageContext';

const PreOrderModal = ({ product, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    quantity: 1,
    pricePerUnit: product.sellingPrice,
    deliveryAddress: {
      addressLine: '',
      thana: '',
      district: ''
    },
    paymentMethod: 'cash_on_delivery'
  });
  const [loading, setLoading] = useState(false);

  const paymentOptions = [
    { value: 'cash_on_delivery', label: t('components.preOrder.cashOnDelivery') },
    { value: 'bkash', label: t('components.preOrder.bkash') },
    { value: 'nagad', label: t('components.preOrder.nagad') },
    { value: 'bank_transfer', label: t('components.preOrder.bankTransfer') }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        productId: product._id,
        quantity: parseInt(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        isPreOrder: true
      };

      await createOrder(orderData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating pre-order:', error);
      alert(error.response?.data?.message || 'Failed to place pre-order');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = formData.quantity * formData.pricePerUnit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{t('components.preOrder.title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold">{product.cropName}</h3>
            <p className="text-sm text-gray-600">{t('common.grade', { g: product.grade })} • {product.location.village}, {product.location.district}</p>
            <p className="text-sm text-gray-600">Expected Harvest: {new Date(product.expectedHarvestDate).toLocaleDateString()}</p>
          </div>

          {/* Quantity */}
          <Input
            label={t('components.preOrder.quantity')}
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            max={product.quantity}
            required
          />

          {/* Price per unit */}
          <Input
            label={t('components.preOrder.agreedPrice')}
            type="number"
            name="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />

          {/* Total Price */}
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm font-medium">{t('components.preOrder.totalPrice', { price: totalPrice.toFixed(2) })}</p>
          </div>

          {/* Delivery Address */}
          <div className="space-y-3">
            <h4 className="font-medium">{t('components.preOrder.deliveryAddress')}</h4>
            <Input
              label={t('components.preOrder.addressLine')}
              name="deliveryAddress.addressLine"
              value={formData.deliveryAddress.addressLine}
              onChange={handleChange}
              placeholder={t('components.preOrder.addressPlaceholder')}
              required
            />
            <Input
              label={t('components.preOrder.thana')}
              name="deliveryAddress.thana"
              value={formData.deliveryAddress.thana}
              onChange={handleChange}
              placeholder={t('components.preOrder.thanaPlaceholder')}
              required
            />
            <Input
              label={t('components.preOrder.district')}
              name="deliveryAddress.district"
              value={formData.deliveryAddress.district}
              onChange={handleChange}
              placeholder={t('components.preOrder.districtPlaceholder')}
              required
            />
          </div>

          {/* Payment Method */}
          <Select
            label={t('components.preOrder.paymentMethod')}
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={paymentOptions}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('components.preOrder.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('components.preOrder.placing') : t('components.preOrder.placeOrder')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreOrderModal;