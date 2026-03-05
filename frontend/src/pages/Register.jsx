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

export const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
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
    { value: 'farmer', label: 'Farmer' },
    { value: 'buyer', label: 'Buyer' },
    { value: 'transporter', label: 'Transporter' },
  ];

  const vehicleTypeOptions = [
    { value: 'truck', label: 'Truck' },
    { value: 'van', label: 'Van' },
    { value: 'motorbike', label: 'Motorbike' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return alert('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return alert('Password must be at least 6 characters');
    }

    if (formData.role === 'farmer' && !formData.farmerCoordinates.lat) {
      toast.error('Please pin your farm location on the map before registering');
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
      toast.error(error || 'Failed to register with Google');
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
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join Krishak marketplace today</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01XXXXXXXXX"
              required
            />

            <Select
              label="I am a"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          {/* Farmer-specific fields */}
          {formData.role === 'farmer' && (
            <div className="mt-6 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Farm Location</h3>
              <div className="space-y-4">
                <Input
                  label="Village"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="Enter village name"
                  required
                />
                <Input
                  label="Thana/Upazila"
                  name="thana"
                  value={formData.thana}
                  onChange={handleChange}
                  placeholder="Enter thana name"
                  required
                />
                <Select
                  label="District"
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
                    {formData.farmerCoordinates.lat ? 'Update Farm Location on Map' : 'Pin Farm Location on Map ✱'}
                  </Button>
                  {formData.farmerCoordinates.lat ? (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Farm location pinned: {formData.farmerCoordinates.lat.toFixed(4)}, {formData.farmerCoordinates.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 mt-2">
                      ✱ Required — buyers can only order within 50km of your farm
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
                <h3 className="font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                <div className="space-y-4">
                  <Select
                    label="Vehicle Type"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    options={vehicleTypeOptions}
                    required
                  />
                  <Input
                    label="Vehicle Number"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g., DHAKA-GA-12-3456"
                    required
                  />
                  <Input
                    label="License Number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="Enter your license number"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Base Location (For Job Filtering)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You'll only see delivery jobs within 50km of this address
                </p>
                <div className="space-y-4">
                  <Input
                    label="Village/Area"
                    name="transporterVillage"
                    value={formData.transporterVillage}
                    onChange={handleChange}
                    placeholder="Enter your village or area name"
                    required
                  />
                  <Input
                    label="Thana/Upazila"
                    name="transporterThana"
                    value={formData.transporterThana}
                    onChange={handleChange}
                    placeholder="Enter thana name"
                    required
                  />
                  <Select
                    label="District"
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
                      {formData.transporterCoordinates.lat ? 'Update Location' : 'Set Location on Map'}
                    </Button>
                    {formData.transporterCoordinates.lat && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Location set: {formData.transporterCoordinates.lat.toFixed(4)}, {formData.transporterCoordinates.lng.toFixed(4)}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
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
                  Google Sign-In is not configured. Please use email/password registration.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Login here
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
