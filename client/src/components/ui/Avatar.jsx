import { getInitials } from '../../utils/format';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };

  if (user?.avatar) {
    return (
      <img
        src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`}
        alt={user?.name || 'User'}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} gradient-bg flex items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {getInitials(user?.name)}
    </div>
  );
};