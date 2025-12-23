import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Package,
  Edit,
  Trash2,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  AlertCircle,
  Filter,
  Grid,
  List as ListIcon,
} from 'lucide-react';
import { getMyListings, deleteProduct } from '../../services/productService';
import Loading from '../../components/Loading';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Select from '../../components/Select';

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('all');

  const statusConfig = {
    pending: {
      label: 'Pending Review',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600',
    },
    sold: {
      label: 'Sold',
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600',
    },
    expired: {
      label: 'Expired',
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      iconColor: 'text-gray-600',
    },
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [filter, listings]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await getMyListings();
      setListings(response.data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    if (filter === 'all') {
      setFilteredListings(listings);
    } else {
      setFilteredListings(listings.filter(listing => listing.status === filter));
    }
  };

  const handleDelete = async (id, cropName) => {
    if (!window.confirm(`Are you sure you want to delete "${cropName}" listing?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      toast.success('Listing deleted successfully');
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  if (loading) {
    return <Loading message="Loading your listings..." />;
  }

  const renderStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
        {config.label}
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredListings.map((listing) => (
        <Card key={listing._id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          {/* Image */}
          <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 rounded-t-lg overflow-hidden">
            {listing.photos && listing.photos.length > 0 ? (
              <img
                src={`${API_BASE_URL}${listing.photos[0]}`}
                alt={listing.cropName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="w-16 h-16 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg></div>';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="w-16 h-16 text-primary-300" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              {renderStatusBadge(listing.status)}
            </div>
            {listing.isPreOrder && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                Pre-Order
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.cropName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-0.5 bg-gray-100 rounded">Grade {listing.grade}</span>
                <span>•</span>
                <span>{listing.quantity} {listing.unit}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary-600">
                ৳{listing.sellingPrice}
              </span>
              <span className="text-sm text-gray-500">/{listing.unit}</span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>📍 {listing.location?.village}, {listing.location?.district}</p>
              <p>📦 MOQ: {listing.moq} {listing.unit}</p>
              <p>👁️ Views: {listing.viewCount || 0}</p>
            </div>

            {listing.moderationNote && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                <p className="font-semibold text-yellow-800 mb-1">Admin Note:</p>
                <p className="text-yellow-700">{listing.moderationNote}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t">
              <Link
                to={`/farmer/listings/${listing._id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View
              </Link>
              {listing.status !== 'sold' && (
                <>
                  <Link
                    to={`/farmer/listings/edit/${listing._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(listing._id, listing.cropName)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredListings.map((listing) => (
        <Card key={listing._id} className="hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Image */}
            <div className="w-full md:w-48 h-32 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg overflow-hidden flex-shrink-0">
              {listing.photos && listing.photos.length > 0 ? (
                <img
                  src={`http://localhost:5001${listing.photos[0]}`}
                  alt={listing.cropName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-12 h-12 text-primary-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{listing.cropName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">Grade {listing.grade}</span>
                    <span>•</span>
                    <span>{listing.quantity} {listing.unit}</span>
                    {listing.isPreOrder && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">Pre-Order</span>
                      </>
                    )}
                  </div>
                </div>
                {renderStatusBadge(listing.status)}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary-600">
                  ৳{listing.sellingPrice}
                </span>
                <span className="text-sm text-gray-500">/{listing.unit}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                <div>📍 {listing.location?.village}, {listing.location?.district}</div>
                <div>📦 MOQ: {listing.moq} {listing.unit}</div>
                <div>👁️ Views: {listing.viewCount || 0}</div>
                <div>📅 {new Date(listing.createdAt).toLocaleDateString()}</div>
              </div>

              {listing.moderationNote && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                  <p className="font-semibold text-yellow-800">Admin Note:</p>
                  <p className="text-yellow-700">{listing.moderationNote}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link
                  to={`/farmer/listings/${listing._id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                {listing.status !== 'sold' && (
                  <>
                    <Link
                      to={`/farmer/listings/edit/${listing._id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg transition text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(listing._id, listing.cropName)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
            <p className="text-gray-600">
              Manage your crop listings ({filteredListings.length} {filter === 'all' ? 'total' : filter})
            </p>
          </div>
          <Link to="/farmer/create-listing">
            <Button className="flex items-center gap-2 shadow-lg">
              <Plus className="w-5 h-5" />
              Create New Listing
            </Button>
          </Link>
        </div>

        {/* Filters and View Toggle */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-w-[200px]"
              >
                <option value="all">All Listings ({listings.length})</option>
                <option value="pending">
                  Pending ({listings.filter(l => l.status === 'pending').length})
                </option>
                <option value="approved">
                  Approved ({listings.filter(l => l.status === 'approved').length})
                </option>
                <option value="rejected">
                  Rejected ({listings.filter(l => l.status === 'rejected').length})
                </option>
                <option value="sold">
                  Sold ({listings.filter(l => l.status === 'sold').length})
                </option>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition ${
                  viewMode === 'grid'
                    ? 'bg-white shadow text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md transition ${
                  viewMode === 'list'
                    ? 'bg-white shadow text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Listings */}
        {filteredListings.length === 0 ? (
          <Card className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Start by creating your first crop listing'
                : `You don't have any ${filter} listings`}
            </p>
            {filter === 'all' && (
              <Link to="/farmer/create-listing">
                <Button className="inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Listing
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        )}
      </div>
    </div>
  );
}