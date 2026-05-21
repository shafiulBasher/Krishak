import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { getCurrentPrices, getActiveDistricts, getPriceHistory } from '../services/marketPriceService';
import { BANGLADESH_DISTRICTS, CROP_CATEGORIES, formatPrice, formatDate, getDaysSinceUpdate, getLocalizedDistrict, getLocalizedCrop, getLocalizedCategory } from '../utils/bangladeshData';
import { Card } from '../components/Card';
import { Select } from '../components/Select';
import { Loading } from '../components/Loading';
import PriceHistoryChart from '../components/charts/PriceHistoryChart';

const MarketPrices = () => {
  const { t, lang } = useLanguage();
  const [prices, setPrices] = useState([]);
  const [activeDistricts, setActiveDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState(BANGLADESH_DISTRICTS[0] || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartHistory, setChartHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchActiveDistricts();
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [selectedDistrict, selectedCategory]);

  const fetchActiveDistricts = async () => {
    try {
      const response = await getActiveDistricts();
      const districts = response?.districts || [];
      
      // If API fails or returns empty, use all districts as fallback
      if (districts.length === 0) {
        setActiveDistricts(BANGLADESH_DISTRICTS);
        setSelectedDistrict(BANGLADESH_DISTRICTS[0]);
      } else {
        setActiveDistricts(districts);
        setSelectedDistrict(districts[0]);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      // Use all districts as fallback on error
      setActiveDistricts(BANGLADESH_DISTRICTS);
      setSelectedDistrict(BANGLADESH_DISTRICTS[0]);
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedDistrict) filters.district = selectedDistrict;
      if (selectedCategory && selectedCategory !== 'All') filters.category = selectedCategory;

      const response = await getCurrentPrices(filters);
      setPrices(response?.data || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setPrices([]);
      toast.error(t('market.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'falling') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendText = (trend) => {
    if (trend === 'rising') return t('market.rising');
    if (trend === 'falling') return t('market.falling');
    return t('market.stable');
  };

  const getTrendColor = (trend) => {
    if (trend === 'rising') return 'text-red-600 bg-red-50';
    if (trend === 'falling') return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const handleCardClick = async (price) => {
    setSelectedCrop(price);
    setShowChartModal(true);
    setChartHistory([]);
    setChartLoading(true);
    try {
      const cropName = encodeURIComponent(price.cropName);
      const district = encodeURIComponent(price.district);
      const response = await getPriceHistory(cropName, district, 30);
      setChartHistory(response?.history || []);
    } catch (err) {
      console.error('Error fetching price history:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const closeModal = () => {
    setShowChartModal(false);
    setSelectedCrop(null);
    setChartHistory([]);
  };

  if (loading && !prices.length) {
    return <Loading message={t('market.loading')} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('market.title')}</h1>
        <p className="text-gray-600 mt-2">{t('market.subtitle')}</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {t('market.selectDistrict')}
            </label>
            <Select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">{t('market.allDistricts')}</option>
              {activeDistricts.map(district => (
                <option key={district} value={district}>{getLocalizedDistrict(district, lang)}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t('market.category')}</label>
            <div className="flex flex-wrap gap-2">
              {CROP_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getLocalizedCategory(category, lang)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Price Cards Grid */}
      {prices.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('market.noData')}</p>
            <p className="text-gray-400 text-sm mt-2">
              {selectedDistrict 
                ? t('market.noDataFiltered', { district: selectedDistrict, category: selectedCategory })
                : t('market.selectDistrictHint')}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              {t('market.showingCrops', { count: prices.length })}
              {selectedDistrict && ` ${t('market.inDistrict', { district: selectedDistrict })}`}
            </p>
            <p className="text-sm text-gray-500">{t('market.clickForHistory')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prices.map((price) => {
              const margin = price.currentPrice.retail - price.currentPrice.wholesale;
              const marginPercent = ((margin / price.currentPrice.wholesale) * 100).toFixed(1);
              
              return (
                <Card
                  key={price._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleCardClick(price)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {getLocalizedCrop(price.cropName, lang)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {price.category}
                        </span>
                        {price.trend && (
                          <span className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${getTrendColor(price.trend)}`}>
                            {getTrendIcon(price.trend)}
                            {getTrendText(price.trend)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>

                  <div className="space-y-3">
                    {/* Wholesale Price */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('market.wholesale')}</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(price.currentPrice.wholesale)}
                      </span>
                    </div>

                    {/* Retail Price */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{t('market.retail')}</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(price.currentPrice.retail)}
                      </span>
                    </div>

                    {/* Margin */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('market.margin')}</span>
                        <span className="text-sm font-semibold text-gray-700">
                          ৳{margin.toFixed(0)} ({marginPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {price.district}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {getDaysSinceUpdate(price.lastUpdated, lang)}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Chart Modal */}
      {showChartModal && selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{getLocalizedCrop(selectedCrop.cropName, lang)}</h2>
                  <p className="text-gray-600 mt-1">
                    {getLocalizedDistrict(selectedCrop.district, lang)} • {getLocalizedCategory(selectedCrop.category, lang)}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Current Prices */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">{t('market.currentWholesale')}</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatPrice(selectedCrop.currentPrice.wholesale)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium mb-1">{t('market.currentRetail')}</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatPrice(selectedCrop.currentPrice.retail)}
                  </p>
                </div>
              </div>

              {/* Price History Chart */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('market.priceHistory')}</h3>
                {chartLoading ? (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">{t('market.loadingChart')}</p>
                  </div>
                ) : (
                  <PriceHistoryChart 
                    data={chartHistory} 
                    cropName={getLocalizedCrop(selectedCrop.cropName, lang)}
                  />
                )}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('market.lastUpdated')}</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatDate(selectedCrop.lastUpdated)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('market.source')}</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedCrop.currentPrice.source || t('market.manualEntry')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPrices;
