export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-primary-500 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);