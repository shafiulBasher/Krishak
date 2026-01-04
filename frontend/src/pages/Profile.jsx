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
  const [showMap, setShowMap] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
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
  });

  const vehicleTypeOptions = [
    { value: 'truck', label: 'Truck' },
    { value: 'van', label: 'Van' },
    { value: 'motorbike', label: 'Motorbike' },
    { value: 'other', label: 'Other' },
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
      });
      // Set map coordinates if available
      if (response.data.farmLocation?.coordinates?.lat) {
        setMapCoordinates(response.data.farmLocation.coordinates);
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
          coordinates: mapCoordinates ? {
            lat: mapCoordinates.lat,
            lng: mapCoordinates.lng
          } : profile.farmLocation?.coordinates || null
        };
      }

      if (profile.role === 'transporter') {
        updateData.vehicleType = formData.vehicleType;
        updateData.vehicleNumber = formData.vehicleNumber;
        updateData.licenseNumber = formData.licenseNumber;
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
    setShowMap(false);
    // Reset form data
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
    });
    // Reset map coordinates to saved value
    if (profile.farmLocation?.coordinates?.lat) {
      setMapCoordinates(profile.farmLocation.coordinates);
    } else {
      setMapCoordinates(null);
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
                    Farm GPS Location (for accurate delivery distance)
                  </label>
                  
                  {mapCoordinates ? (
                    <p className="text-sm text-green-600 mb-2">
                      📍 Location: {mapCoordinates.lat.toFixed(4)}, {mapCoordinates.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600 mb-2">
                      ⚠️ No GPS location set - delivery distance will use default
                    </p>
                  )}
                  
                  {isEditing && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowMap(!showMap)}
                        size="sm"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {mapCoordinates ? 'Update Location' : 'Set Location on Map'}
                      </Button>
                      
                      {showMap && (
                        <div className="mt-3">
                          <MapSelector
                            onSelect={(coords, address) => {
                              setMapCoordinates(coords);
                              setShowMap(false);
                              toast.success('Farm location updated');
                            }}
                            initialPosition={mapCoordinates}
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
                <Button type="submit" disabled={saving} fullWidth>
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
