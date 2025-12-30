import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Package, DollarSign, MapPin, Star, Clock } from 'lucide-react';
import { Card } from '../../components/Card';
import { getTransporterStats } from '../../services/transporterService';
import { toast } from 'react-toastify';

const TransporterDashboard = () => {
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    pendingJobs: 0,
    averageRating: '0.0',
    totalRatings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getTransporterStats();
      setStats(response.data || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Transporter Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your deliveries and find new jobs</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Deliveries</p>
                <p className="text-3xl font-bold mt-1">{stats.activeDeliveries}</p>
              </div>
              <div className="bg-blue-400/30 p-3 rounded-full">
                <Truck className="w-8 h-8" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold mt-1">{stats.completedDeliveries}</p>
              </div>
              <div className="bg-green-400/30 p-3 rounded-full">
                <Package className="w-8 h-8" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Total Earnings</p>
                <p className="text-3xl font-bold mt-1">৳{stats.totalEarnings}</p>
              </div>
              <div className="bg-yellow-400/30 p-3 rounded-full">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Available Jobs</p>
                <p className="text-3xl font-bold mt-1">{stats.pendingJobs}</p>
              </div>
              <div className="bg-purple-400/30 p-3 rounded-full">
                <MapPin className="w-8 h-8" />
              </div>
            </div>
          </Card>
        </div>

        {/* Rating Card */}
        {stats.totalRatings > 0 && (
          <Card className="mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-4 rounded-full">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Your Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.averageRating}</span>
                  <span className="text-gray-500">/ 5.0</span>
                  <span className="text-sm text-gray-400">({stats.totalRatings} ratings)</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <Link to="/transporter/available-jobs" className="block">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 p-4 rounded-full">
                  <MapPin className="w-8 h-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Find Delivery Jobs</h3>
                  <p className="text-gray-600 text-sm">Browse available jobs in your area</p>
                  {stats.pendingJobs > 0 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      {stats.pendingJobs} jobs available
                    </span>
                  )}
                </div>
                <div className="text-gray-400">→</div>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <Link to="/transporter/my-deliveries" className="block">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">My Deliveries</h3>
                  <p className="text-gray-600 text-sm">Manage your assigned deliveries</p>
                  {stats.activeDeliveries > 0 && (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                      {stats.activeDeliveries} active
                    </span>
                  )}
                </div>
                <div className="text-gray-400">→</div>
              </div>
            </Link>
          </Card>
        </div>

        {/* Recent Activity Placeholder */}
        <Card className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Tips</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-500 font-bold">1.</span>
              <p className="text-gray-700 text-sm">Check available jobs regularly to find deliveries near your location</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-green-500 font-bold">2.</span>
              <p className="text-gray-700 text-sm">Always take a clear photo when picking up products for quality assurance</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-500 font-bold">3.</span>
              <p className="text-gray-700 text-sm">Update delivery status promptly to keep buyers and farmers informed</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TransporterDashboard;
