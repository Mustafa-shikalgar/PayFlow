import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Logo } from '../../components/ui/Logo';
import { Spinner } from '../../components/ui/Spinner';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }
      try {
        const { data } = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="glass-card p-8 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Email verified!</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Verification failed</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};