import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../../context/LanguageContext';
import { Camera, MapPin, Calendar, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { getProduct, updateProduct } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Loading from '../../components/Loading';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cropName: '',
    grade: '',
    quantity: '',
    unit: 'kg',
    village: '',
    thana: '',
    district: '',
    harvestDate: '',
    moq: '',
    existingPhotos: [], // Existing photos from server
    newPhotoFiles: [], // New photo files to upload
    newPhotoPreviews: [], // Preview URLs for new photos
    sellingPrice: '',
    isPreOrder: false,
    expectedHarvestDate: '',
  });

  const gradeOptions = [
    { value: '', label: t('farmer.createListing.selectGrade') },
    { value: 'A', label: t('farmer.createListing.gradeA') },
    { value: 'B', label: t('farmer.createListing.gradeB') },
    { value: 'C', label: t('farmer.createListing.gradeC') },
  ];

  const unitOptions = [
    { value: 'kg', label: t('farmer.createListing.kg') },
    { value: 'ton', label: t('farmer.createListing.tons') },
  ];

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const response = await getProduct(id);
      const listing = response.data;

      // Check if user owns this listing
      if (listing.farmer._id !== user._id && user.role !== 'admin') {
        toast.error(t('farmer.editListing.notAuthorized'));
        navigate('/farmer/my-listings');
        return;
      }

      // Populate form data
      setFormData({
        cropName: listing.cropName || '',
        grade: listing.grade || '',
        quantity: listing.quantity || '',
        unit: listing.unit || 'kg',
        village: listing.location?.village || '',
        thana: listing.location?.thana || '',
        district: listing.location?.district || '',
        harvestDate: listing.harvestDate ? listing.harvestDate.split('T')[0] : '',
        moq: listing.moq || '',
        existingPhotos: listing.photos || [],
        newPhotoFiles: [],
        newPhotoPreviews: [],
        sellingPrice: listing.sellingPrice || '',
        isPreOrder: listing.isPreOrder || false,
        expectedHarvestDate: listing.expectedHarvestDate ? listing.expectedHarvestDate.split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error(t('farmer.editListing.loadFail'));
      navigate('/farmer/my-listings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalPhotos = formData.existingPhotos.length + formData.newPhotoFiles.length + files.length;
    
    if (totalPhotos > 5) {
      toast.error(t('farmer.editListing.maxPhotos'));
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      newPhotoFiles: [...prev.newPhotoFiles, ...validFiles],
      newPhotoPreviews: [...prev.newPhotoPreviews, ...newPreviews],
    }));

    toast.success(t('farmer.editListing.photosAdded', { count: validFiles.length }));
    e.target.value = '';
  };

  const removeExistingPhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      existingPhotos: prev.existingPhotos.filter((_, i) => i !== index),
    }));
  };

  const removeNewPhoto = (index) => {
    URL.revokeObjectURL(formData.newPhotoPreviews[index]);
    setFormData(prev => ({
      ...prev,
      newPhotoFiles: prev.newPhotoFiles.filter((_, i) => i !== index),
      newPhotoPreviews: prev.newPhotoPreviews.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.cropName || !formData.grade || !formData.quantity || !formData.moq) {
      toast.error(t('farmer.editListing.fillRequired'));
      return;
    }

    if (parseFloat(formData.quantity) <= 0 || parseFloat(formData.moq) <= 0) {
      toast.error(t('farmer.editListing.qtyMoqError'));
      return;
    }

    if (!formData.village || !formData.thana || !formData.district || !formData.harvestDate) {
      toast.error(t('farmer.editListing.fillLocation'));
      return;
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      toast.error(t('farmer.editListing.invalidPrice'));
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('cropName', formData.cropName);
      formDataToSend.append('grade', formData.grade);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('location', JSON.stringify({
        village: formData.village,
        thana: formData.thana,
        district: formData.district,
      }));
      formDataToSend.append('harvestDate', formData.harvestDate);
      formDataToSend.append('moq', formData.moq);
      formDataToSend.append('sellingPrice', formData.sellingPrice);
      formDataToSend.append('isPreOrder', formData.isPreOrder);
      if (formData.expectedHarvestDate) {
        formDataToSend.append('expectedHarvestDate', formData.expectedHarvestDate);
      }

      // Keep existing photos
      formDataToSend.append('existingPhotos', JSON.stringify(formData.existingPhotos));

      // Append new photo files
      formData.newPhotoFiles.forEach(file => {
        formDataToSend.append('photos', file);
      });

      await updateProduct(id, formDataToSend);
      toast.success(t('farmer.editListing.updateSuccess'));
      navigate('/farmer/my-listings');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error(t('farmer.editListing.updateFail'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message={t('farmer.editListing.loadingMsg')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/farmer/my-listings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('farmer.editListing.backToListings')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('farmer.editListing.title')}</h1>
          <p className="text-gray-600">{t('farmer.editListing.subtitle')}</p>
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Note:</strong> {t('farmer.editListing.updateNote')}
            </p>
          </div>
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Crop Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Package className="w-6 h-6 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-900">{t('farmer.editListing.cropDetails')}</h3>
              </div>

              <Input
                label={t('farmer.createListing.cropName')}
                name="cropName"
                value={formData.cropName}
                onChange={handleChange}
                placeholder={t('farmer.createListing.cropPlaceholder')}
                required
              />

              <Select
                label={t('farmer.createListing.grade')}
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                options={gradeOptions}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('farmer.createListing.quantity')}
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder={t('farmer.createListing.qtyPlaceholder')}
                  min="1"
                  required
                />
                <Select
                  label={t('farmer.createListing.unit')}
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  options={unitOptions}
                  required
                />
              </div>

              <Input
                label={t('farmer.createListing.moq')}
                type="number"
                name="moq"
                value={formData.moq}
                onChange={handleChange}
                placeholder={t('farmer.createListing.moqPlaceholder')}
                min="1"
                required
              />

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isPreOrder"
                  name="isPreOrder"
                  checked={formData.isPreOrder}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <label htmlFor="isPreOrder" className="text-sm font-medium text-gray-700">
                  {t('farmer.editListing.preOrderLabel')}
                </label>
              </div>

              {formData.isPreOrder && (
                <Input
                  label={t('farmer.editListing.expectedHarvestDate')}
                  type="date"
                  name="expectedHarvestDate"
                  value={formData.expectedHarvestDate}
                  onChange={handleChange}
                  required
                />
              )}
            </div>

            {/* Location & Harvest Date */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <MapPin className="w-6 h-6 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-900">{t('farmer.editListing.locationHarvest')}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t('farmer.createListing.village')}
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder={t('farmer.createListing.villagePlaceholder')}
                  required
                />
                <Input
                  label={t('farmer.createListing.thana')}
                  name="thana"
                  value={formData.thana}
                  onChange={handleChange}
                  placeholder={t('farmer.createListing.thanaPlaceholder')}
                  required
                />
                <Input
                  label={t('farmer.createListing.district')}
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder={t('farmer.createListing.districtPlaceholder')}
                  required
                />
              </div>

              <Input
                label={t('farmer.createListing.harvestDate')}
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Camera className="w-6 h-6 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-900">{t('farmer.editListing.qualityPhotos')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('farmer.editListing.photoNote')}
              </p>

              <div>
                <input
                  type="file"
                  id="photoUpload"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={formData.existingPhotos.length + formData.newPhotoFiles.length >= 5}
                />
                <label
                  htmlFor="photoUpload"
                  className={`inline-flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition cursor-pointer font-medium ${
                    formData.existingPhotos.length + formData.newPhotoFiles.length >= 5
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-primary-600 text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  {t('farmer.editListing.choosePhotos')}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  {t('farmer.editListing.photoCount', { used: formData.existingPhotos.length + formData.newPhotoFiles.length })}
                </p>
              </div>

              {/* Existing Photos */}
              {formData.existingPhotos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('farmer.editListing.currentPhotos')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.existingPhotos.map((photo, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img
                          src={`http://localhost:5000${photo}`}
                          alt={`Crop ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              {formData.newPhotoPreviews.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('farmer.editListing.newPhotos')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.newPhotoPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img
                          src={preview}
                          alt={`New Crop ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          {t('farmer.editListing.newBadge')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Setting */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b">
                <DollarSign className="w-6 h-6 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-900">{t('farmer.editListing.priceSection')}</h3>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  {t('farmer.editListing.priceTip')}
                </p>
              </div>

              <Input
                label={t('farmer.createListing.sellingPrice')}
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder={t('farmer.createListing.enterPrice')}
                min="0"
                step="0.01"
                required
              />

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-sm">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{t('farmer.editListing.yourSellingPrice')}</p>
                  <p className="text-4xl font-bold text-green-600">
                    ৳{formData.sellingPrice || '0.00'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">per {formData.unit}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> {t('farmer.createListing.priceTip')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/farmer/my-listings')}
                className="flex-1"
              >
                {t('farmer.editListing.cancel')}
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? t('farmer.editListing.updating') : t('farmer.editListing.updateListing')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
