import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Camera, MapPin, Calendar, Package, DollarSign } from 'lucide-react';
import { createProduct } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import FairPriceCalculator from '../../components/FairPriceCalculator';

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    cropName: '',
    grade: '',
    quantity: '',
    unit: 'kg',
    village: user?.farmLocation?.village || '',
    thana: user?.farmLocation?.thana || '',
    district: user?.farmLocation?.district || '',
    harvestDate: '',
    moq: '',
    photoFiles: [], // Store actual file objects
    photoPreviews: [], // Store preview URLs
    sellingPrice: '',
    isPreOrder: false,
    expectedHarvestDate: '',

    costBreakdown: {
      seedCost: 0,
      fertilizerCost: 0,
      laborCost: 0,
      transportCost: 0,
      otherCost: 0,
    },
    margin: 15,
  });

  const gradeOptions = [
    { value: '', label: 'Select Grade' },
    { value: 'A', label: 'Grade A (Premium Quality)' },
    { value: 'B', label: 'Grade B (Good Quality)' },
    { value: 'C', label: 'Grade C (Standard Quality)' },
  ];

  const unitOptions = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'ton', label: 'Tons' },
  ];



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };


  const handleCostChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      costBreakdown: {
        ...prev.costBreakdown,
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const handleMarginChange = (value) => {
    setFormData(prev => ({
      ...prev,
      margin: parseFloat(value) || 15,
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.photoFiles.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    // Validate file types and sizes
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

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      photoFiles: [...prev.photoFiles, ...validFiles],
      photoPreviews: [...prev.photoPreviews, ...newPreviews],
    }));

    toast.success(`${validFiles.length} photo(s) added!`);
    e.target.value = ''; // Reset input
  };

  const removePhoto = (index) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(formData.photoPreviews[index]);
    
    setFormData(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index),
      photoPreviews: prev.photoPreviews.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.cropName || !formData.grade || !formData.quantity || !formData.moq) {
          toast.error('Please fill in all required fields');
          return false;
        }
        if (parseFloat(formData.quantity) <= 0 || parseFloat(formData.moq) <= 0) {
          toast.error('Quantity and MOQ must be greater than 0');
          return false;
        }

        if (formData.isPreOrder && !formData.expectedHarvestDate) {
          toast.error('Please select expected harvest date for pre-order');
          return false;
        }
        break;
      case 2:
        if (!formData.village || !formData.thana || !formData.district || !formData.harvestDate) {
          toast.error('Please fill in all location and harvest date fields');
          return false;
        }
        break;
      case 3:
        if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
          toast.error('Please enter a valid selling price');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    setLoading(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      formDataToSend.append('cropName', formData.cropName);
      formDataToSend.append('grade', formData.grade);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('unit', formData.unit);
      // Send location as JSON string
      formDataToSend.append('location', JSON.stringify({
        village: formData.village,
        thana: formData.thana,
        district: formData.district
      }));
      formDataToSend.append('harvestDate', formData.harvestDate);
      formDataToSend.append('moq', formData.moq);
      formDataToSend.append('sellingPrice', formData.sellingPrice);
      formDataToSend.append('isPreOrder', formData.isPreOrder);
      if (formData.expectedHarvestDate) {
        formDataToSend.append('expectedHarvestDate', formData.expectedHarvestDate);
      }

      // Append cost breakdown and margin
      formDataToSend.append('costBreakdown', JSON.stringify(formData.costBreakdown));
      formDataToSend.append('margin', formData.margin);

      // Append photo files
      formData.photoFiles.forEach(file => {
        formDataToSend.append('photos', file);
      });

      await createProduct(formDataToSend);
      toast.success('Listing created successfully! Awaiting admin approval.');
      navigate('/farmer/my-listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              currentStep >= step
                ? 'bg-primary-600 text-white shadow-lg scale-110'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step}
          </div>
          {index < 2 && (
            <div
              className={`w-16 h-1 mx-2 transition-all duration-300 ${
                currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <Package className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-900">Crop Details</h3>
      </div>

      <Input
        label="Crop Name *"
        name="cropName"
        value={formData.cropName}
        onChange={handleChange}
        placeholder="e.g., Rice, Wheat, Potato"
        required
      />

      <Select
        label="Quality Grade *"
        name="grade"
        value={formData.grade}
        onChange={handleChange}
        options={gradeOptions}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Available Quantity *"
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Enter quantity"
          min="1"
          required
        />
        <Select
          label="Unit *"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          options={unitOptions}
          required
        />
      </div>

      {/* Pre-order option */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPreOrder"
          name="isPreOrder"
          checked={formData.isPreOrder}
          onChange={handleChange}
          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="isPreOrder" className="text-sm font-medium text-gray-700">
          This is a pre-order for seasonal crop
        </label>
      </div>

      {formData.isPreOrder && (
        <Input
          label="Expected Harvest Date"
          type="date"
          name="expectedHarvestDate"
          value={formData.expectedHarvestDate}
          onChange={handleChange}
          required
        />
      )}

      <Input
        label="Minimum Order Quantity (MOQ) *"
        type="number"
        name="moq"
        value={formData.moq}
        onChange={handleChange}
        placeholder="Minimum quantity buyers must order"
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
          This is a pre-order (crop not yet harvested)
        </label>
      </div>

      {formData.isPreOrder && (
        <Input
          label="Expected Harvest Date *"
          type="date"
          name="expectedHarvestDate"
          value={formData.expectedHarvestDate}
          onChange={handleChange}
          required
        />
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-900">Location & Harvest Date</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Village *"
          name="village"
          value={formData.village}
          onChange={handleChange}
          placeholder="Enter village name"
          required
        />
        <Input
          label="Thana/Upazila *"
          name="thana"
          value={formData.thana}
          onChange={handleChange}
          placeholder="Enter thana name"
          required
        />
        <Input
          label="District *"
          name="district"
          value={formData.district}
          onChange={handleChange}
          placeholder="Enter district name"
          required
        />
      </div>

      <Input
        label="Harvest Date *"
        type="date"
        name="harvestDate"
        value={formData.harvestDate}
        onChange={handleChange}
        required
      />

      <div className="pt-6 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quality Photos (Optional)</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Add photos to showcase your crop quality. Better photos increase buyer trust! (Max 5 photos, 5MB each)
        </p>

        <div className="mb-4">
          <input
            type="file"
            id="photoUpload"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <label
            htmlFor="photoUpload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition cursor-pointer font-medium"
          >
            <Camera className="w-5 h-5" />
            Choose Photos from Gallery
          </label>
          <p className="text-xs text-gray-500 mt-2">
            {formData.photoFiles.length}/5 photos selected
          </p>
        </div>

        {formData.photoPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.photoPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Crop ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  +�
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <DollarSign className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-900">Set Your Price</h3>
      </div>

      {/* Fair Price Calculator */}
      <div className="mb-8">
        <FairPriceCalculator
          initialData={{
            ...formData.costBreakdown,
            margin: formData.margin,
            quantity: formData.quantity,
          }}
          onCalculate={(result) => {
            // Optionally auto-set the selling price
            setFormData(prev => ({
              ...prev,
              sellingPrice: result.suggestedPrice.toFixed(2),
            }));
          }}
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          💡 Use the calculator above to determine a fair price based on your costs, or set your own price below.
        </p>
      </div>

      <Input
        label="Selling Price (per kg/ton) *"
        type="number"
        name="sellingPrice"
        value={formData.sellingPrice}
        onChange={handleChange}
        placeholder="Enter your selling price"
        min="0"
        step="0.01"
        required
      />

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Your Selling Price</p>
          <p className="text-4xl font-bold text-green-600">
            a��{formData.sellingPrice || '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">per {formData.unit}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Tip:</strong> Research local market prices to ensure your listing is competitive and attractive to buyers.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Listing</h1>
          <p className="text-gray-600">List your crops and connect with buyers</p>
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleSubmit}>
            {renderStepIndicator()}

            <div className="min-h-[500px]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Listing'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
