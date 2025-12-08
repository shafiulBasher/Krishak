export default function UserBadge({ user }) {
  const roleColors = {
    farmer: 'bg-green-100 text-green-800',
    buyer: 'bg-blue-100 text-blue-800',
    transporter: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.isActive ? 'active' : 'inactive']}`}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
      {user.isVerified && (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Verified
        </span>
      )}
    </div>
  );
}
