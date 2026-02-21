import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, DollarSign, Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51SGKGaPbY0SWUViVKTHudcwMtapta4FPrs86bossmC11HvxHJuIixpOGPhDbme5o5HtMdztd0TEeijoVRRHgMBbL00VwpmaT5L'
);

// Helper function to get artist auth token from localStorage
const getArtistToken = (): string | null => {
  try {
    const artistAuthStorage = localStorage.getItem('artist-auth-storage');
    if (artistAuthStorage) {
      const parsed = JSON.parse(artistAuthStorage);
      if (parsed?.state?.token) {
        return parsed.state.token;
      }
    }
    // Fallback to auth_token for backwards compatibility
    return localStorage.getItem('auth_token');
  } catch (e) {
    console.error('Error getting artist token:', e);
    return null;
  }
};

interface StripePaymentFormProps {
  amount: number;
  currency: 'USD' | 'NGN' | 'AED';
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [amount, currency]);

  const createPaymentIntent = async () => {
    try {
      // Get artist auth token
      const token = getArtistToken();

      console.log('Creating payment intent with token:', token ? 'Token present' : 'No token');

      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Use authenticated endpoint for real payments
      const response = await fetch('/api/artist/wallet/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase()
        })
      });

      console.log('Create payment intent response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment intent error response:', errorData);
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      console.log('Payment intent created successfully:', data.paymentIntentId);
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      onError(error.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.log('handleSubmit: Missing requirements', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.log('handleSubmit: CardElement not found');
      setLoading(false);
      return;
    }

    try {
      console.log('Confirming card payment...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Stripe confirmCardPayment error:', error);
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Stripe payment succeeded, confirming with backend...');
        // Confirm payment and credit wallet
        const token = getArtistToken();

        if (!token) {
          console.error('No auth token for confirm-payment');
          onError('Authentication required to credit wallet');
          return;
        }

        const confirmResponse = await fetch('/api/artist/wallet/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id
          })
        });

        console.log('Confirm payment response status:', confirmResponse.status);

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          console.error('Failed to confirm payment:', errorData);
          // Payment succeeded but wallet credit failed - still show success but log error
          onSuccess({ ...paymentIntent, walletCreditError: errorData.message });
        } else {
          const confirmData = await confirmResponse.json();
          console.log('Wallet credited successfully:', confirmData);
          onSuccess({ ...paymentIntent, ...confirmData });
        }
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      onError(error.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass-card p-4">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-white/20 rounded-lg bg-white/5">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <span className="text-white/80">Amount to pay:</span>
        <span className="text-xl font-bold text-white">
          {currency === 'USD' && '$'}
          {currency === 'NGN' && '₦'}
          {currency === 'AED' && 'د.إ'}
          {amount.toLocaleString()}
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay {currency === 'USD' && '$'}
            {currency === 'NGN' && '₦'}
            {currency === 'AED' && 'د.إ'}
            {amount.toLocaleString()}
          </>
        )}
      </button>
    </form>
  );
};

interface StripePaymentProps {
  amount: number;
  currency: 'USD' | 'NGN' | 'AED';
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
};

export default StripePayment;
