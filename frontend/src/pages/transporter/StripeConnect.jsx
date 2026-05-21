import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import Loading from '../../components/Loading';
import paymentService from '../../services/paymentService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const StripeConnect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getConnectStatus();
      setStatus(data);
    } catch (error) {
      console.error('Get status error:', error);
      setError(t('transporter.stripe.loadFail'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartOnboarding = async () => {
    try {
      setCreating(true);
      setError('');
      const data = await paymentService.createConnectAccount();
      
      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else if (data.onboardingComplete) {
        // Already complete
        await checkStatus();
      }
    } catch (error) {
      console.error('Start onboarding error:', error);
      setError(error.message || t('transporter.stripe.startFail'));
    } finally {
      setCreating(false);
    }
  };
  
  const handleRefreshOnboarding = async () => {
    try {
      setCreating(true);
      setError('');
      const data = await paymentService.refreshOnboarding();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Refresh onboarding error:', error);
      setError(error.message || t('transporter.stripe.refreshFail'));
    } finally {
      setCreating(false);
    }
  };
  
  if (!['farmer', 'transporter'].includes(user?.role)) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {t('transporter.stripe.roleOnly')}
          </p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('transporter.stripe.title')}</h1>
        <p className="text-gray-600 mt-1">
          {t('transporter.stripe.subtitle')}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {/* Account Status */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">{t('transporter.stripe.accountStatus')}</h2>
        
        {!status?.hasAccount ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-medium mb-2">{t('transporter.stripe.noAccount')}</p>
              <p className="text-sm text-blue-800">
                {t('transporter.stripe.noAccountDesc')}
              </p>
            </div>
            
            <Button
              onClick={handleStartOnboarding}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  {t('transporter.stripe.creating')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  {t('transporter.stripe.startOnboarding')}
                </span>
              )}
            </Button>
          </div>
        ) : !status?.onboardingComplete ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-900 font-medium">{t('transporter.stripe.incomplete')}</p>
                <p className="text-sm text-yellow-800 mt-1">
                  {t('transporter.stripe.incompleteDesc')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">{t('transporter.stripe.chargesEnabled')}</p>
                <p className="font-medium text-gray-900">
                  {status.chargesEnabled ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('transporter.stripe.payoutsEnabled')}</p>
                <p className="font-medium text-gray-900">
                  {status.payoutsEnabled ? '✅ Yes' : '❌ No'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleRefreshOnboarding}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  {t('transporter.stripe.loading')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  {t('transporter.stripe.continueOnboarding')}
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-900 font-medium">{t('transporter.stripe.active')}</p>
                <p className="text-sm text-green-800">
                  {t('transporter.stripe.activeDesc')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => navigate(`/${user.role}/earnings`)}
                variant="outline"
              >
                {t('transporter.stripe.viewEarnings')}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const data = await paymentService.getDashboardLink();
                    if (data.url) {
                      window.open(data.url, '_blank');
                    }
                  } catch (error) {
                    console.error('Dashboard link error:', error);
                  }
                }}
                variant="outline"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {t('transporter.stripe.stripeDashboard')}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* What is Stripe Connect? */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">{t('transporter.stripe.whatIs')}</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('transporter.stripe.benefit1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('transporter.stripe.benefit2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('transporter.stripe.benefit3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>{t('transporter.stripe.benefit4')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StripeConnect;
