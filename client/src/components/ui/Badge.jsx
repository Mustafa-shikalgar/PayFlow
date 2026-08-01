import { getStatusColor } from '../../utils/format';

export const Badge = ({ status, children }) => (
  <span className={`badge ${getStatusColor(status)}`}>
    {children || status}
  </span>
);