import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const StripeWrapper = ({ children, options = {} }) => {
  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#10b981', // green-500
            colorBackground: '#ffffff',
            colorText: '#1f2937', // gray-800
            colorDanger: '#ef4444', // red-500
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
        ...options,
      }}
    >
      {children}
    </Elements>
  );
};

export default StripeWrapper;
