const Razorpay = require('razorpay');

let instance = null;

/**
 * Get Razorpay client instance (lazy initialization).
 * This allows the server to start even without valid Razorpay keys,
 * which is useful during development for testing non-payment features.
 */
const getRazorpay = () => {
  if (instance) return instance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || keyId.includes('xxxx')) {
    throw new Error(
      'Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.'
    );
  }

  instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return instance;
};

module.exports = getRazorpay;