import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Package, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { getDashboardStats } from '../../services/adminService';
import { getMarketStats } from '../../services/marketPriceService';
import StatsCard from '../../components/admin/StatsCard';
import Loading from '../../components/Loading';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [marketStats, setMarketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin dashboard stats...');
      const [dashboardData, marketData] = await Promise.all([
        getDashboardStats(),
        getMarketStats().catch(() => null) // Don't fail if market stats unavailable
      ]);
      console.log('Dashboard data received:', dashboardData);
      console.log('Market data received:', marketData);
      setStats(dashboardData.data);
      setMarketStats(marketData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(error.response?.data?.message || t('admin.dashboard.loadFail'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message={t('admin.dashboard.loading')} />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.dashboard.noStats')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('admin.dashboard.title')}</h1>

      {/* Users Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('admin.dashboard.userStats')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t('admin.dashboard.totalUsers')}
            value={stats.users.total}
            icon={Users}
            color="primary"
          />
          <StatsCard
            title={t('admin.dashboard.farmers')}
            value={stats.users.farmers}
            icon={Users}
            color="green"
          />
          <StatsCard
            title={t('admin.dashboard.buyers')}
            value={stats.users.buyers}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title={t('admin.dashboard.transporters')}
            value={stats.users.transporters}
            icon={Users}
            color="purple"
          />
        </div>
      </div>

      {/* Listings Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('admin.dashboard.listingStats')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t('admin.dashboard.totalListings')}
            value={stats.listings.total}
            icon={Package}
            color="primary"
          />
          <StatsCard
            title={t('admin.dashboard.pendingReview')}
            value={stats.listings.pending}
            icon={Package}
            color="yellow"
          />
          <StatsCard
            title={t('admin.dashboard.approved')}
            value={stats.listings.approved}
            icon={Package}
            color="green"
          />
          <StatsCard
            title={t('admin.dashboard.rejected')}
            value={stats.listings.rejected}
            icon={Package}
            color="red"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('admin.dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">{t('admin.dashboard.manageUsers')}</h3>
              <p className="text-sm text-gray-600">{t('admin.dashboard.manageUsersDesc')}</p>
            </div>
            <Users className="w-6 h-6 text-primary-600" />
          </a>
          <a
            href="/admin/listings"
            className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">{t('admin.dashboard.moderateListings')}</h3>
              <p className="text-sm text-gray-600">{t('admin.dashboard.moderateListingsDesc')}</p>
            </div>
            <Package className="w-6 h-6 text-primary-600" />
          </a>
          <a
            href="/admin/market-prices"
            className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">{t('admin.dashboard.marketPrices')}</h3>
              <p className="text-sm text-gray-600">
                {marketStats ? t('admin.dashboard.cropsTracked', { count: marketStats.totalCrops }) : t('admin.dashboard.updatePrices')}
              </p>
            </div>
            <DollarSign className="w-6 h-6 text-green-600" />
          </a>
          <a
            href="/admin/analytics"
            className="flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">{t('admin.dashboard.viewReports')}</h3>
              <p className="text-sm text-gray-600">{t('admin.dashboard.analyticsDesc')}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </a>
        </div>
      </div>
    </div>
  );
}
