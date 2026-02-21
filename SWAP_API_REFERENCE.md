# Currency Swap API Reference

## 📡 User Endpoints

### Get Exchange Rates
Get current exchange rates, fees, and minimum amounts.

**Endpoint:** `GET /api/wallets/exchange-rates`  
**Auth:** Required  
**Response:**
```json
{
  "rates": [
    {
      "fromCurrency": "USDC",
      "toCurrency": "JAMZ",
      "rate": 100,
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "swapFeePercentage": 0.5,
  "minimumSwapAmounts": {
    "USDC": 1,
    "JAMZ": 10,
    "AED": 5,
    "NGN": 100,
    "INR": 100
  }
}
```

---

### Execute Swap
Swap one currency for another.

**Endpoint:** `POST /api/wallets/swap`  
**Auth:** Required  
**Body:**
```json
{
  "fromCurrency": "USDC",
  "toCurrency": "JAMZ",
  "fromAmount": 10
}
```

**Response:**
```json
{
  "message": "Swap completed successfully",
  "swap": {
    "fromCurrency": "USDC",
    "toCurrency": "JAMZ",
    "fromAmount": 10,
    "toAmount": 995,
    "exchangeRate": 100,
    "feeAmount": 5,
    "feePercentage": 0.5
  },
  "wallet": {
    "usdcBalance": 90,
    "jamzBalance": 1095,
    "ngnBalance": 0,
    "aedBalance": 0,
    "inrBalance": 0
  },
  "transaction": {
    "type": "swap",
    "token": "JAMZ",
    "amount": 995,
    "status": "completed",
    "method": "swap",
    "swapDetails": {
      "fromCurrency": "USDC",
      "toCurrency": "JAMZ",
      "fromAmount": 10,
      "toAmount": 995,
      "exchangeRate": 100,
      "feeAmount": 5,
      "feePercentage": 0.5
    }
  }
}
```

**Validation:**
- `fromCurrency` and `toCurrency` must be different
- `fromAmount` must be > 0
- `fromAmount` must be >= minimum for that currency
- User must have sufficient balance
- Supported currencies: USDC, JAMZ, AED, NGN, INR

**Errors:**
- `400` - Missing required fields
- `400` - Cannot swap same currency
- `400` - Amount must be greater than zero
- `400` - Below minimum swap amount
- `400` - Insufficient balance
- `500` - Server error

---

## 🔐 Admin Endpoints

### Get All Exchange Rates (Admin)
Get complete exchange rate configuration including history.

**Endpoint:** `GET /api/admin/settings/exchange-rates`  
**Auth:** Required (Admin only)  
**Response:**
```json
{
  "_id": "exchange_rates",
  "rates": [...],
  "swapFeePercentage": 0.5,
  "minimumSwapAmounts": {...},
  "rateHistory": [
    {
      "fromCurrency": "USDC",
      "toCurrency": "JAMZ",
      "oldRate": 100,
      "newRate": 105,
      "changedAt": "2024-01-01T00:00:00.000Z",
      "changedBy": "admin_user_id"
    }
  ]
}
```

---

### Update Exchange Rate
Update a specific currency pair rate.

**Endpoint:** `PUT /api/admin/settings/exchange-rates/:fromCurrency/:toCurrency`  
**Auth:** Required (Admin only)  
**Params:**
- `fromCurrency` - Source currency (USDC, JAMZ, AED, NGN, INR)
- `toCurrency` - Target currency (USDC, JAMZ, AED, NGN, INR)

**Body:**
```json
{
  "rate": 105.5
}
```

**Response:** Updated exchange rates object

**Validation:**
- Rate must be > 0
- Currencies must be valid

---

### Update Swap Fee
Update the global swap fee percentage.

**Endpoint:** `PUT /api/admin/settings/exchange-rates/fee`  
**Auth:** Required (Admin only)  
**Body:**
```json
{
  "swapFeePercentage": 1.0
}
```

**Response:** Updated exchange rates object

**Validation:**
- Fee must be between 0 and 100

---

### Update Minimum Swap Amounts
Update minimum swap amounts for currencies.

**Endpoint:** `PUT /api/admin/settings/exchange-rates/minimums`  
**Auth:** Required (Admin only)  
**Body:**
```json
{
  "minimumSwapAmounts": {
    "USDC": 5,
    "JAMZ": 50,
    "AED": 10,
    "NGN": 500,
    "INR": 200
  }
}
```

**Response:** Updated exchange rates object

**Note:** You can update one or all currencies at once.

---

### Get Exchange Rate History
Get history of all rate changes.

**Endpoint:** `GET /api/admin/settings/exchange-rates/history`  
**Auth:** Required (Admin only)  
**Response:**
```json
[
  {
    "fromCurrency": "USDC",
    "toCurrency": "JAMZ",
    "oldRate": 100,
    "newRate": 105,
    "changedAt": "2024-01-01T00:00:00.000Z",
    "changedBy": "admin_user_id"
  }
]
```

**Note:** Returns last 100 changes, sorted by most recent first.

---

## 💡 Usage Examples

### Example 1: Simple Swap
```javascript
// User swaps 10 USDC for JAMZ
const response = await fetch('/api/wallets/swap', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromCurrency: 'USDC',
    toCurrency: 'JAMZ',
    fromAmount: 10
  })
});

const result = await response.json();
console.log(`Received ${result.swap.toAmount} JAMZ`);
```

### Example 2: Update Rate (Admin)
```javascript
// Admin updates USDC to JAMZ rate
const response = await fetch('/api/admin/settings/exchange-rates/USDC/JAMZ', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    rate: 105
  })
});
```

---

## 🧮 Swap Calculation Formula

```
grossAmount = fromAmount × exchangeRate
feeAmount = grossAmount × (feePercentage / 100)
netAmount = grossAmount - feeAmount
```

**Example:**
- Swap: 10 USDC → JAMZ
- Rate: 100 JAMZ per USDC
- Fee: 0.5%

```
grossAmount = 10 × 100 = 1000 JAMZ
feeAmount = 1000 × 0.005 = 5 JAMZ
netAmount = 1000 - 5 = 995 JAMZ
```

User receives **995 JAMZ** for 10 USDC.

