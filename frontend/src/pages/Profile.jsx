import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/userService';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { User, Edit2, Save, X, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import MapSelector from '../components/MapSelector';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFarmerMap, setShowFarmerMap] = useState(false);
  const [showTransporterMap, setShowTransporterMap] = useState(false);
  const [farmerMapCoords, setFarmerMapCoords] = useState(null);
  const [transporterMapCoords, setTransporterMapCoords] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    // Farmer fields
    village: '',
    thana: '',
    district: '',
    // Transporter fields
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    // Transporter base location fields
    transporterVillage: '',
    transporterThana: '',
    transporterDistrict: '',
  });

  const vehicleTypeOptions = [
    { value: 'van', label: 'Van (local deliveries, up to 30km route)' },
    { value: 'pickup', label: 'Pickup (medium-distance deliveries)' },
    { value: 'truck', label: 'Truck (long-distance, bulk deliveries)' },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        password: '',
        village: response.data.farmLocation?.village || '',
        thana: response.data.farmLocation?.thana || '',
        district: response.data.farmLocation?.district || '',
        vehicleType: response.data.vehicleType || '',
        vehicleNumber: response.data.vehicleNumber || '',
        licenseNumber: response.data.licenseNumber || '',
        transporterVillage: response.data.baseLocation?.village || '',
        transporterThana: response.data.baseLocation?.thana || '',
        transporterDistrict: response.data.baseLocation?.district || '',
      });
      // Set map coordinates separately per role
      if (response.data.farmLocation?.coordinates?.lat) {
        setFarmerMapCoords(response.data.farmLocation.coordinates);
      }
      if (response.data.baseLocation?.coordinates?.lat) {
        setTransporterMapCoords(response.data.baseLocation.coordinates);
      }

    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
      };

      // Add password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Add role-specific fields
      if (profile.role === 'farmer') {
        updateData.farmLocation = {
          village: formData.village,
          thana: formData.thana,
          district: formData.district,
          coordinates: farmerMapCoords ? {
            lat: farmerMapCoords.lat,
            lng: farmerMapCoords.lng
          } : profile.farmLocation?.coordinates || null
        };
      }

      if (profile.role === 'transporter') {
        updateData.vehicleType = formData.vehicleType;
        updateData.vehicleNumber = formData.vehicleNumber;
        updateData.licenseNumber = formData.licenseNumber;
        updateData.baseLocation = {
          village: formData.transporterVillage,
          thana: formData.transporterThana,
          district: formData.transporterDistrict,
          coordinates: transporterMapCoords ? {
            lat: transporterMapCoords.lat,
            lng: transporterMapCoords.lng
          } : profile.baseLocation?.coordinates || null
        };
        updateData.transporterProfile = {
          ...profile.transporterProfile,
        };
      }

      const response = await updateProfile(updateData);
      updateUser(response.data);
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowFarmerMap(false);
    setShowTransporterMap(false);
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      password: '',
      village: profile.farmLocation?.village || '',
      thana: profile.farmLocation?.thana || '',
      district: profile.farmLocation?.district || '',
      vehicleType: profile.vehicleType || '',
      vehicleNumber: profile.vehicleNumber || '',
      licenseNumber: profile.licenseNumber || '',
      transporterVillage: profile.baseLocation?.village || '',
      transporterThana: profile.baseLocation?.thana || '',
      transporterDistrict: profile.baseLocation?.district || '',
    });
    // Reset map coordinates per role
    if (profile.farmLocation?.coordinates?.lat) {
      setFarmerMapCoords(profile.farmLocation.coordinates);
    } else {
      setFarmerMapCoords(null);
    }
    if (profile.baseLocation?.coordinates?.lat) {
      setTransporterMapCoords(profile.baseLocation.coordinates);
    } else {
      setTransporterMapCoords(null);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600">Role: {profile?.role}</p>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />

              {isEditing && (
                <Input
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              )}
            </div>

            {/* Farmer-specific fields */}
            {profile?.role === 'farmer' && (
              <div className="space-y-4 mb-6 p-4 bg-primary-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900">Farm Location</h2>
                <Input
                  label="Village"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <Input
                  label="Thana/Upazila"
                  name="thana"
                  value={formData.thana}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <Input
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                
                {/* Map Location for delivery distance */}
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Farm GPS Location <span className="text-red-500">*</span> (required for 50km delivery check)
                  </label>
                  
                  {farmerMapCoords ? (
                    <p className="text-sm text-green-600 mb-2">
                      ✓ Location: {farmerMapCoords.lat.toFixed(4)}, {farmerMapCoords.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 mb-2">
                      ✱ No GPS location set — buyers cannot order until you add your farm location
                    </p>
                  )}
                  
                  {isEditing && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFarmerMap(!showFarmerMap)}
                        size="sm"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {farmerMapCoords ? 'Update Location' : 'Set Location on Map'}
                      </Button>
                      
                      {showFarmerMap && (
                        <div className="mt-3">
                          <MapSelector
                            onSelect={(coords, address) => {
                              setFarmerMapCoords(coords);
                              setShowFarmerMap(false);
                              toast.success('Farm location updated');
                            }}
                            initialPosition={farmerMapCoords}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Transporter-specific fields */}
            {profile?.role === 'transporter' && (
              <>
                <div className="space-y-4 mb-6 p-4 bg-primary-50 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Information</h2>
                  <Select
                    label="Vehicle Type"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    options={vehicleTypeOptions}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Vehicle Number"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <Input
                    label="License Number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                {/* Transporter Base Location */}
                <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900">Base Location</h2>
                  <p className="text-sm text-gray-600 mb-3">
                    📍 You'll only see delivery jobs within 50km of this address
                  </p>
                  <Input
                    label="Village/Area"
                    name="transporterVillage"
                    value={formData.transporterVillage}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your village or area"
                  />
                  <Input
                    label="Thana/Upazila"
                    name="transporterThana"
                    value={formData.transporterThana}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your thana"
                  />
                  <Input
                    label="District"
                    name="transporterDistrict"
                    value={formData.transporterDistrict}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your district"
                  />
                  
                  {/* Map Location for service radius */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      GPS Location (for 50km service radius calculation)
                    </label>
                    
                    {transporterMapCoords ? (
                      <p className="text-sm text-green-600 mb-2">
                        ✓ Location: {transporterMapCoords.lat.toFixed(4)}, {transporterMapCoords.lng.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm text-orange-600 mb-2">
                        ⚠️ No GPS location set - you won't see delivery jobs until you set your location
                      </p>
                    )}
                    
                    {isEditing && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowTransporterMap(!showTransporterMap)}
                          size="sm"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {transporterMapCoords ? 'Update Location' : 'Set Location on Map'}
                        </Button>
                        
                        {showTransporterMap && (
                          <div className="mt-3">
                            <MapSelector
                              onSelect={(coords, address) => {
                                setTransporterMapCoords(coords);
                                setShowTransporterMap(false);
                                toast.success('Base location updated');
                              }}
                              initialPosition={transporterMapCoords}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </>
            )}

            {/* Account Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="font-semibold text-gray-900">
                  {profile?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="font-semibold text-gray-900">
                  {profile?.isVerified ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="font-semibold text-gray-900">
                  {profile?.rating?.average || 0} / 5 ({profile?.rating?.count || 0} reviews)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-semibold text-gray-900">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={saving || (profile.role === 'farmer' && !farmerMapCoords) || (profile.role === 'transporter' && !transporterMapCoords)}
                  fullWidth
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} fullWidth>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};
