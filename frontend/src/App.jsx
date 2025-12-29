import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { CompleteProfile } from './pages/CompleteProfile';
import MarketPrices from './pages/MarketPrices';
import FairPriceCalculator from './pages/FairPriceCalculator';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ListingModeration from './pages/admin/ListingModeration';
import MarketPriceManagement from './pages/admin/MarketPriceManagement';
import CreateListing from './pages/farmer/CreateListing';
import MyListings from './pages/farmer/MyListings';
import EditListing from './pages/farmer/EditListing';
import { DeliveryAddresses } from './pages/buyer/DeliveryAddresses';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  // Only enable Google OAuth if valid Client ID is configured
  const isGoogleConfigured = googleClientId && googleClientId !== 'your-google-client-id-here.apps.googleusercontent.com';
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/fair-price-calculator" element={<FairPriceCalculator />} />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/listings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ListingModeration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/market-prices"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MarketPriceManagement />
                </ProtectedRoute>
              }
            />

            {/* Farmer Routes */}
            <Route
              path="/farmer/create-listing"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <CreateListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/my-listings"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <MyListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/edit-listing/:id"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <EditListing />
                </ProtectedRoute>
              }
            />

            {/* Buyer Routes */}
            <Route
              path="/buyer/addresses"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <DeliveryAddresses />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
