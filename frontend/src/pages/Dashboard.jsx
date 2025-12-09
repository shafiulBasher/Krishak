import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { User, ShoppingCart, Truck, Shield } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'farmer':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Active Listings</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳0</h3>
                <p className="text-gray-600 mt-2">Total Earnings</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/farmer/create-listing" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">+ Create New Listing</p>
                  <p className="text-sm text-gray-600">Add a new product to sell</p>
                </Link>
                <Link to="/farmer/my-listings" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">View My Listings</p>
                  <p className="text-sm text-gray-600">Manage your products</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      case 'buyer':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳0</h3>
                <p className="text-gray-600 mt-2">Total Spent</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Pending Orders</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/browse" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">Browse Products</p>
                  <p className="text-sm text-gray-600">Find fresh produce from farmers</p>
                </Link>
                <Link to="/buyer/addresses" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">Delivery Addresses</p>
                  <p className="text-sm text-gray-600">Manage your delivery locations</p>
                </Link>
                <Link to="/orders" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">My Orders</p>
                  <p className="text-sm text-gray-600">Track your purchases</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      case 'transporter':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Active Deliveries</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Completed Trips</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳0</h3>
                <p className="text-gray-600 mt-2">Total Earnings</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/deliveries" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">Available Jobs</p>
                  <p className="text-sm text-gray-600">Find delivery jobs near you</p>
                </Link>
                <Link to="/deliveries/active" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">My Deliveries</p>
                  <p className="text-sm text-gray-600">Track your assigned deliveries</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Pending Listings</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Total Users</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">0</h3>
                <p className="text-gray-600 mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <h3 className="text-4xl font-bold text-primary-600">৳0</h3>
                <p className="text-gray-600 mt-2">Platform Revenue</p>
              </Card>
            </div>
            <Card>
              <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
              <div className="space-y-2">
                <Link to="/admin/listings" className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition">
                  <p className="font-medium text-primary-700">Moderate Listings</p>
                  <p className="text-sm text-gray-600">Approve or reject farmer listings</p>
                </Link>
                <Link to="/admin/users" className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <p className="font-medium text-gray-700">Manage Users</p>
                  <p className="text-sm text-gray-600">View and manage all users</p>
                </Link>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'farmer':
        return <User className="w-12 h-12 text-primary-600" />;
      case 'buyer':
        return <ShoppingCart className="w-12 h-12 text-primary-600" />;
      case 'transporter':
        return <Truck className="w-12 h-12 text-primary-600" />;
      case 'admin':
        return <Shield className="w-12 h-12 text-primary-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <div className="flex items-center">
            {getRoleIcon()}
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 capitalize">{user?.role} Dashboard</p>
            </div>
          </div>
        </Card>

        {getDashboardContent()}
      </div>
    </div>
  );
};
