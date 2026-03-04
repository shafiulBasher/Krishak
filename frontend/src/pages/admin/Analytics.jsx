import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, ShoppingBag, Package,
  DollarSign, CheckCircle, BarChart2, Clock, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { getAnalytics } from '../../services/adminService';
import Loading from '../../components/Loading';
import Card from '../../components/Card';

// ─── Color maps ───────────────────────────────────────────────────────────────
const LISTING_COLORS = {
  pending:  '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  sold:     '#3B82F6',
  expired:  '#9CA3AF',
};
const LISTING_LABELS = {
  pending:  'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  sold:     'Sold',
  expired:  'Expired',
};
const ROLE_COLORS = {
  farmer:      '#10B981',
  buyer:       '#3B82F6',
  transporter: '#8B5CF6',
  admin:       '#F59E0B',
};

// ─── KPI Card (internal) ──────────────────────────────────────────────────────
function KPICard({ title, value, icon: Icon, color, sub }) {
  const colorMap = {
    green:   'bg-green-50 text-green-600',
    blue:    'bg-blue-50 text-blue-600',
    purple:  'bg-purple-50 text-purple-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    primary: 'bg-primary-50 text-primary-600',
    red:     'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium leading-tight">{title}</span>
        <span className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.primary}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Custom Tooltip for recharts ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChart({ message = 'No data available yet' }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      {message}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getAnalytics();
      setData(response.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading analytics…" />;
  if (!data)   return <div className="text-center py-12 text-gray-500">No analytics data available</div>;

  const {
    kpis,
    usersByRole,
    ordersOverTime,
    listingsByStatus,
    ordersByStatus,
    topCrops,
    districtActivity,
    moderationActivity,
  } = data;

  // ── Transform data for recharts ───────────────────────────────────────────
  const ordersChartData = ordersOverTime.map(d => ({
    date: new Date(d._id).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    Orders: d.count,
    'Revenue (৳)': Math.round(d.revenue || 0),
  }));

  const listingsChartData = listingsByStatus.map(d => ({
    name:  LISTING_LABELS[d._id] || d._id,
    value: d.count,
    color: LISTING_COLORS[d._id] || '#9CA3AF',
  }));

  const usersChartData = usersByRole
    .filter(d => d._id)
    .map(d => ({
      name:  d._id.charAt(0).toUpperCase() + d._id.slice(1),
      value: d.count,
      color: ROLE_COLORS[d._id] || '#9CA3AF',
    }));

  const cropsChartData = topCrops.map(d => ({
    crop:           d._id,
    'Quantity (kg)': d.totalQuantity,
    Orders:         d.totalOrders,
  }));

  // Moderation stats keyed by status
  const modStats = moderationActivity.reduce((acc, m) => {
    acc[m._id] = {
      count:    m.count,
      avgHours: m.avgTime != null
        ? (m.avgTime / (1000 * 60 * 60)).toFixed(1)
        : null,
    };
    return acc;
  }, {});

  const pendingCount = listingsByStatus.find(l => l._id === 'pending')?.count ?? 0;

  // Revenue values (fall back to 0 if no Stripe transactions yet)
  const rev = kpis.revenue;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics &amp; Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Platform-wide statistics — live from database</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Section 1: KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KPICard
          title="Total Revenue"
          value={`৳${(rev.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="green"
          sub={`${rev.count || 0} paid orders`}
        />
        <KPICard
          title="Platform Fees"
          value={`৳${(rev.platformFees || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          color="purple"
        />
        <KPICard
          title="Completion Rate"
          value={`${kpis.completionRate}%`}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Active Listings"
          value={kpis.activeListings.toLocaleString()}
          icon={Package}
          color="yellow"
        />
        <KPICard
          title="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          icon={Users}
          color="primary"
        />
      </div>

      {/* ── Section 2: Orders Over Time ──────────────────────────────────── */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary-600" />
            Orders Over Last 30 Days
          </h2>
          <p className="text-xs text-gray-400 mb-4">Daily order count across the platform</p>
          {ordersChartData.length === 0
            ? <EmptyChart message="No orders placed in the last 30 days" />
            : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ordersChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Orders"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </Card>

      {/* ── Section 3: Listings by Status + Users by Role ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Listings by Status</h2>
            <p className="text-xs text-gray-400 mb-4">All-time product listing distribution</p>
            {listingsChartData.length === 0
              ? <EmptyChart />
              : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={listingsChartData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {listingsChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
                    {listingsChartData.map((item, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        {item.name}: <strong>{item.value}</strong>
                      </span>
                    ))}
                  </div>
                </>
              )
            }
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Users by Role</h2>
            <p className="text-xs text-gray-400 mb-4">Registered user distribution</p>
            {usersChartData.length === 0
              ? <EmptyChart />
              : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={usersChartData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {usersChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
                    {usersChartData.map((item, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        {item.name}: <strong>{item.value}</strong>
                      </span>
                    ))}
                  </div>
                </>
              )
            }
          </div>
        </Card>
      </div>

      {/* ── Section 4: Top Crops by Volume ───────────────────────────────── */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Top 10 Crops by Quantity Traded</h2>
          <p className="text-xs text-gray-400 mb-4">Based on confirmed and completed orders</p>
          {cropsChartData.length === 0
            ? <EmptyChart message="No confirmed orders yet — crop data will appear once orders are confirmed" />
            : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cropsChartData} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="crop"
                    tick={{ fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="Quantity (kg)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </Card>

      {/* ── Section 5 + 6: District Activity + Moderation Activity ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* District Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Top Districts by Listings</h2>
            <p className="text-xs text-gray-400 mb-4">Most active farming regions on the platform</p>
            {districtActivity.length === 0
              ? <EmptyChart message="No listing data available" />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b pb-2">
                        <th className="pb-2 pr-4">#</th>
                        <th className="pb-2 pr-4">District</th>
                        <th className="pb-2 text-right pr-4">Listings</th>
                        <th className="pb-2 text-right">Unique Farmers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {districtActivity.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 pr-4 text-gray-400 text-xs">{i + 1}</td>
                          <td className="py-2 pr-4 font-medium text-gray-800">{d.district || 'Unknown'}</td>
                          <td className="py-2 pr-4 text-right text-gray-600">{d.listings}</td>
                          <td className="py-2 text-right text-gray-600">{d.farmerCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </Card>

        {/* Moderation Activity */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Moderation Activity (Last 30 Days)
            </h2>
            <p className="text-xs text-gray-400 mb-4">Response speed and volume of listing reviews</p>

            <div className="space-y-3">
              {/* Approved */}
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-green-700">✅ Approved</span>
                  <span className="text-xl font-bold text-green-700">{modStats.approved?.count ?? 0}</span>
                </div>
                {modStats.approved?.avgHours != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Avg response time: <span className="font-medium text-green-700">{modStats.approved.avgHours} hrs</span>
                  </p>
                )}
              </div>

              {/* Rejected */}
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-red-700">❌ Rejected</span>
                  <span className="text-xl font-bold text-red-700">{modStats.rejected?.count ?? 0}</span>
                </div>
                {modStats.rejected?.avgHours != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Avg response time: <span className="font-medium text-red-700">{modStats.rejected.avgHours} hrs</span>
                  </p>
                )}
              </div>

              {/* Awaiting */}
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-yellow-700">⏳ Awaiting Review</span>
                  <span className="text-xl font-bold text-yellow-700">{pendingCount}</span>
                </div>
                {pendingCount > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Needs attention — these listings are visible to farmers but not to buyers yet.
                  </p>
                )}
              </div>
            </div>

            {moderationActivity.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-3">
                No moderation actions in the last 30 days
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* ── Section 7: Order Status Breakdown ───────────────────────────── */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Order Status Breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">All-time orders by current status</p>
          {ordersByStatus.length === 0
            ? <EmptyChart message="No orders yet" />
            : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ordersByStatus.map((o, i) => {
                  const colorMap = {
                    pending:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
                    confirmed: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
                    completed: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200'  },
                    cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
                  };
                  const c = colorMap[o._id] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                  return (
                    <div key={i} className={`p-4 rounded-lg border ${c.bg} ${c.border} text-center`}>
                      <p className={`text-2xl font-bold ${c.text}`}>{o.count}</p>
                      <p className={`text-sm font-medium capitalize mt-1 ${c.text}`}>{o._id}</p>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </Card>
    </div>
  );
}
