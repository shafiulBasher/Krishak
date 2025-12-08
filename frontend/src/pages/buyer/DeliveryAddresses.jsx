import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../services/userService';

export const DeliveryAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    recipientName: '',
    recipientPhone: '',
    addressLine1: '',
    addressLine2: '',
    village: '',
    thana: '',
    district: '',
    postalCode: '',
    isDefault: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await getAddresses();
      // API interceptor already unwraps response.data, so response.data contains the actual data
      setAddresses(response.data || []);
      setError('');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load addresses');
      setAddresses([]); // Ensure addresses is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      label: '',
      recipientName: '',
      recipientPhone: '',
      addressLine1: '',
      addressLine2: '',
      village: '',
      thana: '',
      district: '',
      postalCode: '',
      isDefault: false
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (address) => {
    setFormData({
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      village: address.village || '',
      thana: address.thana,
      district: address.district,
      postalCode: address.postalCode || '',
      isDefault: address.isDefault
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updateAddress(editingId, formData);
        setSuccess('Address updated successfully!');
      } else {
        await addAddress(formData);
        setSuccess('Address added successfully!');
      }
      await fetchAddresses();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save address');
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await deleteAddress(addressId);
      setSuccess('Address deleted successfully!');
      await fetchAddresses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      setSuccess('Default address updated!');
      await fetchAddresses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to set default address');
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Addresses</h1>
            <p className="text-gray-600 mt-1">Manage your delivery addresses</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address Label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g., Home, Office"
                  required
                />
                <Input
                  label="Recipient Name"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <Input
                label="Recipient Phone"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleInputChange}
                placeholder="01XXXXXXXXX"
                pattern="01[3-9]\d{8}"
                required
              />

              <Input
                label="Address Line 1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                placeholder="House/Flat number, Road"
                required
              />

              <Input
                label="Address Line 2 (Optional)"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                placeholder="Landmark or additional details"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Village/Area (Optional)"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  placeholder="Village/Area name"
                />
                <Input
                  label="Thana/Upazila"
                  name="thana"
                  value={formData.thana}
                  onChange={handleInputChange}
                  placeholder="Thana"
                  required
                />
                <Input
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="District"
                  required
                />
              </div>

              <Input
                label="Postal Code (Optional)"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="e.g., 1000"
              />

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              <div className="flex space-x-4">
                <Button type="submit">
                  {editingId ? 'Update Address' : 'Add Address'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {!addresses || addresses.length === 0 ? (
          <Card className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Addresses Yet</h3>
            <p className="text-gray-600 mb-4">Add your first delivery address to get started</p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address._id} className="relative">
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      <Check className="w-3 h-3 mr-1" />
                      Default
                    </span>
                  </div>
                )}
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{address.label}</h3>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p className="font-medium">{address.recipientName}</p>
                      <p>{address.recipientPhone}</p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {[address.village, address.thana, address.district]
                          .filter(Boolean)
                          .join(', ')}
                        {address.postalCode && ` - ${address.postalCode}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  {!address.isDefault && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(address._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
