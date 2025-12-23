import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';

const FairPriceCalculator = () => {
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-8 text-green-700">Fair-Price Calculator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farmer Cost Breakdown */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Farmer Cost Breakdown</h2>
          <div className="space-y-4">
            <Input
              label="Seed Cost (৳)"
              name="seed"
              type="number"
              value={costs.seed}
              onChange={handleInputChange}
              placeholder="Enter seed cost"
            />
            <Input
              label="Fertilizer Cost (৳)"
              name="fertilizer"
              type="number"
              value={costs.fertilizer}
              onChange={handleInputChange}
              placeholder="Enter fertilizer cost"
            />
            <Input
              label="Labor Cost (৳)"
              name="labor"
              type="number"
              value={costs.labor}
              onChange={handleInputChange}
              placeholder="Enter labor cost"
            />
            <Input
              label="Transport Cost (৳)"
              name="transport"
              type="number"
              value={costs.transport}
              onChange={handleInputChange}
              placeholder="Enter transport cost"
            />
          </div>
          <Button onClick={calculateFairPrice} className="mt-6 w-full">
            Calculate Fair Price
          </Button>
        </div>

        {/* Price Comparison for Buyers */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Price Comparison</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Suggested Fair Price:</span>
              <span className="font-bold text-green-600">৳{fairPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Wholesale Price:</span>
              <span className="font-bold text-blue-600">৳{wholesalePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Retail Price:</span>
              <span className="font-bold text-red-600">৳{retailPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Farmer Earnings:</span>
              <span className="font-bold text-purple-600">৳{farmerEarnings.toFixed(2)}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            This calculator helps ensure fair pricing by considering all production costs and suggesting a reasonable profit margin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FairPriceCalculator;