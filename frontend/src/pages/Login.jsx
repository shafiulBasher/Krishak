import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData);
      // API interceptor returns response.data, so response has success, data properties
      const userData = response.data || response;
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const result = await googleLogin(credentialResponse.credential);
      
      if (result.needsCompletion) {
        navigate('/complete-profile');
      } else if (result.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error || t('auth.loginGoogleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    if (error?.error === 'popup_closed_by_user') {
      // User closed the popup, don't show error
      return;
    }
    // Check if it's an origin error
    if (error?.message?.includes('origin') || error?.type === 'idpiframe_initialization_failed') {
      toast.error('Google Sign-In configuration error. Please use email/password login or contact support.');
    } else {
      toast.error(t('auth.googleNotAvailable'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <LogIn className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('auth.welcomeBack')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('auth.loginToKrishak')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label={t('auth.emailAddress')}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('auth.emailPlaceholder')}
            required
          />

          <Input
            label={t('auth.password')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('auth.enterPassword')}
            required
          />

          <div className="mt-6">
            <Button type="submit" disabled={loading} fullWidth>
              {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-4">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && 
               import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your-google-client-id-here.apps.googleusercontent.com' &&
               import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="384"
                />
              ) : (
                <div className="text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  {t('auth.googleNotConfigured')}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">{t('auth.noAccount')} </span>
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.registerHere')}
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
