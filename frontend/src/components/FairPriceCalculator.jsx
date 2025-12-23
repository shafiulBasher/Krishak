import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Card from './Card';

const FairPriceCalculator = ({ onCalculate, initialData = {} }) => {
  const [costBreakdown, setCostBreakdown] = useState({
    seedCost: initialData.seedCost || 0,
    fertilizerCost: initialData.fertilizerCost || 0,
    laborCost: initialData.laborCost || 0,
    transportCost: initialData.transportCost || 0,
    otherCost: initialData.otherCost || 0,
  });
  const [margin, setMargin] = useState(initialData.margin || 15);
  const [quantity, setQuantity] = useState(initialData.quantity || 1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setCostBreakdown(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculatePrice = async () => {
    setLoading(true);
    try {
      // Call the API
      const response = await fetch('/api/products/calculate-fair-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          costBreakdown,
          margin,
          quantity
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        if (onCalculate) {
          onCalculate(data.data);
        }
      } else {
        alert('Error calculating price');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error');
    }
    setLoading(false);
  };

  const totalCost = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);

  return (
    <Card className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Fair Price Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Seed Cost (৳)</label>
          <Input
            type="number"
            value={costBreakdown.seedCost}
            onChange={(e) => handleInputChange('seedCost', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fertilizer Cost (৳)</label>
          <Input
            type="number"
            value={costBreakdown.fertilizerCost}
            onChange={(e) => handleInputChange('fertilizerCost', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Labor Cost (৳)</label>
          <Input
            type="number"
            value={costBreakdown.laborCost}
            onChange={(e) => handleInputChange('laborCost', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Transport Cost (৳)</label>
          <Input
            type="number"
            value={costBreakdown.transportCost}
            onChange={(e) => handleInputChange('transportCost', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Other Cost (৳)</label>
          <Input
            type="number"
            value={costBreakdown.otherCost}
            onChange={(e) => handleInputChange('otherCost', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quantity (kg)</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            placeholder="1"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Profit Margin (%)</label>
          <Input
            type="number"
            value={margin}
            onChange={(e) => setMargin(parseFloat(e.target.value) || 15)}
            placeholder="15"
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-lg font-semibold">Total Cost: ৳{totalCost.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Cost per kg: ৳{(totalCost / quantity).toFixed(2)}</p>
      </div>

      <div className="text-center mb-6">
        <Button onClick={calculatePrice} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Fair Price'}
        </Button>
      </div>

      {result && (
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold mb-4">Calculation Result</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-semibold text-green-800">Suggested Price</h4>
              <p className="text-2xl font-bold text-green-600">৳{result.suggestedPrice.toFixed(2)}/kg</p>
            </div>

            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-blue-800">Farmer Earnings</h4>
              <p className="text-2xl font-bold text-blue-600">৳{result.breakdown.farmerEarnings.toFixed(2)}/kg</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded text-center">
              <h5 className="font-medium">Wholesale</h5>
              <p className="text-lg">৳{result.breakdown.wholesale.toFixed(2)}/kg</p>
            </div>

            <div className="bg-yellow-50 p-3 rounded text-center">
              <h5 className="font-medium">Retail</h5>
              <p className="text-lg">৳{result.breakdown.retail.toFixed(2)}/kg</p>
            </div>

            <div className="bg-purple-50 p-3 rounded text-center">
              <h5 className="font-medium">You Pay</h5>
              <p className="text-lg">৳{result.suggestedPrice.toFixed(2)}/kg</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FairPriceCalculator;