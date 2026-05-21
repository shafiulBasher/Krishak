import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import Loading from '../../components/Loading';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Earnings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchEarnings();
  }, []);
  
  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await paymentService.getEarnings();
      setEarnings(data);
    } catch (error) {
      console.error('Fetch earnings error:', error);
      setError(t('farmer.earnings.failedToLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };
  
  const openDashboard = async () => {
    try {
      const data = await paymentService.getDashboardLink();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Dashboard link error:', error);
    }
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (error && !earnings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={fetchEarnings} className="mt-4">
            {t('farmer.earnings.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('farmer.earnings.title')}</h1>
          <p className="text-gray-600 mt-1">{t('farmer.earnings.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openDashboard} variant="outline">
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              {t('farmer.earnings.stripeDashboard')}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium opacity-90">{t('farmer.earnings.availableBalance')}</h3>
          </div>
          <p className="text-4xl font-bold">৳{earnings?.availableBalance || 0}</p>
          <p className="text-sm opacity-80 mt-2">{t('farmer.earnings.readyForPayout')}</p>
        </div>
        
        {/* Pending Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium opacity-90">{t('farmer.earnings.pendingBalance')}</h3>
          </div>
          <p className="text-4xl font-bold">৳{earnings?.pendingBalance || 0}</p>
          <p className="text-sm opacity-80 mt-2">{t('farmer.earnings.beingProcessed')}</p>
        </div>
      </div>
      
      {/* Recent Transfers */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('farmer.earnings.recentTransfers')}</h2>
        </div>
        
        {earnings?.transfers && earnings.transfers.length > 0 ? (
          <div className="space-y-3">
            {earnings.transfers.map((transfer, index) => (
              <div
                key={transfer.id || index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">৳{transfer.amount}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transfer.created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {transfer.metadata?.orderId && (
                    <p className="text-xs text-gray-500">
                      {t('farmer.earnings.orderRef', { id: transfer.metadata.orderId.slice(-8) })}
                    </p>
                  )}
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {t('farmer.earnings.completed')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('farmer.earnings.noTransfers')}</p>
            <p className="text-sm text-gray-400 mt-1">
              {t('farmer.earnings.noTransfersDesc')}
            </p>
          </div>
        )}
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">{t('farmer.earnings.howItWorks')}</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {t('farmer.earnings.howItWorksList').map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-bold">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Earnings;
