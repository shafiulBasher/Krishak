import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatPrice, formatDate } from '../../utils/bangladeshData';

const PriceHistoryChart = ({ data, cropName }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">No price history available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear as prices are updated</p>
        </div>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map(item => ({
    date: formatDate(item.date),
    wholesale: item.wholesale,
    retail: item.retail,
    fullDate: new Date(item.date).toLocaleDateString()
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">{payload[0].payload.fullDate}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Wholesale:</span>
              <span className="text-sm font-semibold text-blue-600">{formatPrice(payload[0].value)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Retail:</span>
              <span className="text-sm font-semibold text-green-600">{formatPrice(payload[1].value)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Margin: ৳{(payload[1].value - payload[0].value).toFixed(0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{cropName} - Price Trend</h3>
        <p className="text-sm text-gray-500">Last {data.length} days</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            label={{ value: 'Price (৳/kg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 14 }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="wholesale" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 5 }}
            name="Wholesale Price"
          />
          <Line 
            type="monotone" 
            dataKey="retail" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            activeDot={{ r: 5 }}
            name="Retail Price"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Wholesale Range</p>
          <p className="text-lg font-bold text-blue-700">
            {formatPrice(Math.min(...chartData.map(d => d.wholesale)))} - {formatPrice(Math.max(...chartData.map(d => d.wholesale)))}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Retail Range</p>
          <p className="text-lg font-bold text-green-700">
            {formatPrice(Math.min(...chartData.map(d => d.retail)))} - {formatPrice(Math.max(...chartData.map(d => d.retail)))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
