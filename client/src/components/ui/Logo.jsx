import { Link } from 'react-router-dom';

export const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <Link to="/" className="flex items-center gap-2">
      <div
        className={`${sizes[size]} gradient-bg flex items-center justify-center rounded-xl shadow-lg shadow-primary-500/30`}
      >
        <svg
          className="h-1/2 w-1/2 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M4 12h16M12 4v16" />
        </svg>
      </div>
      <span
        className={`font-bold tracking-tight ${
          size === 'lg' ? 'text-3xl' : 'text-xl'
        }`}
      >
        Pay<span className="gradient-text">Flow</span>
      </span>
    </Link>
  );
};