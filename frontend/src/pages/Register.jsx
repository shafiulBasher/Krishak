import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { UserPlus, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import MapSelector from '../components/MapSelector';
import { BANGLADESH_DISTRICTS } from '../utils/bangladeshData';
import { useLanguage } from '../context/LanguageContext';

export const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    // Farmer fields
    village: '',
    thana: '',
    district: '',
    // Transporter fields
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    // Transporter base location
    transporterVillage: '',
    transporterThana: '',
    transporterDistrict: '',
    transporterCoordinates: { lat: null, lng: null },
    farmerCoordinates: { lat: null, lng: null },
  });
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [showFarmerMapSelector, setShowFarmerMapSelector] = useState(false);

  const roleOptions = [
    { value: 'farmer', label: t('roles.farmer') },
    { value: 'buyer', label: t('roles.buyer') },
    { value: 'transporter', label: t('roles.transporter') },
  ];

  const vehicleTypeOptions = [
    { value: 'truck', label: t('auth.truck') },
    { value: 'van', label: t('auth.van') },
    { value: 'motorbike', label: t('auth.motorbike') },
    { value: 'other', label: t('auth.other') },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return alert(t('auth.passwordMismatch'));
    }

    if (formData.password.length < 6) {
      return alert(t('auth.passwordTooShort'));
    }

    if (formData.role === 'farmer' && !formData.farmerCoordinates.lat) {
      toast.error(t('auth.pinFarmFirst'));
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };

      // Add role-specific fields
      if (formData.role === 'farmer') {
        userData.farmLocation = {
          village: formData.village,
          thana: formData.thana,
          district: formData.district,
          coordinates: formData.farmerCoordinates,
        };
      }

      if (formData.role === 'transporter') {
        userData.vehicleType = formData.vehicleType;
        userData.vehicleNumber = formData.vehicleNumber;
        userData.licenseNumber = formData.licenseNumber;
        userData.baseLocation = {
          village: formData.transporterVillage,
          thana: formData.transporterThana,
          district: formData.transporterDistrict,
          coordinates: formData.transporterCoordinates,
        };
      }

      await register(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const result = await googleLogin(credentialResponse.credential);
      
      if (result.needsCompletion) {
        navigate('/complete-profile');
      } else if (result.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error || t('auth.googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    if (error?.error === 'popup_closed_by_user') {
      // User closed the popup, don't show error
      return;
    }
    toast.error('Google sign-in is not available. Please use email/password registration.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <UserPlus className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('auth.createAccount')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('auth.joinToday')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="space-y-4">
            <Input
              label={t('auth.fullName')}
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('auth.enterFullName')}
              required
            />

            <Input
              label={t('auth.emailAddress')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.emailPlaceholder')}
              required
            />

            <Input
              label={t('auth.phoneNumber')}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('auth.phonePlaceholder')}
              required
            />

            <Select
              label={t('auth.iAmA')}
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />

            <Input
              label={t('auth.password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.passwordPlaceholder')}
              required
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              required
            />
          </div>

          {/* Farmer-specific fields */}
          {formData.role === 'farmer' && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">{t('auth.farmLocation')}</h3>
              <div className="space-y-4">
                <Input
                  label={t('auth.village')}
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder={t('auth.villagePlaceholder')}
                  required
                />
                <Input
                  label={t('auth.thana')}
                  name="thana"
                  value={formData.thana}
                  onChange={handleChange}
                  placeholder={t('auth.thanaPlaceholder')}
                  required
                />
                <Select
                  label={t('auth.district')}
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  options={BANGLADESH_DISTRICTS.map(d => ({ value: d, label: d }))}
                  required
                />
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowFarmerMapSelector(true)}
                    fullWidth
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {formData.farmerCoordinates.lat ? t('auth.updateFarmLocation') : t('auth.pinFarmLocation')}
                  </Button>
                  {formData.farmerCoordinates.lat ? (
                    <p className="text-sm text-green-600 mt-2">
                      {t('auth.farmPinned', { lat: formData.farmerCoordinates.lat.toFixed(4), lng: formData.farmerCoordinates.lng.toFixed(4) })}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 mt-2">
                      {t('auth.farmRequired')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transporter-specific fields */}
          {formData.role === 'transporter' && (
            <>
              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">{t('auth.vehicleInfo')}</h3>
                <div className="space-y-4">
                  <Select
                    label={t('auth.vehicleType')}
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    options={vehicleTypeOptions}
                    required
                  />
                  <Input
                    label={t('auth.vehicleNumber')}
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder={t('auth.vehicleNumberPlaceholder')}
                    required
                  />
                  <Input
                    label={t('auth.licenseNumber')}
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder={t('auth.enterLicense')}
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t('auth.baseLocation')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('auth.baseLocationDesc')}
                </p>
                <div className="space-y-4">
                  <Input
                    label={t('auth.transporterVillageLabel')}
                    name="transporterVillage"
                    value={formData.transporterVillage}
                    onChange={handleChange}
                    placeholder={t('auth.transporterVillagePlaceholder')}
                    required
                  />
                  <Input
                    label={t('auth.thana')}
                    name="transporterThana"
                    value={formData.transporterThana}
                    onChange={handleChange}
                    placeholder={t('auth.thanaPlaceholder')}
                    required
                  />
                  <Select
                    label={t('auth.district')}
                    name="transporterDistrict"
                    value={formData.transporterDistrict}
                    onChange={handleChange}
                    options={BANGLADESH_DISTRICTS.map(d => ({ value: d, label: d }))}
                    required
                  />
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowMapSelector(true)}
                      fullWidth
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {formData.transporterCoordinates.lat ? t('auth.updateLocation') : t('auth.setLocationMap')}
                    </Button>
                    {formData.transporterCoordinates.lat && (
                      <p className="text-sm text-green-600 mt-2">
                        {t('auth.transporterLocationSet', { lat: formData.transporterCoordinates.lat.toFixed(4), lng: formData.transporterCoordinates.lng.toFixed(4) })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Farmer Map Selector Modal */}
          {showFarmerMapSelector && (
            <MapSelector
              onClose={() => setShowFarmerMapSelector(false)}
              onSelect={(coords) => {
                setFormData(prev => ({ ...prev, farmerCoordinates: coords }));
                setShowFarmerMapSelector(false);
              }}
            />
          )}

          {/* Transporter Map Selector Modal */}
          {showMapSelector && formData.role === 'transporter' && (
            <MapSelector
              onClose={() => setShowMapSelector(false)}
              onSelect={(coords) => {
                setFormData(prev => ({ ...prev, transporterCoordinates: coords }));
                setShowMapSelector(false);
              }}
            />
          )}

          <div className="mt-6">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-4">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && 
               import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your-google-client-id-here.apps.googleusercontent.com' &&
               import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                />
              ) : (
                <div className="text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  {t('auth.googleRegisterNotConfigured')}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">{t('auth.alreadyAccount')} </span>
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.loginHere')}
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
