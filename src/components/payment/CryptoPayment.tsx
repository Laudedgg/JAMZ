import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

interface CryptoPaymentProps {
  amount: number;
  currency: 'usdcbase' | 'usdcerc20' | 'usdcbsc' | 'btc' | 'eth' | 'ltc';
  onSuccess: (payment: any) => void;
  onError: (error: string) => void;
}

interface PaymentData {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

const CryptoPayment: React.FC<CryptoPaymentProps> = ({
  amount,
  currency,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Get estimate when amount or currency changes
  useEffect(() => {
    if (amount && currency) {
      getEstimate();
    }
  }, [amount, currency]);

  useEffect(() => {
    if (paymentData && paymentStatus !== 'finished') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [paymentData, paymentStatus]);

  useEffect(() => {
    if (paymentData && timeLeft > 0 && paymentStatus !== 'finished') {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, paymentData, paymentStatus]);

  const getEstimate = async () => {
    setEstimateLoading(true);
    try {
      const response = await fetch(`/api/artist/wallet/crypto-estimate?amount=${amount}&currency_from=usd&currency_to=${currency}`);

      if (!response.ok) {
        throw new Error('Failed to get estimate');
      }

      const data = await response.json();
      setEstimate(data);
    } catch (error) {
      console.error('Estimate error:', error);
      setEstimate(null);
    } finally {
      setEstimateLoading(false);
    }
  };

  const createPayment = async () => {
    setLoading(true);
    try {
      // Use test endpoint for demo purposes
      const response = await fetch('/api/artist/wallet/test-create-crypto-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: 'usd', // NowPayments uses lowercase
          pay_currency: currency, // Already in correct format (e.g., 'usdttrc20')
          order_id: `wallet-funding-${Date.now()}`,
          order_description: `Wallet funding - ${amount} USD`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait ${errorData.retryAfter || 30} seconds and try again.`);
        }

        throw new Error(errorData.message || 'Failed to create crypto payment');
      }

      const data = await response.json();
      setPaymentData(data);
      setPaymentStatus(data.payment_status);
      setPaymentCreated(true);

      // Generate QR code for the payment
      if (data.pay_address && data.pay_amount) {
        generateQRCode(data.pay_address, data.pay_amount, data.pay_currency);
      }
    } catch (error) {
      console.error('Crypto payment creation error:', error);
      onError(error.message || 'Failed to create crypto payment');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (address: string, amount: number, currency: string) => {
    try {
      // Create payment URI for better wallet compatibility
      let qrData = address;
      const currencyLower = currency.toLowerCase();

      // For Bitcoin, use BIP21 format
      if (currencyLower === 'btc') {
        qrData = `bitcoin:${address}?amount=${amount}`;
      }
      // For Ethereum, use EIP681 format
      else if (currencyLower === 'eth') {
        qrData = `ethereum:${address}?value=${amount * 1e18}`; // Convert to wei
      }
      // For Litecoin, use similar format to Bitcoin
      else if (currencyLower === 'ltc') {
        qrData = `litecoin:${address}?amount=${amount}`;
      }
      // For USDC variants, use the address with amount info
      // Most wallets will recognize the address and user can enter amount manually
      else if (currencyLower.includes('usdc')) {
        // For Base USDC
        if (currencyLower.includes('base')) {
          qrData = `ethereum:${address}?value=${amount}&token=USDC`;
        }
        // For BSC USDC (BEP-20)
        else if (currencyLower.includes('bsc')) {
          qrData = `ethereum:${address}?value=${amount}&token=USDC`;
        }
        // For other USDC variants, just use the address
        else {
          qrData = address;
        }
      }
      // For other currencies, just use the address
      else {
        qrData = address;
      }

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData) return;

    try {
      // Use test endpoint for demo purposes
      const response = await fetch(`/api/artist/wallet/test-crypto-payment-status/${paymentData.payment_id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data.payment_status);

        if (data.payment_status === 'finished') {
          onSuccess(data);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'waiting':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'confirming':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'confirmed':
      case 'sending':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'finished':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
      case 'refunded':
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'waiting':
        return 'Waiting for payment';
      case 'confirming':
        return 'Confirming transaction';
      case 'confirmed':
        return 'Payment confirmed';
      case 'sending':
        return 'Processing payment';
      case 'finished':
        return 'Payment completed';
      case 'failed':
        return 'Payment failed';
      case 'refunded':
        return 'Payment refunded';
      case 'expired':
        return 'Payment expired';
      default:
        return 'Initializing...';
    }
  };

  // Show estimate and confirmation before creating payment
  if (!paymentCreated) {
    return (
      <div className="space-y-6">
        {/* Payment Summary */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60">Amount (USD):</span>
              <span className="text-white font-medium">${amount}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">Cryptocurrency:</span>
              <span className="text-white font-medium">{currency.toUpperCase()}</span>
            </div>

            {estimateLoading ? (
              <div className="flex justify-between">
                <span className="text-white/60">You will receive:</span>
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400 mr-2" />
                  <span className="text-white/60">Calculating...</span>
                </div>
              </div>
            ) : estimate ? (
              <div className="flex justify-between">
                <span className="text-white/60">You will receive:</span>
                <span className="text-white font-medium">
                  {estimate.estimated_amount} {currency.toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-white/60">You will receive:</span>
                <span className="text-red-400">Unable to get estimate</span>
              </div>
            )}
          </div>
        </div>

        {/* Generate Payment Button */}
        <button
          onClick={createPayment}
          disabled={loading || !estimate}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating Payment Address...
            </div>
          ) : (
            'Generate Payment Address'
          )}
        </button>

        {!estimate && !estimateLoading && (
          <p className="text-center text-red-400 text-sm">
            Unable to get exchange rate. Please try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Status */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-4">
          {getStatusIcon()}
          <span className="text-lg font-medium text-white">{getStatusText()}</span>
        </div>
        
        {paymentStatus === 'waiting' && (
          <div className="text-sm text-white/60">
            Time remaining: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Amount:</span>
            <span className="text-white font-medium">
              {paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">USD Value:</span>
            <span className="text-white font-medium">
              ${paymentData.price_amount}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-white/60">Network:</span>
            <span className="text-white font-medium">
              {currency === 'USDT' ? 'TRC20' : currency}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code */}
      {qrCodeUrl && paymentStatus === 'waiting' && (
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
            <button
              onClick={() => copyToClipboard(paymentData.pay_address)}
              className="p-1 text-white/60 hover:text-white transition-colors"
              title="Copy payment address"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
          <div className="text-white/60 text-sm space-y-1">
            <p>📱 Scan with your crypto wallet to send payment</p>
            <p className="text-xs">
              {paymentData.pay_currency.includes('base') && '🔗 Base Network'}
              {paymentData.pay_currency.includes('trc20') && '🔗 Tron (TRC20) Network'}
              {paymentData.pay_currency.includes('erc20') && '🔗 Ethereum (ERC20) Network'}
              {paymentData.pay_currency.includes('bsc') && '🔗 BNB Chain (BEP20)'}
              {paymentData.pay_currency === 'btc' && '🔗 Bitcoin Network'}
              {paymentData.pay_currency === 'eth' && '🔗 Ethereum Network'}
              {paymentData.pay_currency === 'ltc' && '🔗 Litecoin Network'}
            </p>
          </div>
        </div>
      )}

      {/* Payment Address */}
      {paymentStatus === 'waiting' && (
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Send Payment To:</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Wallet Address:</span>
                <button
                  onClick={() => copyToClipboard(paymentData.pay_address)}
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="mt-2 font-mono text-sm text-white break-all">
                {paymentData.pay_address}
              </div>
              <p className="text-xs text-white/50 mt-1">
                💡 Tip: Use the QR code above for easier mobile wallet scanning
              </p>
            </div>
            
            <div className="text-sm text-white/60 space-y-1">
              <p>• Send exactly {paymentData.pay_amount} {paymentData.pay_currency.toUpperCase()}</p>
              <p>• Use {currency === 'USDT' ? 'TRC20' : currency} network only</p>
              <p>• Payment will be confirmed automatically</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {paymentStatus === 'finished' && (
        <div className="glass-card p-4 border border-green-400/20 bg-green-400/10">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Payment Successful!</h3>
              <p className="text-white/80">Your wallet has been funded successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error States */}
      {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
        <div className="glass-card p-4 border border-red-400/20 bg-red-400/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                {paymentStatus === 'expired' ? 'Payment Expired' : 'Payment Failed'}
              </h3>
              <p className="text-white/80">
                {paymentStatus === 'expired' 
                  ? 'The payment window has expired. Please create a new payment.'
                  : 'The payment could not be processed. Please try again.'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={createPayment}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create New Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default CryptoPayment;
