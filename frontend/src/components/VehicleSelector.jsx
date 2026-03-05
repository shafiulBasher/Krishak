import { Truck, Car, Package, AlertCircle } from 'lucide-react';

const VEHICLES = [
  {
    type: 'van',
    name: 'Van',
    icon: Car,
    baseRate: 300,
    perKmRate: 50,
    capacity: 'Up to 500kg',
    description: 'Best for small to medium orders',
    maxDistanceKm: 30, // hard limit: van only covers 30km
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
    maxDistanceKm: null, // no hard limit
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
    maxDistanceKm: null, // no hard limit
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
          // Disable this vehicle if the delivery distance exceeds its max range
          const isOutOfRange = vehicle.maxDistanceKm !== null && distance !== null && distance > vehicle.maxDistanceKm;
          const isDisabled = disabled || isOutOfRange;
          
          return (
            <button
              key={vehicle.type}
              onClick={() => !isDisabled && onSelect(vehicle.type)}
              disabled={isDisabled}
              title={isOutOfRange ? `Not available — van only covers up to ${vehicle.maxDistanceKm}km` : ''}
              className={`
                relative p-4 border-2 rounded-xl text-left transition-all duration-200
                ${isSelected && !isOutOfRange
                  ? 'border-green-500 bg-green-50 shadow-lg scale-105' 
                  : isOutOfRange
                    ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-300 bg-white hover:border-green-300 hover:shadow-md'
                }
                ${disabled && !isOutOfRange ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSelected && !isOutOfRange && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {isOutOfRange && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-3">
                <div className={`
                  p-2 rounded-lg
                  ${isSelected && !isOutOfRange ? 'bg-green-500' : isOutOfRange ? 'bg-red-200' : 'bg-gray-100'}
                `}>
                  <Icon className={`
                    w-8 h-8
                    ${isSelected && !isOutOfRange ? 'text-white' : isOutOfRange ? 'text-red-400' : 'text-gray-600'}
                  `} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isOutOfRange ? 'text-red-400' : 'text-gray-900'}`}>{vehicle.name}</h4>
                  <p className="text-xs text-gray-500">{vehicle.capacity}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{vehicle.description}</p>

              {/* Out-of-range notice */}
              {isOutOfRange && (
                <div className="flex items-start gap-1.5 mb-3 p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium">
                    Not available — van only covers up to {vehicle.maxDistanceKm}km.
                    Your delivery is {distance}km.
                  </p>
                </div>
              )}
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Base Rate:</span>
                  <span className="font-medium">৳{vehicle.baseRate}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Per KM:</span>
                  <span className="font-medium">৳{vehicle.perKmRate}/km</span>
                </div>
                {vehicle.maxDistanceKm && (
                  <div className="flex justify-between text-gray-600">
                    <span>Max Range:</span>
                    <span className="font-medium text-orange-600">{vehicle.maxDistanceKm}km</span>
                  </div>
                )}
                {distance && !isOutOfRange && (
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
