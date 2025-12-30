import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, User, Phone, Calendar, ArrowRight, Search, Filter } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { getAvailableJobs, acceptJob } from '../../services/transporterService';
import { BANGLADESH_DISTRICTS } from '../../utils/bangladeshData';
import { toast } from 'react-toastify';

const AvailableJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [selectedDistrict]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getAvailableJobs(selectedDistrict);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (orderId) => {
    try {
      setAccepting(orderId);
      await acceptJob(orderId);
      toast.success('Job accepted successfully! Check My Deliveries to manage it.');
      // Remove the accepted job from the list
      setJobs(jobs.filter(job => job._id !== orderId));
      // Navigate to my deliveries after a short delay
      setTimeout(() => {
        navigate('/transporter/my-deliveries');
      }, 1500);
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error(error.response?.data?.message || 'Failed to accept job');
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
          <h1 className="text-3xl font-bold text-gray-900">Available Delivery Jobs</h1>
          <p className="text-gray-600 mt-1">Find and accept delivery jobs in your area</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Districts</option>
                {BANGLADESH_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <Button onClick={fetchJobs} variant="outline" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </Card>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Available</h3>
              <p className="text-gray-600 max-w-md">
                There are no delivery jobs available in your selected area right now. 
                Try changing the district filter or check back later.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map(job => (
              <Card key={job._id} className="hover:shadow-lg transition-shadow">
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                      Order #{job.orderNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {job.product?.cropName || 'Product'} - {job.quantity} kg
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ৳{job.priceBreakdown?.transportFee || 50}
                    </p>
                    <p className="text-xs text-gray-500">Delivery Fee</p>
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
                      <p className="text-xs text-green-600 font-medium uppercase">Pickup From</p>
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
                      <p className="text-xs text-blue-600 font-medium uppercase">Deliver To</p>
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
                    <span>Ordered: {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{job.quantity} kg</span>
                  </div>
                </div>

                {/* Accept Button */}
                <Button
                  onClick={() => handleAcceptJob(job._id)}
                  disabled={accepting === job._id}
                  fullWidth
                  className="mt-2"
                >
                  {accepting === job._id ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Accepting...
                    </>
                  ) : (
                    'Accept This Job'
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
