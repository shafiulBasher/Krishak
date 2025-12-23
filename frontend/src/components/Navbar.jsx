import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { LogOut, User, Menu, X, ShoppingCart, Package } from 'lucide-react';
import { useState, useContext } from 'react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartItemCount } = useContext(CartContext) || { getCartItemCount: () => 0 };
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = getCartItemCount();

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
                {user?.role === 'buyer' && (
                  <>
                    <Link to="/cart" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center relative">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Cart
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/orders" className="hover:bg-primary-700 px-3 py-2 rounded-md flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      Orders
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
                {user?.role === 'buyer' && (
                  <>
                    <Link
                      to="/cart"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🛒 Cart {cartCount > 0 && `(${cartCount})`}
                    </Link>
                    <Link
                      to="/orders"
                      className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📦 Orders
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
