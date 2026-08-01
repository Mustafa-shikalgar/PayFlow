import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';

export const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-4">
    <Logo size="lg" />
    <h1 className="mt-12 text-6xl font-extrabold gradient-text">404</h1>
    <p className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Page not found</p>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/" className="btn-primary mt-8">
      Back to Home
    </Link>
  </div>
);