import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-600">Krishak</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connecting Farmers, Buyers, and Transporters for fair pricing and efficient supply chain management in Bangladesh.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-primary-50 transition"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🌾</div>
            <h3 className="text-xl font-semibold mb-2">For Farmers</h3>
            <p className="text-gray-600">List your crops with fair pricing and connect directly with buyers.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold mb-2">For Buyers</h3>
            <p className="text-gray-600">Get fresh produce directly from farmers at transparent prices.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">For Transporters</h3>
            <p className="text-gray-600">Find delivery jobs and earn by connecting farms to markets.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
