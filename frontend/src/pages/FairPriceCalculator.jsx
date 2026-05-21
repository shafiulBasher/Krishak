import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLanguage } from '../context/LanguageContext';

const FairPriceCalculator = () => {
  const { t } = useLanguage();
  const [costs, setCosts] = useState({
    seed: 0,
    fertilizer: 0,
    labor: 0,
    transport: 0,
  });
  const [fairPrice, setFairPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [farmerEarnings, setFarmerEarnings] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCosts({
      ...costs,
      [name]: parseFloat(value) || 0,
    });
  };

  const calculateFairPrice = () => {
    const totalCost = costs.seed + costs.fertilizer + costs.labor + costs.transport;
    // Assume a 20% profit margin for fair price
    const calculatedFairPrice = totalCost * 1.2;
    setFairPrice(calculatedFairPrice);

    // For buyers: assume wholesale is 80% of fair, retail is 120% of fair
    setWholesalePrice(calculatedFairPrice * 0.8);
    setRetailPrice(calculatedFairPrice * 1.2);
    setFarmerEarnings(calculatedFairPrice - totalCost);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-center mb-8 text-green-700">{t('fairPrice.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farmer Cost Breakdown */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('fairPrice.costBreakdown')}</h2>
          <div className="space-y-4">
            <Input
              label={t('fairPrice.seedCost')}
              name="seed"
              type="number"
              value={costs.seed}
              onChange={handleInputChange}
              placeholder={t('fairPrice.seedPlaceholder')}
            />
            <Input
              label={t('fairPrice.fertilizerCost')}
              name="fertilizer"
              type="number"
              value={costs.fertilizer}
              onChange={handleInputChange}
              placeholder={t('fairPrice.fertilizerPlaceholder')}
            />
            <Input
              label={t('fairPrice.laborCost')}
              name="labor"
              type="number"
              value={costs.labor}
              onChange={handleInputChange}
              placeholder={t('fairPrice.laborPlaceholder')}
            />
            <Input
              label={t('fairPrice.transportCost')}
              name="transport"
              type="number"
              value={costs.transport}
              onChange={handleInputChange}
              placeholder={t('fairPrice.transportPlaceholder')}
            />
          </div>
          <Button onClick={calculateFairPrice} className="mt-6 w-full">
            {t('fairPrice.calculate')}
          </Button>
        </div>

        {/* Price Comparison for Buyers */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('fairPrice.priceComparison')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">{t('fairPrice.suggestedPrice')}</span>
              <span className="font-bold text-green-600">৳{fairPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{t('fairPrice.wholesalePrice')}</span>
              <span className="font-bold text-blue-600">৳{wholesalePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{t('fairPrice.retailPrice')}</span>
              <span className="font-bold text-red-600">৳{retailPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{t('fairPrice.farmerEarnings')}</span>
              <span className="font-bold text-purple-600">৳{farmerEarnings.toFixed(2)}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {t('fairPrice.description')}
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default FairPriceCalculator;