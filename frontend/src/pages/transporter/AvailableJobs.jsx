import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLocalizedCrop } from '../../utils/bangladeshData';
import { MapPin, Package, User, Phone, Calendar, ArrowRight, Search, AlertTriangle, Navigation } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { getAvailableJobs, acceptJob } from '../../services/transporterService';
import { toast } from 'react-toastify';

const AvailableJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const isVan = user?.vehicleType === 'van';
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [maxServiceRadius, setMaxServiceRadius] = useState(50);
  const [hasNoVehicleType, setHasNoVehicleType] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getAvailableJobs();
      setJobs(response.data || []);
      if (response.maxServiceRadius) {
        setMaxServiceRadius(response.maxServiceRadius);
      }
      setHasNoVehicleType(response.hasNoVehicleType ?? false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error(t('transporter.jobs.loadFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (orderId) => {
    try {
      setAccepting(orderId);
      await acceptJob(orderId);
      toast.success(t('transporter.jobs.jobAccepted'));
      // Remove the accepted job from the list
      setJobs(jobs.filter(job => job._id !== orderId));
      // Navigate to my deliveries after a short delay
      setTimeout(() => {
        navigate('/transporter/my-deliveries');
      }, 1500);
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error(error.response?.data?.message || t('transporter.jobs.acceptFail'));
    } finally {
      setAccepting(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('transporter.jobs.title')}</h1>
          <p className="text-gray-600 mt-1">{t('transporter.jobs.subtitle')}</p>
        </div>

        {/* No Vehicle Type Banner */}
        {hasNoVehicleType && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">{t('transporter.jobs.noVehicleWarn')}</p>
              <p className="text-sm text-red-700 mt-1">
                {t('transporter.jobs.noVehicleDesc')}{' '}
                <a href="/profile" className="underline font-medium">{t('nav.profile')}</a>
              </p>
            </div>
          </div>
        )}

        {/* Refresh Bar */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {t('transporter.jobs.showingRange', { range: maxServiceRadius, type: user?.vehicleType ? user.vehicleType.charAt(0).toUpperCase() + user.vehicleType.slice(1) : 'all' })}
          </p>
          <Button onClick={fetchJobs} variant="outline" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t('transporter.jobs.refresh')}
          </Button>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('transporter.jobs.noJobs')}</h3>
              <p className="text-gray-600 max-w-md">
                {t('transporter.jobs.noJobsDesc', { type: user?.vehicleType || 'unspecified', range: maxServiceRadius })}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map(job => (
              <Card key={job._id} className={`hover:shadow-lg transition-shadow ${!job.isWithinRange ? 'opacity-75 border-2 border-orange-200' : ''}`}>
                {/* Distance Warning Banner */}
                {!job.isWithinRange && job.distanceWarning && (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">{t('transporter.jobs.outsideArea')}</p>
                      <p className="text-xs text-orange-700">{job.distanceWarning}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        {isVan
                          ? t('transporter.jobs.vanLimit')
                          : t('transporter.jobs.tooFar')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Distance Info Badge */}
                {job.distances && job.isWithinRange && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">{t('transporter.jobs.withinArea')}</span>
                    </div>
                    {job.distances.pickupDistance > 0 && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                          {t('transporter.jobs.pickupDistance', { distance: job.distances.pickupDistance.toFixed(1) })}
                      </span>
                    )}
                  </div>
                )}

                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Order #{job.orderNumber}
                      </span>
                      {job.deliveryFeeDetails?.vehicleType && (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full capitalize">
                          🚚 {job.deliveryFeeDetails.vehicleType}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getLocalizedCrop(job.product?.cropName || 'Product', lang)} - {job.quantity} kg
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ৳{job.priceBreakdown?.transportFee || 50}
                    </p>
                    <p className="text-xs text-gray-500">{t('transporter.jobs.deliveryFee')}</p>
                  </div>
                </div>

                {/* Pickup & Delivery Info */}
                <div className="space-y-4 mb-4">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="bg-green-500 text-white p-2 rounded-full mt-1">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600 font-medium uppercase">{t('transporter.jobs.pickupFrom')}</p>
                        {job.distances?.toFarmer > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {job.distances.toFarmer.toFixed(1)}km
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{job.farmer?.name}</p>
                      <p className="text-sm text-gray-600">
                        {job.product?.location?.village}, {job.product?.location?.thana}, {job.product?.location?.district}
                      </p>
                      <a href={`tel:${job.farmer?.phone}`} className="flex items-center gap-1 text-sm text-primary-600 mt-1">
                        <Phone className="w-3 h-3" /> {job.farmer?.phone}
                      </a>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                  </div>

                  {/* Delivery Location */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="bg-blue-500 text-white p-2 rounded-full mt-1">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-600 font-medium uppercase">{t('transporter.jobs.deliverTo')}</p>
                        {job.distances?.deliveryDistance > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {t('transporter.jobs.routeDistance', { distance: job.distances.deliveryDistance.toFixed(1) })}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{job.buyer?.name}</p>
                      <p className="text-sm text-gray-600">
                        {job.deliveryAddress?.addressLine}, {job.deliveryAddress?.thana}, {job.deliveryAddress?.district}
                      </p>
                      <a href={`tel:${job.buyer?.phone}`} className="flex items-center gap-1 text-sm text-primary-600 mt-1">
                        <Phone className="w-3 h-3" /> {job.buyer?.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t('transporter.jobs.ordered', { date: formatDate(job.createdAt) })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{job.quantity} kg</span>
                  </div>
                </div>

                {/* Accept Button */}
                <Button
                  onClick={() => handleAcceptJob(job._id)}
                  disabled={accepting === job._id || !job.isWithinRange}
                  fullWidth
                  className="mt-2"
                  variant={!job.isWithinRange ? 'secondary' : 'primary'}
                >
                  {accepting === job._id ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t('transporter.jobs.accepting')}
                    </>
                  ) : !job.isWithinRange ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {t('transporter.jobs.tooFar')}
                    </>
                  ) : (
                    t('transporter.jobs.accept')
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableJobs;
