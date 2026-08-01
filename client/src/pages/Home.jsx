import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Logo } from '../components/ui/Logo';

const features = [
  {
    icon: '⚡',
    title: 'Instant Payments',
    description: 'Accept payments in seconds with Razorpay\'s lightning-fast checkout.',
  },
  {
    icon: '🔒',
    title: 'Bank-Grade Security',
    description: 'JWT auth, signature verification, and encrypted transactions keep you safe.',
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    description: 'Track revenue, payments, and refunds with beautiful dashboards.',
  },
  {
    icon: '🧾',
    title: 'Auto Invoices',
    description: 'Generate professional PDF invoices and email receipts automatically.',
  },
];

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="badge badge-info mb-6">🚀 Production-Ready Payment Gateway</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              Payments made{' '}
              <span className="gradient-text">simple</span> &{' '}
              <span className="gradient-text">secure</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
              PayFlow is a modern payment gateway built with React, Node.js, and Razorpay.
              Accept payments, generate invoices, and manage refunds — all in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl dark:bg-primary-500/10">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="gradient-bg rounded-3xl p-10 text-center sm:p-16">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Join PayFlow today and start accepting payments with a production-ready infrastructure.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Link to="/pay" className="rounded-xl bg-white px-8 py-3 font-semibold text-primary-600 shadow-lg transition-transform hover:scale-105">
                Make a Payment
              </Link>
            ) : (
              <Link to="/register" className="rounded-xl bg-white px-8 py-3 font-semibold text-primary-600 shadow-lg transition-transform hover:scale-105">
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Logo size="sm" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} PayFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};