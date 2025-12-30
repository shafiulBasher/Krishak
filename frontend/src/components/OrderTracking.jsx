import { CheckCircle, Package, Truck, MapPin, Clock } from 'lucide-react';
import { getImageUrl } from '../utils/imageHelper';

const STATUS_STEPS = [
  {
    status: 'not_assigned',
    label: 'Order Placed',
    description: 'Waiting for transporter assignment',
    icon: Package,
    color: 'gray'
  },
  {
    status: 'assigned',
    label: 'Transporter Assigned',
    description: 'A transporter has been assigned to your order',
    icon: Package,
    color: 'yellow'
  },
  {
    status: 'picked',
    label: 'Picked Up',
    description: 'Order has been picked up from the farmer',
    icon: CheckCircle,
    color: 'blue'
  },
  {
    status: 'in_transit',
    label: 'In Transit',
    description: 'Your order is on the way',
    icon: Truck,
    color: 'purple'
  },
  {
    status: 'delivered',
    label: 'Delivered',
    description: 'Order has been delivered successfully',
    icon: MapPin,
    color: 'green'
  }
];

const COLOR_CLASSES = {
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-300',
    line: 'bg-gray-300'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-400',
    line: 'bg-yellow-400'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-400',
    line: 'bg-blue-400'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-400',
    line: 'bg-purple-400'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-400',
    line: 'bg-green-400'
  }
};

const OrderTracking = ({ 
  currentStatus, 
  statusHistory = [], 
  transporterInfo = null,
  showTransporter = true,
  compact = false 
}) => {
  const getStatusIndex = (status) => {
    return STATUS_STEPS.findIndex(step => step.status === status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHistoryForStatus = (status) => {
    return statusHistory.find(h => h.status === status);
  };

  if (compact) {
    // Compact horizontal view
    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.slice(1).map((step, index) => {
            const isCompleted = currentIndex > index;
            const isCurrent = currentIndex === index + 1;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted || isCurrent 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-400'
                    }
                    ${isCurrent ? 'ring-2 ring-offset-2 ring-primary-600' : ''}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 text-center max-w-[80px] ${
                    isCompleted || isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STATUS_STEPS.length - 2 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentIndex > index + 1 ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full vertical timeline view
  return (
    <div className="w-full">
      {/* Transporter Info */}
      {showTransporter && transporterInfo && currentStatus !== 'not_assigned' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Transporter</p>
              <p className="font-semibold text-gray-900">{transporterInfo.name}</p>
              {transporterInfo.phone && (
                <a 
                  href={`tel:${transporterInfo.phone}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  📞 {transporterInfo.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = currentIndex >= index;
          const isCurrent = currentIndex === index;
          const history = getHistoryForStatus(step.status);
          const Icon = step.icon;
          const colorClass = COLOR_CLASSES[isCompleted ? step.color : 'gray'];

          return (
            <div key={step.status} className="flex gap-4 pb-8 last:pb-0">
              {/* Icon and Line */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${isCompleted ? colorClass.bg : 'bg-gray-100'}
                  ${isCompleted ? colorClass.border : 'border-gray-300'}
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-primary-500' : ''}
                `}>
                  <Icon className={`w-5 h-5 ${isCompleted ? colorClass.text : 'text-gray-400'}`} />
                </div>
                {index < STATUS_STEPS.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-2 ${
                    currentIndex > index ? 'bg-primary-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-sm ${
                      isCompleted ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  {history && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(history.timestamp)}
                    </div>
                  )}
                </div>

                {/* Note if exists */}
                {history?.note && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    📝 {history.note}
                  </div>
                )}

                {/* Photo if exists */}
                {history?.photo && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">📷 Product picked up from farmer - Photo verification</p>
                    <img 
                      src={getImageUrl(history.photo)} 
                      alt={`${step.label} photo`}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        console.error('Photo load error:', e.target.src);
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">Photo unavailable</text></svg>';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracking;
