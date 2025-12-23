import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { getDashboardStats } from '../../services/adminService';
import StatsCard from '../../components/admin/StatsCard';
import Loading from '../../components/Loading';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Users Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.users.total}
            icon={Users}
            color="primary"
          />
          <StatsCard
            title="Farmers"
            value={stats.users.farmers}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Buyers"
            value={stats.users.buyers}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Transporters"
            value={stats.users.transporters}
            icon={Users}
            color="purple"
          />
        </div>
      </div>

      {/* Listings Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Listing Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Listings"
            value={stats.listings.total}
            icon={Package}
            color="primary"
          />
          <StatsCard
            title="Pending Review"
            value={stats.listings.pending}
            icon={Package}
            color="yellow"
          />
          <StatsCard
            title="Approved"
            value={stats.listings.approved}
            icon={Package}
            color="green"
          />
          <StatsCard
            title="Rejected"
            value={stats.listings.rejected}
            icon={Package}
            color="red"
          />
        </div>
      </div>

      {/* Orders Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Orders"
            value={stats.orders.total}
            icon={ShoppingBag}
            color="primary"
          />
          <StatsCard
            title="Pending Orders"
            value={stats.orders.pending}
            icon={ShoppingBag}
            color="yellow"
          />
          <StatsCard
            title="Completed Orders"
            value={stats.orders.completed}
            icon={ShoppingBag}
            color="green"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage all users</p>
            </div>
            <Users className="w-6 h-6 text-primary-600" />
          </a>
          <a
            href="/admin/listings"
            className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">Moderate Listings</h3>
              <p className="text-sm text-gray-600">Review pending listings</p>
            </div>
            <Package className="w-6 h-6 text-primary-600" />
          </a>
          <a
            href="/admin/reports"
            className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Analytics and insights</p>
            </div>
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </a>
        </div>
      </div>
    </div>
  );
}
