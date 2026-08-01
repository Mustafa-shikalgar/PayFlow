/**
 * Format a number as currency.
 * Amounts are stored in paise (smallest unit) by Razorpay.
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const value = amount / 100;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

/**
 * Format a date string.
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format a datetime string.
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get initials from a name.
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Get status badge color class.
 */
export const getStatusColor = (status) => {
  const map = {
    captured: 'badge-success',
    paid: 'badge-success',
    success: 'badge-success',
    active: 'badge-success',
    approved: 'badge-success',
    processed: 'badge-success',
    created: 'badge-info',
    pending: 'badge-warning',
    failed: 'badge-danger',
    rejected: 'badge-danger',
    refunded: 'badge-neutral',
    partially_refunded: 'badge-warning',
    error: 'badge-danger',
    info: 'badge-info',
  };
  return map[status] || 'badge-neutral';
};

/**
 * Truncate a string.
 */
export const truncate = (str, length = 30) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};