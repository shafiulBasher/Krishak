import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, TrendingUp, Calendar } from 'lucide-react';
import { getCurrentPrices, addOrUpdatePrice, getMarketStats } from '../../services/marketPriceService';
import { BANGLADESH_DISTRICTS, STANDARD_CROPS, formatPrice, formatDate, getDaysSinceUpdate } from '../../utils/bangladeshData';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Loading from '../../components/Loading';

const MarketPriceManagement = () => {
  const [prices, setPrices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ district: '', category: '' });
  
  const [formData, setFormData] = useState({
    cropName: '',
    district: '',
    category: '',
    wholesale: '',
    retail: '',
    source: 'Manual Entry'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pricesData, statsData] = await Promise.all([
        getCurrentPrices(filters),
        getMarketStats()
      ]);
      setPrices(pricesData.data || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load market prices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCropChange = (e) => {
    const cropName = e.target.value;
    const cropInfo = STANDARD_CROPS.find(c => c.name === cropName);
    
    setFormData(prev => ({
      ...prev,
      cropName,
      category: cropInfo?.category || ''
    }));
  };

  const validateForm = () => {
    if (!formData.cropName || !formData.district || !formData.wholesale || !formData.retail) {
      toast.error('Please fill all required fields');
      return false;
    }

    const wholesale = parseFloat(formData.wholesale);
    const retail = parseFloat(formData.retail);

    if (isNaN(wholesale) || isNaN(retail)) {
      toast.error('Prices must be valid numbers');
      return false;
    }

    if (wholesale <= 0 || retail <= 0) {
      toast.error('Prices must be greater than zero');
      return false;
    }

    if (retail <= wholesale) {
      toast.error('Retail price must be greater than wholesale price');
      return false;
    }

    if (wholesale > 10000 || retail > 10000) {
      toast.error('Prices seem unrealistic (max: ৳10,000)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await addOrUpdatePrice({
        cropName: formData.cropName,
        district: formData.district,
        category: formData.category,
        wholesale: parseFloat(formData.wholesale),
        retail: parseFloat(formData.retail),
        source: formData.source
      });

      toast.success(response.message || 'Price updated successfully');
      
      // Reset form
      setFormData({
        cropName: '',
        district: '',
        category: '',
        wholesale: '',
        retail: '',
        source: 'Manual Entry'
      });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error adding price:', error);
      toast.error(error.response?.data?.message || 'Failed to add price');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (price) => {
    setFormData({
      cropName: price.cropName,
      district: price.district,
      category: price.category,
      wholesale: price.currentPrice.wholesale.toString(),
      retail: price.currentPrice.retail.toString(),
      source: 'Manual Entry'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !prices.length) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Market Price Management</h1>
        <p className="text-gray-600 mt-1">Add and update wholesale and retail prices</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Crops Tracked</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalCrops}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary-400" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Districts</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalDistricts}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-semibold text-gray-700">
                  {stats.lastUpdated ? getDaysSinceUpdate(stats.lastUpdated) : 'Never'}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Add/Update Price Form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add or Update Price</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Crop Name"
              name="cropName"
              value={formData.cropName}
              onChange={handleCropChange}
              required
            >
              <option value="">Select Crop</option>
              {STANDARD_CROPS.map(crop => (
                <option key={crop.name} value={crop.name}>
                  {crop.name} ({crop.bengali})
                </option>
              ))}
            </Select>

            <Select
              label="District"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              required
            >
              <option value="">Select District</option>
              {BANGLADESH_DISTRICTS.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </Select>

            <Input
              label="Wholesale Price (৳/kg)"
              type="number"
              name="wholesale"
              value={formData.wholesale}
              onChange={handleInputChange}
              placeholder="Enter wholesale price"
              min="0"
              step="0.01"
              required
            />

            <Input
              label="Retail Price (৳/kg)"
              type="number"
              name="retail"
              value={formData.retail}
              onChange={handleInputChange}
              placeholder="Enter retail price"
              min="0"
              step="0.01"
              required
            />

            <Input
              label="Source"
              type="text"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              placeholder="e.g., DAM - Dhaka"
            />

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Saving...' : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {formData.cropName && formData.district ? 'Update Price' : 'Add Price'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {formData.wholesale && formData.retail && parseFloat(formData.retail) > parseFloat(formData.wholesale) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Margin:</span> ৳{(parseFloat(formData.retail) - parseFloat(formData.wholesale)).toFixed(2)} 
                ({(((parseFloat(formData.retail) - parseFloat(formData.wholesale)) / parseFloat(formData.wholesale)) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
        </form>
      </Card>

      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="District"
            value={filters.district}
            onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
          >
            <option value="">All Districts</option>
            {BANGLADESH_DISTRICTS.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </Select>

          <Select
            label="Category"
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            <option value="Grains">Grains</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Spices">Spices</option>
            <option value="Cash Crops">Cash Crops</option>
          </Select>
        </div>
      </Card>

      {/* Recent Entries */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Entries ({prices.length})</h2>
        </div>

        {prices.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No prices found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wholesale</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retail</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prices.map((price) => {
                  const margin = price.currentPrice.retail - price.currentPrice.wholesale;
                  const marginPercent = ((margin / price.currentPrice.wholesale) * 100).toFixed(1);
                  
                  return (
                    <tr key={price._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{price.cropName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{price.district}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                          {price.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                        {formatPrice(price.currentPrice.wholesale)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {formatPrice(price.currentPrice.retail)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        ৳{margin.toFixed(0)} ({marginPercent}%)
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {getDaysSinceUpdate(price.lastUpdated)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEdit(price)}
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MarketPriceManagement;
