import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, User, Menu, X, ShoppingCart, Truck, Globe, ChevronDown } from 'lucide-react';
import { useState, useContext, useRef, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import NotificationDropdown from './NotificationDropdown';

// Standalone language dropdown — each instance manages its own open state & ref
const LangDropdown = ({ lang, setLang, mobile = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`relative ${mobile ? 'w-full' : ''}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 hover:bg-primary-700 px-3 py-2 rounded-md transition-colors ${mobile ? 'w-full' : ''}`}
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 flex-shrink-0" />
        <span className={lang === 'bn' ? 'font-bangla' : ''}>{lang === 'en' ? 'EN' : 'বাংলা'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`${mobile ? 'relative mt-1' : 'absolute right-0 mt-1'} w-36 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-100`}>
          <button
            onClick={() => { setLang('en'); setOpen(false); }}
            className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-sm transition-colors ${lang === 'en' ? 'font-semibold text-primary-600 bg-gray-50' : ''}`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => { setLang('bn'); setOpen(false); }}
            className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 text-sm font-bangla transition-colors ${lang === 'bn' ? 'font-semibold text-primary-600 bg-gray-50' : ''}`}
          >
            🇧🇩 বাংলা
          </button>
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get cart count - safely access context
  const cartContext = useContext(CartContext);
  const cartItemCount = (isAuthenticated && user?.role === 'buyer' && cartContext)
    ? cartContext.getCartItemCount()
    : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <span className="text-2xl font-bold">{t('nav.brand')}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  {t('nav.dashboard')}
                </Link>
                {user?.role !== 'admin' && (
                  <Link to="/browse-products" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                    {t('nav.browse')}
                  </Link>
                )}
                <Link
                  to={user?.role === 'admin' ? '/admin/market-prices' : '/market-prices'}
                  className="hover:bg-primary-700 px-3 py-2 rounded-md"
                >
                  {t('nav.market')}
                </Link>
                <Link to="/fair-price-calculator" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  {t('nav.fairPrice')}
                </Link>
                {user?.role === 'buyer' && (
                  <>
                    <Link to="/buyer/orders" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                      {t('nav.myOrders')}
                    </Link>
                    <Link to="/buyer/cart" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center relative">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {t('nav.cart')}
                      {cartItemCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user?.role === 'transporter' && (
                  <>
                    <Link to="/transporter/available-jobs" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center">
                      <Truck className="w-4 h-4 mr-1" />
                      {t('nav.findJobs')}
                    </Link>
                    <Link to="/transporter/my-deliveries" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                      {t('nav.myDeliveries')}
                    </Link>
                  </>
                )}
                <NotificationDropdown />
                <Link to="/profile" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {user?.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/market-prices" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  {t('nav.market')}
                </Link>
                <Link to="/login" className="hover:bg-primary-700 px-4 py-2 rounded-md">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 px-4 py-2 rounded-md font-medium">
                  {t('nav.register')}
                </Link>
              </>
            )}
            {/* Language Dropdown — desktop */}
            <LangDropdown lang={lang} setLang={setLang} />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-primary-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
                {user?.role !== 'admin' && (
                  <Link
                    to="/browse-products"
                    className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.browse')}
                  </Link>
                )}
                <Link
                  to={user?.role === 'admin' ? '/admin/market-prices' : '/market-prices'}
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.market')}
                </Link>
                <Link
                  to="/fair-price-calculator"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.fairPrice')}
                </Link>
                {user?.role === 'buyer' && (
                  <>
                    <Link
                      to="/buyer/orders"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.myOrders')}
                    </Link>
                    <Link
                      to="/buyer/cart"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md flex items-center justify-between"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{t('nav.cart')}</span>
                      {cartItemCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user?.role === 'transporter' && (
                  <>
                    <Link
                      to="/transporter/available-jobs"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md flex items-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {t('nav.findJobs')}
                    </Link>
                    <Link
                      to="/transporter/my-deliveries"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.myDeliveries')}
                    </Link>
                  </>
                )}
                <div className="px-3 py-2">
                  <NotificationDropdown />
                </div>
                <Link
                  to="/profile"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.profile')}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-left hover:bg-primary-700 px-3 py-2 rounded-md"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/browse-products"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.browse')}
                </Link>
                <Link
                  to="/market-prices"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.market')}
                </Link>
                <Link
                  to="/login"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="block bg-white text-primary-600 px-3 py-2 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
            {/* Language toggle — mobile */}
            <div className="border-t border-primary-500 pt-2 mt-1">
              <LangDropdown lang={lang} setLang={setLang} mobile />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
