import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Loader, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import Loading from '../../components/Loading';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';

export const StripeConnect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
      setError('Failed to load account status');
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
      setError(error.message || 'Failed to start onboarding');
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
      setError(error.message || 'Failed to refresh onboarding');
    } finally {
      setCreating(false);
    }
  };
  
  if (!['farmer', 'transporter'].includes(user?.role)) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Stripe Connect is only available for farmers and transporters.
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
        <h1 className="text-3xl font-bold text-gray-900">Stripe Connect</h1>
        <p className="text-gray-600 mt-1">
          Setup your payment account to receive earnings from orders
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
        <h2 className="text-xl font-semibold text-gray-900">Account Status</h2>
        
        {!status?.hasAccount ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-medium mb-2">No Payment Account Yet</p>
              <p className="text-sm text-blue-800">
                You need to create a Stripe Connect account to receive payments from orders.
                This process is secure and takes about 5 minutes.
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
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Start Onboarding
                </span>
              )}
            </Button>
          </div>
        ) : !status?.onboardingComplete ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-900 font-medium">Onboarding Incomplete</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Your Stripe Connect account is created but you need to complete the onboarding process.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Charges Enabled</p>
                <p className="font-medium text-gray-900">
                  {status.chargesEnabled ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payouts Enabled</p>
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
                  Loading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Continue Onboarding
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-900 font-medium">Account Active</p>
                <p className="text-sm text-green-800">
                  Your payment account is fully setup and ready to receive earnings.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => navigate(`/${user.role}/earnings`)}
                variant="outline"
              >
                View Earnings
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
                  Stripe Dashboard
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* What is Stripe Connect? */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">What is Stripe Connect?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Secure payment processing by Stripe, trusted by millions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Automatic transfers to your bank account after delivery</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Track your earnings and payout history</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>No upfront fees - only pay when you receive payments</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StripeConnect;
