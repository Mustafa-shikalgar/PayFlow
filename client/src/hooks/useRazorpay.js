import { useCallback } from 'react';
import { paymentService } from '../services/paymentService';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle Razorpay checkout flow.
 * Creates an order on the backend, opens Razorpay checkout,
 * and verifies the payment signature on the backend.
 *
 * @param {Object} options
 * @param {Function} options.onSuccess - Called with verification result after successful payment
 * @param {Function} options.onError - Called on payment/verification error
 */
export const useRazorpay = ({ onSuccess, onError } = {}) => {
  const initiatePayment = useCallback(
    async ({ amount, currency = 'INR', description }) => {
      try {
        // 1. Create order on backend
        const { data } = await paymentService.createOrder({
          amount,
          currency,
          description,
        });

        const { razorpayOrder, keyId } = data.data;

        // 2. Open Razorpay checkout
        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'PayFlow',
          description: description || 'Payment',
          order_id: razorpayOrder.id,
          handler: async (response) => {
            // 3. Verify payment on backend
            try {
              const verifyRes = await paymentService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success('Payment successful!');
              if (onSuccess) onSuccess(verifyRes.data);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
              if (onError) onError(err);
            }
          },
          prefill: {
            name: '',
            email: '',
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            ondismiss: () => {
              // User closed the modal
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          toast.error(response.error?.description || 'Payment failed. Please try again.');
          if (onError) onError(response.error);
        });
        rzp.open();

        return { order: data.data.order, razorpayOrder };
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initiate payment');
        if (onError) onError(err);
        throw err;
      }
    },
    [onSuccess, onError]
  );

  return { initiatePayment };
};