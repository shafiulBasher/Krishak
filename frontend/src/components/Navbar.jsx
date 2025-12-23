import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
<<<<<<< HEAD
                <Link to="/market-prices" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Market
=======
                <Link to="/fair-price-calculator" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Fair Price Calculator
>>>>>>> b4da24f (New import of project files)
                </Link>
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
<<<<<<< HEAD
                <Link to="/market-prices" className="hover:bg-primary-700 px-3 py-2 rounded-md">
                  Market
                </Link>
=======
>>>>>>> b4da24f (New import of project files)
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
<<<<<<< HEAD
                  to="/market-prices"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Market
=======
                  to="/fair-price-calculator"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fair Price Calculator
>>>>>>> b4da24f (New import of project files)
                </Link>
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
<<<<<<< HEAD
                  to="/market-prices"
                  className="block hover:bg-primary-700 px-3 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Market
                </Link>
                <Link
=======
>>>>>>> b4da24f (New import of project files)
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
