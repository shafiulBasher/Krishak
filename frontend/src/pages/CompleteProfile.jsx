import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { UserCircle, MapPin } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import MapSelector from '../components/MapSelector';

export const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    role: '',
    // Farmer fields
    village: '',
    thana: '',
    district: '',
    // Transporter fields
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        phone: formData.phone,
        role: formData.role
      };

      if (formData.role === 'farmer') {
        profileData.farmLocation = {
          village: formData.village,
          thana: formData.thana,
          district: formData.district,
          coordinates: mapCoordinates ? {
            lat: mapCoordinates.lat,
            lng: mapCoordinates.lng
          } : null
        };
      }

      if (formData.role === 'transporter') {
        profileData.vehicleType = formData.vehicleType;
        profileData.vehicleNumber = formData.vehicleNumber;
        profileData.licenseNumber = formData.licenseNumber;
      }

      const response = await api.put('/auth/complete-profile', profileData);
      
      updateUser(response.data);
      toast.success('Profile completed successfully!');
      
      // Redirect based on role
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(error || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <UserCircle className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome, {user?.name}! Please provide additional information to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Number */}
          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            required
            helperText="Enter your 11-digit BD phone number"
          />

          {/* Role Selection */}
          <Select
            label="I am a"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            options={[
              { value: '', label: 'Select your role' },
              { value: 'farmer', label: 'Farmer - I want to sell my crops' },
              { value: 'buyer', label: 'Buyer - I want to purchase crops' },
              { value: 'transporter', label: 'Transporter - I want to deliver crops' }
            ]}
          />

          {/* Farmer-specific fields */}
          {formData.role === 'farmer' && (
            <div className="space-y-4 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Farm Location</h3>
              <Input
                label="Village"
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder="Enter your village name"
              />
              <Input
                label="Thana/Upazila"
                name="thana"
                value={formData.thana}
                onChange={handleChange}
                placeholder="Enter your thana"
              />
              <Input
                label="District"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Enter your district"
              />
              
              {/* Map Location Selector */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Location on Map (for delivery distance calculation)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(!showMap)}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {mapCoordinates ? 'Update Map Location' : 'Set Location on Map'}
                </Button>
                
                {mapCoordinates && (
                  <p className="text-sm text-green-600 mt-2">
                    📍 Location set: {mapCoordinates.lat.toFixed(4)}, {mapCoordinates.lng.toFixed(4)}
                  </p>
                )}
                
                {showMap && (
                  <div className="mt-3">
                    <MapSelector
                      onSelect={(coords, address) => {
                        setMapCoordinates(coords);
                        setShowMap(false);
                        toast.success('Farm location set on map');
                      }}
                      initialPosition={mapCoordinates}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transporter-specific fields */}
          {formData.role === 'transporter' && (
            <div className="space-y-4 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Vehicle Information</h3>
              <Select
                label="Vehicle Type"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select vehicle type' },
                  { value: 'truck', label: 'Truck' },
                  { value: 'van', label: 'Van' },
                  { value: 'motorbike', label: 'Motorbike' },
                  { value: 'other', label: 'Other' }
                ]}
              />
              <Input
                label="Vehicle Number"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="e.g., DHA-1234"
              />
              <Input
                label="License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="Enter your driving license number"
              />
            </div>
          )}

          <div className="mt-6">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? 'Completing Profile...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
