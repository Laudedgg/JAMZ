/**
 * Currency utility functions for formatting and handling different currencies
 */

export type SupportedCurrency = 'USD' | 'USDT' | 'JAMZ' | 'NGN' | 'AED' | 'INR';

export interface CurrencyInfo {
  symbol: string;
  name: string;
  code: string;
  decimals: number;
  prefix?: boolean; // Whether symbol goes before the amount
}

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    symbol: '$',
    name: 'US Dollar',
    code: 'USD',
    decimals: 2,
    prefix: true
  },
  USDT: {
    symbol: '$',
    name: 'Tether USD',
    code: 'USDT',
    decimals: 2,
    prefix: true
  },
  JAMZ: {
    symbol: 'JAMZ',
    name: 'JAMZ Token',
    code: 'JAMZ',
    decimals: 2,
    prefix: false
  },
  NGN: {
    symbol: '₦',
    name: 'Nigerian Naira',
    code: 'NGN',
    decimals: 2,
    prefix: true
  },
  AED: {
    symbol: 'د.إ',
    name: 'UAE Dirham',
    code: 'AED',
    decimals: 2,
    prefix: false
  },
  INR: {
    symbol: '₹',
    name: 'Indian Rupee',
    code: 'INR',
    decimals: 2,
    prefix: true
  }
};

/**
 * Format currency value with appropriate symbol and formatting
 */
export const formatCurrency = (value: number, currency: SupportedCurrency): string => {
  const config = CURRENCY_CONFIG[currency];
  if (!config) {
    return `${value.toFixed(2)} ${currency}`;
  }

  const formattedValue = value.toFixed(config.decimals);
  
  if (config.prefix) {
    return `${config.symbol}${formattedValue}`;
  } else {
    return `${formattedValue} ${config.symbol}`;
  }
};

/**
 * Get currency symbol for a given currency
 */
export const getCurrencySymbol = (currency: SupportedCurrency): string => {
  return CURRENCY_CONFIG[currency]?.symbol || currency;
};

/**
 * Get currency name for a given currency
 */
export const getCurrencyName = (currency: SupportedCurrency): string => {
  return CURRENCY_CONFIG[currency]?.name || currency;
};

/**
 * Format multiple currencies into a combined string
 */
export const formatMultipleCurrencies = (amounts: Partial<Record<SupportedCurrency, number>>): string => {
  const parts: string[] = [];
  
  Object.entries(amounts).forEach(([currency, amount]) => {
    if (amount && amount > 0) {
      parts.push(formatCurrency(amount, currency as SupportedCurrency));
    }
  });
  
  return parts.length > 0 ? parts.join(' + ') : 'TBA';
};

/**
 * Get all supported currencies
 */
export const getSupportedCurrencies = (): SupportedCurrency[] => {
  return Object.keys(CURRENCY_CONFIG) as SupportedCurrency[];
};

/**
 * Check if a currency is supported
 */
export const isSupportedCurrency = (currency: string): currency is SupportedCurrency => {
  return currency in CURRENCY_CONFIG;
};

/**
 * Format currency for display in forms (without symbol)
 */
export const formatCurrencyInput = (value: number, currency: SupportedCurrency): string => {
  const config = CURRENCY_CONFIG[currency];
  return value.toFixed(config?.decimals || 2);
};

/**
 * Parse currency input string to number
 */
export const parseCurrencyInput = (input: string): number => {
  const cleaned = input.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
