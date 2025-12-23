import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthProvider from './context/AuthContext';
import CartProvider from './context/CartContext';
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
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ListingModeration from './pages/admin/ListingModeration';
import CreateListing from './pages/farmer/CreateListing';
import MyListings from './pages/farmer/MyListings';
import EditListing from './pages/farmer/EditListing';
import { DeliveryAddresses } from './pages/buyer/DeliveryAddresses';
import Cart from './pages/buyer/Cart';
import Checkout from './pages/buyer/Checkout';
import MyOrders from './pages/buyer/MyOrders';
import Browse from './pages/Browse';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  // Only enable Google OAuth if valid Client ID is configured
  const isGoogleConfigured = googleClientId && googleClientId !== 'your-google-client-id-here.apps.googleusercontent.com';
  
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/browse" element={<Browse />} />
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
              <Route
                path="/cart"
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <MyOrders />
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
        </CartProvider>
      </AuthProvider>
      </GoogleOAuthProvider>
  );
}

export default App;
