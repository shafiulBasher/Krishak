import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, TrendingUp, Calendar } from 'lucide-react';
import { getCurrentPrices, addOrUpdatePrice, getMarketStats } from '../../services/marketPriceService';
import { BANGLADESH_DISTRICTS, STANDARD_CROPS, CROP_CATEGORIES, formatPrice, formatDate, getDaysSinceUpdate, getLocalizedCrop, getLocalizedDistrict, getLocalizedCategory } from '../../utils/bangladeshData';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Loading from '../../components/Loading';
import { useLanguage } from '../../context/LanguageContext';

const MarketPriceManagement = () => {
  const { t, lang } = useLanguage();
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
      toast.error(t('admin.marketPrices.loadFail'));
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
      toast.error(t('admin.marketPrices.missingFields'));
      return false;
    }

    const wholesale = parseFloat(formData.wholesale);
    const retail = parseFloat(formData.retail);

    if (isNaN(wholesale) || isNaN(retail)) {
      toast.error(t('admin.marketPrices.invalidPrices'));
      return false;
    }

    if (wholesale <= 0 || retail <= 0) {
      toast.error(t('admin.marketPrices.zeroPrices'));
      return false;
    }

    if (retail <= wholesale) {
      toast.error(t('admin.marketPrices.retailTooLow'));
      return false;
    }

    if (wholesale > 10000 || retail > 10000) {
      toast.error(t('admin.marketPrices.priceUnrealistic'));
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

      toast.success(response.message || t('admin.marketPrices.saveSuccess'));
      
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
      toast.error(error.response?.data?.message || t('admin.marketPrices.addFail'));
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.marketPrices.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.marketPrices.subtitle')}</p>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.marketPrices.totalCrops')}</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalCrops}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary-400" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.marketPrices.activeDistricts')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalDistricts}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('admin.marketPrices.lastUpdated')}</p>
                <p className="text-lg font-semibold text-gray-700">
                  {stats.lastUpdated ? getDaysSinceUpdate(stats.lastUpdated, lang) : t('admin.marketPrices.never')}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Add/Update Price Form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.marketPrices.addOrUpdate')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t('admin.marketPrices.cropName')}
              name="cropName"
              value={formData.cropName}
              onChange={handleCropChange}
              required
            >
              <option value="">{t('admin.marketPrices.selectCrop')}</option>
              {STANDARD_CROPS.map(crop => (
                <option key={crop.name} value={crop.name}>
                  {crop.name} ({crop.bengali})
                </option>
              ))}
            </Select>

            <Select
              label={t('admin.marketPrices.district')}
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('admin.marketPrices.selectDistrict')}</option>
              {BANGLADESH_DISTRICTS.map(district => (
                <option key={district} value={district}>{getLocalizedDistrict(district, lang)}</option>
              ))}
            </Select>

            <Input
              label={t('admin.marketPrices.wholesalePrice')}
              type="number"
              name="wholesale"
              value={formData.wholesale}
              onChange={handleInputChange}
              placeholder={t('admin.marketPrices.enterWholesale')}
              min="0"
              step="0.01"
              required
            />

            <Input
              label={t('admin.marketPrices.retailPrice')}
              type="number"
              name="retail"
              value={formData.retail}
              onChange={handleInputChange}
              placeholder={t('admin.marketPrices.enterRetail')}
              min="0"
              step="0.01"
              required
            />

            <Input
              label={t('admin.marketPrices.source')}
              type="text"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              placeholder={t('admin.marketPrices.sourcePlaceholder')}
            />

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? t('admin.marketPrices.saving') : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    {formData.cropName && formData.district ? t('admin.marketPrices.updatePrice') : t('admin.marketPrices.addPrice')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {formData.wholesale && formData.retail && parseFloat(formData.retail) > parseFloat(formData.wholesale) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{t('admin.marketPrices.marginLabel')}</span> ৳{(parseFloat(formData.retail) - parseFloat(formData.wholesale)).toFixed(2)} 
                ({(((parseFloat(formData.retail) - parseFloat(formData.wholesale)) / parseFloat(formData.wholesale)) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
        </form>
      </Card>

      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.marketPrices.filterPrices')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('admin.marketPrices.district')}
            value={filters.district}
            onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
          >
            <option value="">{t('admin.marketPrices.allDistricts')}</option>
            {BANGLADESH_DISTRICTS.map(district => (
              <option key={district} value={district}>{getLocalizedDistrict(district, lang)}</option>
            ))}
          </Select>

          <Select
            label={t('admin.marketPrices.category')}
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">{t('admin.marketPrices.allCategories')}</option>
            {CROP_CATEGORIES.filter(c => c !== 'All').map(category => (
              <option key={category} value={category}>{getLocalizedCategory(category, lang)}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Recent Entries */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.marketPrices.recentEntries', { count: prices.length })}</h2>
        </div>

        {prices.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('admin.marketPrices.noPrices')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.cropCol')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.districtCol')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.categoryCol')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.wholesaleCol')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.retailCol')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.marginCol')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.updatedCol')}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.marketPrices.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prices.map((price) => {
                  const margin = price.currentPrice.retail - price.currentPrice.wholesale;
                  const marginPercent = ((margin / price.currentPrice.wholesale) * 100).toFixed(1);
                  
                  return (
                    <tr key={price._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{getLocalizedCrop(price.cropName, lang)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getLocalizedDistrict(price.district, lang)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                          {getLocalizedCategory(price.category, lang)}
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
                        {getDaysSinceUpdate(price.lastUpdated, lang)}
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
    </div>
  );
};

export default MarketPriceManagement;
