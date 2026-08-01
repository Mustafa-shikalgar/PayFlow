import { Link, useLocation } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '../../utils/format';

export const PaymentSuccess = () => {
  const location = useLocation();
  const { payment, invoice } = location.state || {};

  if (!payment) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No payment data</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          We couldn't find payment details. Please check your transactions.
        </p>
        <Link to="/transactions" className="btn-primary mt-6">
          View Transactions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="glass-card overflow-hidden">
        {/* Success header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Payment Successful!</h1>
          <p className="mt-1 text-sm text-white/80">Your payment has been processed securely.</p>
        </div>

        {/* Payment details */}
        <div className="p-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Payment ID</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{payment.paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Method</span>
              <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">{payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(payment.createdAt)}</span>
            </div>
            {invoice && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Invoice</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</span>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <Link to="/transactions" className="btn-primary w-full">
              View Transactions
            </Link>
            <Link to="/dashboard" className="btn-secondary w-full">
              Go to Dashboard
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            A receipt has been sent to your email. You can download the invoice from your transactions.
          </p>
        </div>
      </div>
    </div>
  );
};