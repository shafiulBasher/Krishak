import { useState, useEffect } from 'react';
import { Package, Check, X, Filter, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { getPendingProducts, approveProduct, rejectProduct, getAllProducts } from '../../services/adminService';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';

export default function ListingModeration() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [moderationNote, setModerationNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'approve' or 'reject'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [filter, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching products with filter:', filter);
      const filters = {};
      if (filter !== 'all') filters.status = filter;
      if (searchQuery) filters.search = searchQuery;

      const response = filter === 'pending' 
        ? await getPendingProducts()
        : await getAllProducts(filters);
      
      console.log('Response received:', response);
      // The API interceptor already unwraps response.data, so response is the full data object
      const productsData = response.data || [];
      console.log('Setting products:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMsg = typeof error === 'string' ? error : error?.message || 'Failed to fetch products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveProduct(selectedProduct._id, moderationNote);
      toast.success('Product approved successfully');
      setShowModal(false);
      setSelectedProduct(null);
      setModerationNote('');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve product');
    }
  };

  const handleReject = async () => {
    if (!moderationNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectProduct(selectedProduct._id, moderationNote);
      toast.success('Product rejected successfully');
      setShowModal(false);
      setSelectedProduct(null);
      setModerationNote('');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject product');
    }
  };

  const openModal = (product, action) => {
    setSelectedProduct(product);
    setModalAction(action);
    setShowModal(true);
    setModerationNote('');
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTimeout(() => {
      setSearchQuery(value);
    }, 500);
  };

  if (loading && products.length === 0) {
    return <Loading message="Loading listings..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    sold: 'bg-blue-100 text-blue-800',
    expired: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Listing Moderation</h1>
        <div className="text-sm text-gray-600">
          Total Listings: <span className="font-semibold">{products.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by product name or category..."
              className="pl-10"
              onChange={handleSearchChange}
            />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Listings</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No listings found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product._id}>
              <div className="space-y-4">
                {/* Product Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{product.cropName}</h3>
                    <p className="text-sm text-gray-600">Grade: {product.grade}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[product.status]
                    }`}
                  >
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </div>

                {/* Product Photos */}
                {product.photos && product.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <img
                      src={`http://localhost:5000${product.photos[0]}`}
                      alt="Main crop"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    {product.photos.slice(1, 3).map((photo, idx) => (
                      <img
                        key={idx}
                        src={`http://localhost:5000${photo}`}
                        alt={`Detail ${idx + 1}`}
                        className="w-full h-16 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}

                {/* Product Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{product.quantity} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selling Price:</span>
                    <span className="font-medium text-primary-600">
                      ৳{product.sellingPrice}/{product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MOQ:</span>
                    <span className="font-medium">{product.moq} {product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {product.location?.village}, {product.location?.thana}, {product.location?.district}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harvest Date:</span>
                    <span className="font-medium">{new Date(product.harvestDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Farmer Info */}
                {product.farmer && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Farmer Details</p>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{product.farmer.name}</p>
                      <p className="text-gray-600">{product.farmer.phone}</p>
                      <p className="text-gray-500">
                        {product.farmer.farmLocation && typeof product.farmer.farmLocation === 'object'
                          ? `${product.farmer.farmLocation.village}, ${product.farmer.farmLocation.thana}, ${product.farmer.farmLocation.district}`
                          : product.farmer.farmLocation || product.farmer.location}
                      </p>
                    </div>
                  </div>
                )}

                {/* Moderation Note */}
                {product.moderationNote && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Moderation Note</p>
                    <p className="text-sm text-gray-700">{product.moderationNote}</p>
                  </div>
                )}

                {/* Actions (Only for pending products) */}
                {product.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => openModal(product, 'approve')}
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => openModal(product, 'reject')}
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created: {new Date(product.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Moderation Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalAction === 'approve' ? 'Approve Product' : 'Reject Product'}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Product: <span className="font-medium">{selectedProduct.name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Farmer: <span className="font-medium">{selectedProduct.farmer?.name}</span>
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalAction === 'approve' ? 'Note (Optional)' : 'Reason for Rejection *'}
              </label>
              <textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                placeholder={
                  modalAction === 'approve'
                    ? 'Add a note about the approval...'
                    : 'Explain why this listing is being rejected...'
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                  setModerationNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant={modalAction === 'approve' ? 'primary' : 'danger'}
                onClick={modalAction === 'approve' ? handleApprove : handleReject}
              >
                {modalAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
