import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import { Spinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const plans = [
  { id: 'starter', name: 'Starter', price: 49900, description: 'For individuals', features: ['1 project', 'Basic analytics', 'Email support'] },
  { id: 'pro', name: 'Pro', price: 99900, description: 'For growing teams', features: ['5 projects', 'Advanced analytics', 'Priority support'] },
  { id: 'business', name: 'Business', price: 199900, description: 'For organizations', features: ['Unlimited projects', 'Custom reports', '24/7 support'] },
  { id: 'enterprise', name: 'Enterprise', price: 499900, description: 'For large enterprises', features: ['Dedicated manager', 'SLA', 'Custom integrations'] },
];

export const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [processing, setProcessing] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { amountType: 'plan', customAmount: '' },
  });

  const customAmount = watch('customAmount');
  const amountType = watch('amountType');

  const { initiatePayment } = useRazorpay({
    onSuccess: (data) => {
      setProcessing(false);
      navigate('/payment-success', { state: { payment: data.payment, invoice: data.invoice } });
    },
    onError: () => {
      setProcessing(false);
    },
  });

  const selectedPlanData = plans.find((p) => p.id === selectedPlan) ?? null;

  const onSubmit = async (data) => {
    setProcessing(true);

    try {
      const isCustomAmount = data.amountType === 'custom';
      const amount = isCustomAmount
        ? Math.round(Number.parseFloat(data.customAmount) * 100)
        : selectedPlanData?.price;

      if (!isCustomAmount && !selectedPlanData) {
        toast.error('Please select a plan');
        setProcessing(false);
        return;
      }

      if (!Number.isFinite(amount) || amount < 100) {
        toast.error('Amount must be at least ₹1');
        setProcessing(false);
        return;
      }

      await initiatePayment({
        amount,
        currency: 'INR',
        description: data.description || (isCustomAmount ? 'Custom Payment' : `${selectedPlanData.name} Plan`),
      });
    } catch (err) {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Make a Payment</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a plan or enter a custom amount. Payments are processed securely via Razorpay.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Plan selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select a plan
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <button
                type="button"
                key={plan.id}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setValue('amountType', 'plan');
                  setValue('customAmount', '');
                }}
                className={`rounded-2xl border-2 p-5 text-left transition-all ${
                  selectedPlan === plan.id && !customAmount
                    ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10 dark:bg-primary-500/10'
                    : 'border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  {selectedPlan === plan.id && !customAmount && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{(plan.price / 100).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <span className="text-emerald-500">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Or enter a custom amount
          </label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="amountType-plan"
              value="plan"
              className="h-4 w-4 text-primary-600"
              {...register('amountType')}
              defaultChecked
            />
            <label htmlFor="amountType-plan" className="text-sm text-gray-600 dark:text-gray-300">
              Use selected plan
            </label>
            <input
              type="radio"
              id="amountType-custom"
              value="custom"
              className="ml-4 h-4 w-4 text-primary-600"
              {...register('amountType')}
            />
            <label htmlFor="amountType-custom" className="text-sm text-gray-600 dark:text-gray-300">
              Custom amount
            </label>
          </div>
          <div className="relative mt-3 max-w-xs">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
            <input
              type="number"
              step="0.01"
              min="1"
              className="input-field !pl-8"
              placeholder="Enter amount"
              {...register('customAmount')}
              onChange={(e) => {
                setValue('customAmount', e.target.value);
                if (e.target.value) {
                  setSelectedPlan('');
                  setValue('amountType', 'custom');
                }
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (optional)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="What is this payment for?"
            {...register('description', { maxLength: { value: 200, message: 'Description too long' } })}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Summary */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Payment Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Paying as</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Amount</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ₹{customAmount ? parseFloat(customAmount).toFixed(2) : (selectedPlanData?.price / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={processing} className="btn-primary w-full !py-4 text-base">
          {processing ? (
            <>
              <Spinner size="sm" /> Processing...
            </>
          ) : (
            'Proceed to Pay'
          )}
        </button>
      </form>
    </div>
  );
};