import { Truck, Car, Package } from 'lucide-react';

const VEHICLES = [
  {
    type: 'van',
    name: 'Van',
    icon: Car,
    baseRate: 300,
    perKmRate: 50,
    capacity: 'Up to 500kg',
    description: 'Best for small to medium orders',
    color: 'blue',
  },
  {
    type: 'pickup',
    name: 'Pickup',
    icon: Package,
    baseRate: 400,
    perKmRate: 75,
    capacity: 'Up to 1000kg',
    description: 'Ideal for medium to large orders',
    color: 'purple',
  },
  {
    type: 'truck',
    name: 'Truck',
    icon: Truck,
    baseRate: 500,
    perKmRate: 100,
    capacity: 'Up to 2000kg',
    description: 'For bulk orders and heavy items',
    color: 'orange',
  },
];

export const VehicleSelector = ({ selected, onSelect, distance, disabled = false }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Select Delivery Vehicle</h3>
        {distance && (
          <p className="text-sm text-gray-600 mt-1">
            Estimated distance: <span className="font-medium">{distance} km</span>
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VEHICLES.map((vehicle) => {
          const Icon = vehicle.icon;
          const estimatedFee = distance 
            ? vehicle.baseRate + (vehicle.perKmRate * distance) 
            : vehicle.baseRate;
          const isSelected = selected === vehicle.type;
          
          return (
            <button
              key={vehicle.type}
              onClick={() => !disabled && onSelect(vehicle.type)}
              disabled={disabled}
              className={`
                relative p-4 border-2 rounded-xl text-left transition-all duration-200
                ${isSelected 
                  ? 'border-green-500 bg-green-50 shadow-lg scale-105' 
                  : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-md'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-3">
                <div className={`
                  p-2 rounded-lg
                  ${isSelected ? 'bg-green-500' : 'bg-gray-100'}
                `}>
                  <Icon className={`
                    w-8 h-8
                    ${isSelected ? 'text-white' : 'text-gray-600'}
                  `} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                  <p className="text-xs text-gray-500">{vehicle.capacity}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{vehicle.description}</p>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Base Rate:</span>
                  <span className="font-medium">৳{vehicle.baseRate}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Per KM:</span>
                  <span className="font-medium">৳{vehicle.perKmRate}/km</span>
                </div>
                {distance && (
                  <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                    <span className="font-semibold text-gray-900">Estimated:</span>
                    <span className="font-bold text-green-600">৳{Math.round(estimatedFee)}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {!distance && (
        <p className="text-sm text-gray-500 text-center">
          Distance will be calculated based on delivery location
        </p>
      )}
    </div>
  );
};

export default VehicleSelector;
