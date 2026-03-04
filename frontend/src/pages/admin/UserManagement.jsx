import { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Trash2, Info, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAllUsers, updateUserStatus, verifyUser, deleteUser, getUserSummary } from '../../services/adminService';
// Fixed JSX syntax error - removed duplicate closing div
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import UserBadge from '../../components/admin/UserBadge';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    isVerified: '',
    search: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users with filters:', filters);
      const response = await getAllUsers(filters);
      console.log('📦 Response received:', response);
      console.log('👥 Users data:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleVerifyToggle = async (userId, currentStatus) => {
    try {
      await verifyUser(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(selectedUser._id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleViewSummary = async (user) => {
    setShowSummaryModal(true);
    setSummaryData(null);
    setSummaryLoading(true);
    try {
      const response = await getUserSummary(user._id);
      setSummaryData(response.data);
    } catch (error) {
      toast.error('Failed to load user summary');
      setShowSummaryModal(false);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // Debounce search
    setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 500);
  };

  if (loading && users.length === 0) {
    return <Loading message="Loading users..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <div className="text-sm text-gray-600">
            Total Users: <span className="font-semibold text-primary-600">{users.length}</span>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, phone..."
              className="pl-10"
              onChange={handleSearchChange}
            />
          </div>
          <Select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
            <option value="transporter">Transporter</option>
            <option value="admin">Admin</option>
          </Select>
          <Select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          <Select
            value={filters.isVerified}
            onChange={(e) => handleFilterChange('isVerified', e.target.value)}
          >
            <option value="">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <UserBadge user={user} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">{user.email.substring(0, 3)}***@{user.email.split('@')[1]}</div>
                        {user.phone && (
                          <div className="text-gray-500">{user.phone.substring(0, 6)}*****</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-xs font-medium ${
                            user.isActive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {user.isVerified && (
                          <span className="text-xs text-blue-600">Verified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Summary */}
                        <button
                          onClick={() => handleViewSummary(user)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="View Summary"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {/* Activate / Deactivate */}
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive
                              ? 'bg-red-50 hover:bg-red-100 text-red-600'
                              : 'bg-green-50 hover:bg-green-100 text-green-600'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        {/* Verify / Unverify */}
                        <button
                          onClick={() => handleVerifyToggle(user._id, user.isVerified)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isVerified
                              ? 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                          }`}
                          title={user.isVerified ? 'Unverify' : 'Verify'}
                        >
                          {user.isVerified ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        {/* Delete (non-admins only) */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">User Summary</h3>
              <button
                onClick={() => { setShowSummaryModal(false); setSummaryData(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {summaryLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : summaryData ? (
              <div className="space-y-4">
                {/* Identity */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                    {summaryData.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{summaryData.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{summaryData.role}</p>
                  </div>
                </div>

                {/* Status flags */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 text-center">
                    <p className="text-xs text-gray-500 mb-1">Account</p>
                    <span className={`text-sm font-semibold ${ summaryData.isActive ? 'text-green-600' : 'text-red-600' }`}>
                      {summaryData.isActive ? '✅ Active' : '🚫 Inactive'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 text-center">
                    <p className="text-xs text-gray-500 mb-1">Verification</p>
                    <span className={`text-sm font-semibold ${ summaryData.isVerified ? 'text-blue-600' : 'text-gray-500' }`}>
                      {summaryData.isVerified ? '🔵 Verified' : '⚪ Unverified'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 text-center">
                    <p className="text-xs text-gray-500 mb-1">Joined</p>
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(summaryData.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {summaryData.location && (
                    <div className="p-3 rounded-lg bg-gray-50 text-center">
                      <p className="text-xs text-gray-500 mb-1">District</p>
                      <span className="text-sm font-medium text-gray-700">{summaryData.location}</span>
                    </div>
                  )}
                  {summaryData.vehicleType && (
                    <div className="p-3 rounded-lg bg-gray-50 text-center col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                      <span className="text-sm font-medium text-gray-700 capitalize">{summaryData.vehicleType}</span>
                    </div>
                  )}
                </div>

                {/* Role-specific activity counts */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activity (Counts Only)</p>
                  <div className="space-y-1">
                    {summaryData.role === 'farmer' && (
                      <>
                        {summaryData.activitySummary.listings?.map(l => (
                          <div key={l._id} className="flex justify-between text-sm px-3 py-1.5 bg-gray-50 rounded">
                            <span className="text-gray-600 capitalize">{l._id} listings</span>
                            <span className="font-semibold text-gray-800">{l.count}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm px-3 py-1.5 bg-gray-50 rounded">
                          <span className="text-gray-600">Orders received</span>
                          <span className="font-semibold text-gray-800">{summaryData.activitySummary.orderCount ?? 0}</span>
                        </div>
                      </>
                    )}
                    {summaryData.role === 'buyer' && (
                      summaryData.activitySummary.orders?.length > 0
                        ? summaryData.activitySummary.orders.map(o => (
                            <div key={o._id} className="flex justify-between text-sm px-3 py-1.5 bg-gray-50 rounded">
                              <span className="text-gray-600 capitalize">{o._id} orders</span>
                              <span className="font-semibold text-gray-800">{o.count}</span>
                            </div>
                          ))
                        : <p className="text-sm text-gray-400 px-3">No orders placed yet</p>
                    )}
                    {summaryData.role === 'transporter' && (
                      summaryData.activitySummary.deliveries?.length > 0
                        ? summaryData.activitySummary.deliveries.map(d => (
                            <div key={d._id} className="flex justify-between text-sm px-3 py-1.5 bg-gray-50 rounded">
                              <span className="text-gray-600 capitalize">{d._id.replace('_', ' ')} deliveries</span>
                              <span className="font-semibold text-gray-800">{d.count}</span>
                            </div>
                          ))
                        : <p className="text-sm text-gray-400 px-3">No deliveries yet</p>
                    )}
                    {summaryData.role === 'admin' && (
                      <p className="text-sm text-gray-400 px-3">Admin account — no activity counts applicable</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center pt-2">
                  Showing activity counts only — personal details are not exposed for privacy.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user <span className="font-semibold">{selectedUser.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
