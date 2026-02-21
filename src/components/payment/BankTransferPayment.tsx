import React, { useState, useEffect } from 'react';
import { Building2, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BankAccount {
  id: string;
  name: string;
  currency: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  additionalInfo?: string;
  minimumAmount: number;
}

interface BankTransferPaymentProps {
  amount: number;
  currency: 'USD' | 'NGN' | 'AED';
  onSuccess: (transferDetails: any) => void;
  onError: (error: string) => void;
}

const BankTransferPayment: React.FC<BankTransferPaymentProps> = ({
  amount,
  currency,
  onSuccess,
  onError
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transferReference, setTransferReference] = useState<string>('');
  const [confirmationStep, setConfirmationStep] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
    generateTransferReference();
  }, [currency]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/artist/wallet/bank-accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bank accounts');
      }

      const data = await response.json();
      const filteredAccounts = data.bankAccounts.filter(
        (account: BankAccount) => account.currency === currency
      );
      
      setBankAccounts(filteredAccounts);
      if (filteredAccounts.length > 0) {
        setSelectedAccount(filteredAccounts[0]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      onError('Failed to load bank account details');
    } finally {
      setLoading(false);
    }
  };

  const generateTransferReference = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTransferReference(`JAMZ-${timestamp}-${randomSuffix}`);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleConfirmTransfer = () => {
    if (!selectedAccount) return;

    const transferDetails = {
      bankAccount: selectedAccount,
      amount,
      currency,
      reference: transferReference,
      timestamp: new Date().toISOString()
    };

    onSuccess(transferDetails);
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'NGN': return '₦';
      case 'AED': return 'د.إ';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-2 text-white/80">Loading bank accounts...</span>
      </div>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Bank Accounts Available</h3>
        <p className="text-white/60">
          No {currency} bank accounts are currently available for deposits. 
          Please try a different payment method or contact support.
        </p>
      </div>
    );
  }

  if (confirmationStep) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Transfer Instructions Sent</h3>
          <p className="text-white/60">
            Please complete the bank transfer using the details provided. 
            Your account will be credited once the transfer is confirmed.
          </p>
        </div>

        <div className="glass-card p-4">
          <h4 className="font-semibold text-white mb-2">Transfer Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Amount:</span>
              <span className="text-white font-medium">
                {getCurrencySymbol(currency)}{amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Reference:</span>
              <span className="text-white font-medium">{transferReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Bank:</span>
              <span className="text-white font-medium">{selectedAccount?.bankName}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">Important Notes:</p>
              <ul className="text-blue-200/80 space-y-1">
                <li>• Include the reference number in your transfer description</li>
                <li>• Transfers typically take 1-3 business days to process</li>
                <li>• You'll receive an email confirmation once credited</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Account Selection */}
      {bankAccounts.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Select Bank Account
          </label>
          <select
            value={selectedAccount?.id || ''}
            onChange={(e) => {
              const account = bankAccounts.find(acc => acc.id === e.target.value);
              setSelectedAccount(account || null);
            }}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white"
          >
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id} className="bg-gray-800">
                {account.name} - {account.bankName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bank Account Details */}
      {selectedAccount && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">{selectedAccount.name}</h3>
          </div>

          <div className="space-y-4">
            {/* Bank Name */}
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-white/60">Bank Name</p>
                <p className="text-white font-medium">{selectedAccount.bankName}</p>
              </div>
              <button
                onClick={() => copyToClipboard(selectedAccount.bankName, 'bankName')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copiedField === 'bankName' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>

            {/* Account Holder Name */}
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-white/60">Account Holder</p>
                <p className="text-white font-medium">{selectedAccount.accountHolderName}</p>
              </div>
              <button
                onClick={() => copyToClipboard(selectedAccount.accountHolderName, 'accountHolder')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copiedField === 'accountHolder' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>

            {/* Account Number */}
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-white/60">Account Number</p>
                <p className="text-white font-medium font-mono">{selectedAccount.accountNumber}</p>
              </div>
              <button
                onClick={() => copyToClipboard(selectedAccount.accountNumber, 'accountNumber')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copiedField === 'accountNumber' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>

            {/* Additional fields based on currency */}
            {selectedAccount.routingNumber && (
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm text-white/60">Routing Number</p>
                  <p className="text-white font-medium font-mono">{selectedAccount.routingNumber}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedAccount.routingNumber!, 'routingNumber')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copiedField === 'routingNumber' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            )}

            {selectedAccount.swiftCode && (
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm text-white/60">SWIFT Code</p>
                  <p className="text-white font-medium font-mono">{selectedAccount.swiftCode}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedAccount.swiftCode!, 'swiftCode')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copiedField === 'swiftCode' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            )}

            {selectedAccount.iban && (
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm text-white/60">IBAN</p>
                  <p className="text-white font-medium font-mono">{selectedAccount.iban}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedAccount.iban!, 'iban')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copiedField === 'iban' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            )}

            {/* Transfer Reference */}
            <div className="flex justify-between items-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div>
                <p className="text-sm text-purple-300">Transfer Reference (Required)</p>
                <p className="text-white font-medium font-mono">{transferReference}</p>
              </div>
              <button
                onClick={() => copyToClipboard(transferReference, 'reference')}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
              >
                {copiedField === 'reference' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-purple-400" />
                )}
              </button>
            </div>
          </div>

          {/* Additional Information */}
          {selectedAccount.additionalInfo && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300 font-medium mb-1">Additional Information:</p>
              <p className="text-sm text-blue-200/80">{selectedAccount.additionalInfo}</p>
            </div>
          )}
        </div>
      )}

      {/* Amount Summary */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <span className="text-white/80">Amount to transfer:</span>
        <span className="text-xl font-bold text-white">
          {getCurrencySymbol(currency)}{amount.toLocaleString()}
        </span>
      </div>



      {/* Confirm Button */}
      <button
        onClick={handleConfirmTransfer}
        disabled={!selectedAccount || amount <= 0}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Building2 className="w-4 h-4" />
        I'll Transfer {getCurrencySymbol(currency)}{amount.toLocaleString()}
      </button>

      {/* Instructions */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2">Transfer Instructions:</h4>
        <ol className="text-sm text-white/70 space-y-1">
          <li>1. Use the bank details above to make your transfer</li>
          <li>2. Include the transfer reference in the description/memo field</li>
          <li>3. Click "I'll Transfer" to confirm you're making the payment</li>
          <li>4. Your account will be credited once we receive the transfer</li>
        </ol>
      </div>
    </div>
  );
};

export default BankTransferPayment;
