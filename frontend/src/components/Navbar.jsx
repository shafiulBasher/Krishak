import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, X, ShoppingCart, Truck } from 'lucide-react';
import { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
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
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <span className="text-2xl font-bold">🌾 Krishak</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                <Link to="/browse-products" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Browse
                </Link>
                <Link to="/market-prices" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Market
                </Link>
                <Link to="/fair-price-calculator" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Fair Price
                </Link>
                {user?.role === 'buyer' && (
                  <>
                    <Link to="/buyer/orders" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                      My Orders
                    </Link>
                    <Link to="/buyer/cart" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center relative">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Cart
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
                      Find Jobs
                    </Link>
                    <Link to="/transporter/my-deliveries" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                      My Deliveries
                    </Link>
                  </>
                )}
                <Link to="/profile" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {user?.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/market-prices" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Market
                </Link>
                <Link to="/login" className="hover:bg-primary-700 px-4 py-2 rounded-md">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 px-4 py-2 rounded-md font-medium">
                  Register
                </Link>
              </>
            )}
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
          <div className="md:hidden pb-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/browse-products"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  to="/market-prices"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Market
                </Link>
                <Link
                  to="/fair-price-calculator"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fair Price
                </Link>
                {user?.role === 'buyer' && (
                  <>
                    <Link
                      to="/buyer/orders"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/buyer/cart"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md flex items-center justify-between"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Cart</span>
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
                      Find Jobs
                    </Link>
                    <Link
                      to="/transporter/my-deliveries"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Deliveries
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left hover:bg-primary-700 px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/browse-products"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  to="/market-prices"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Market
                </Link>
                <Link
                  to="/login"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block bg-white text-primary-600 px-3 py-2 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
