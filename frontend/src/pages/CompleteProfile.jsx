import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
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
      toast.success(t('auth.completedSuccess'));
      
      // Redirect based on role
      if (response.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error(t('auth.completedFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <UserCircle className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('auth.completeProfile')}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.completeProfileDesc', { name: user?.name })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Number */}
          <Input
            label={t('auth.phoneNumber')}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('auth.phonePlaceholder')}
            required
            helperText={t('auth.phoneHelperText')}
          />

          {/* Role Selection */}
          <Select
            label={t('auth.iAmA')}
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            options={[
              { value: '', label: t('auth.selectRole') },
              { value: 'farmer', label: t('auth.farmerRole') },
              { value: 'buyer', label: t('auth.buyerRole') },
              { value: 'transporter', label: t('auth.transporterRole') }
            ]}
          />

          {/* Farmer-specific fields */}
          {formData.role === 'farmer' && (
            <div className="space-y-4 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">{t('auth.farmLocation')}</h3>
              <Input
                label={t('auth.village')}
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder={t('auth.villagePlaceholder')}
              />
              <Input
                label={t('auth.thana')}
                name="thana"
                value={formData.thana}
                onChange={handleChange}
                placeholder={t('auth.thanaPlaceholder')}
              />
              <Input
                label={t('auth.district')}
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder={t('auth.district')}
              />
              
              {/* Map Location Selector */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.farmMapLabel')}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(!showMap)}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {mapCoordinates ? t('auth.updateMapLocation') : t('auth.setLocationMap')}
                </Button>
                
                {mapCoordinates && (
                  <p className="text-sm text-green-600 mt-2">
                    {t('auth.locationSet', { lat: mapCoordinates.lat.toFixed(4), lng: mapCoordinates.lng.toFixed(4) })}
                  </p>
                )}
                
                {showMap && (
                  <div className="mt-3">
                    <MapSelector
                      onSelect={(coords, address) => {
                        setMapCoordinates(coords);
                        setShowMap(false);
                        toast.success(t('auth.farmLocationSet'));
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
              <h3 className="font-semibold text-gray-900">{t('auth.vehicleInfo')}</h3>
              <Select
                label={t('auth.vehicleType')}
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                options={[
                  { value: '', label: t('auth.enterVehicleType') },
                  { value: 'truck', label: t('auth.truck') },
                  { value: 'van', label: t('auth.van') },
                  { value: 'motorbike', label: t('auth.motorbike') },
                  { value: 'other', label: t('auth.other') }
                ]}
              />
              <Input
                label={t('auth.vehicleNumber')}
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder={t('auth.vehicleNumShortPlaceholder')}
              />
              <Input
                label={t('auth.licenseNumber')}
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder={t('auth.licensePlaceholder')}
              />
            </div>
          )}

          <div className="mt-6">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? t('auth.completing') : t('auth.completeBtn')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
