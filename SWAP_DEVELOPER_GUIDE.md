# Swap Interface Developer Guide

## Quick Reference

### Component Location
```
src/components/SwapInterface.tsx
```

### Props Interface
```typescript
interface SwapInterfaceProps {
  wallet: {
    usdcBalance: number;
    jamzBalance: number;
    ngnBalance: number;
    aedBalance: number;
    inrBalance: number;
  };
  onSwapComplete: () => void;
}
```

---

## Currency Configuration

### Adding a New Currency

1. **Update CURRENCIES array**:
```typescript
{
  code: 'EUR',                              // Currency code
  name: 'Euro',                             // Full name
  symbol: '€',                              // Symbol
  icon: '🇪🇺',                              // Emoji icon
  chain: 'Fiat',                            // Chain type
  color: 'from-blue-500 to-indigo-600',     // Gradient
  bgColor: 'bg-blue-500/10',                // Background
  borderColor: 'border-blue-500/30',        // Border
  textColor: 'text-blue-400'                // Text color
}
```

2. **Update wallet balance type**:
```typescript
wallet: {
  // ... existing balances
  eurBalance: number;
}
```

3. **Update getBalance function**:
```typescript
const getBalance = (currency: string): number => {
  switch (currency) {
    // ... existing cases
    case 'EUR': return wallet.eurBalance;
    default: return 0;
  }
};
```

---

## Styling Guide

### Color System
```css
/* Primary Gradients */
from-purple-600 via-purple-500 to-blue-600  /* Main buttons */
from-green-500 to-emerald-600               /* USDC theme */
from-purple-500 to-pink-600                 /* JAMZ theme */

/* Opacity Levels */
/10  /* Very subtle background */
/20  /* Subtle background */
/30  /* Border colors */
/40  /* Secondary text */
/50  /* Tertiary text */
/60  /* Info text */
/70  /* Label text */
/80  /* Primary text */
```

### Text Sizes
```css
text-xs     /* 12px - Small details */
text-sm     /* 14px - Labels */
text-base   /* 16px - Body text */
text-lg     /* 18px - Emphasized text */
text-xl     /* 20px - Subheadings */
text-2xl    /* 24px - Headings */
text-3xl    /* 30px - Large amounts (mobile) */
text-4xl    /* 36px - Large amounts (desktop) */
```

### Spacing
```css
p-4         /* 16px padding */
p-6         /* 24px padding */
space-y-3   /* 12px vertical gap */
space-y-6   /* 24px vertical gap */
gap-2       /* 8px gap */
gap-3       /* 12px gap */
```

### Border Radius
```css
rounded-xl      /* 12px - Cards, buttons */
rounded-2xl     /* 16px - Main containers */
rounded-full    /* 50% - Icons, circular elements */
```

---

## Animation Patterns

### Entrance Animation
```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
>
  {/* Content */}
</motion.div>
```

### Button Interaction
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  {/* Button content */}
</motion.button>
```

### Modal Animation
```tsx
<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Common Customizations

### Change Button Colors
```tsx
// Find the swap button
className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600"

// Change to green theme
className="w-full bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600"
```

### Adjust Input Size
```tsx
// Current
className="text-3xl md:text-4xl"

// Larger
className="text-4xl md:text-5xl"

// Smaller
className="text-2xl md:text-3xl"
```

### Modify Card Spacing
```tsx
// Current
className="glass-card rounded-2xl p-4 md:p-6 space-y-1"

// More spacious
className="glass-card rounded-2xl p-6 md:p-8 space-y-2"

// More compact
className="glass-card rounded-2xl p-3 md:p-4 space-y-1"
```

---

## State Management

### Key State Variables
```typescript
const [fromCurrency, setFromCurrency] = useState('USDC');
const [toCurrency, setToCurrency] = useState('JAMZ');
const [fromAmount, setFromAmount] = useState('');
const [toAmount, setToAmount] = useState('');
const [exchangeRate, setExchangeRate] = useState(0);
const [loading, setLoading] = useState(false);
const [showConfirmation, setShowConfirmation] = useState(false);
```

### Important Functions
```typescript
fetchExchangeRate()      // Get current exchange rate
handleSwap()             // Initiate swap process
executeSwap()            // Execute confirmed swap
handleSwapCurrencies()   // Reverse from/to currencies
handleMaxClick()         // Set max amount
```

---

## API Integration

### Exchange Rate Endpoint
```typescript
GET /api/wallets/exchange-rates
Response: {
  rates: {
    'USDC-JAMZ': 2.0,
    'USDC-NGN': 1500,
    // ...
  },
  fees: {
    'USDC-JAMZ': 0.5,
    // ...
  }
}
```

### Swap Endpoint
```typescript
POST /api/wallets/swap
Body: {
  fromCurrency: 'USDC',
  toCurrency: 'JAMZ',
  amount: 100
}
Response: {
  success: true,
  transaction: { /* ... */ }
}
```

---

## Troubleshooting

### Issue: Animations not working
**Solution**: Ensure Framer Motion is installed
```bash
npm install framer-motion
```

### Issue: Colors not showing
**Solution**: Check Tailwind config includes all color variants
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // ...
}
```

### Issue: Exchange rate not updating
**Solution**: Check API endpoint and network tab
```typescript
// Add console.log in fetchExchangeRate
console.log('Fetching rates...', response);
```

---

## Performance Tips

1. **Memoize expensive calculations**
```typescript
const calculatedAmount = useMemo(() => {
  return parseFloat(fromAmount) * exchangeRate;
}, [fromAmount, exchangeRate]);
```

2. **Debounce input changes**
```typescript
const debouncedAmount = useDebounce(fromAmount, 300);
```

3. **Lazy load heavy components**
```typescript
const ConfirmationModal = lazy(() => import('./ConfirmationModal'));
```

---

## Testing

### Unit Tests
```typescript
describe('SwapInterface', () => {
  it('calculates exchange correctly', () => {
    // Test logic
  });
  
  it('validates minimum amounts', () => {
    // Test logic
  });
});
```

### Integration Tests
```typescript
it('completes full swap flow', async () => {
  // 1. Enter amount
  // 2. Click swap
  // 3. Confirm
  // 4. Verify success
});
```

---

## Accessibility

### ARIA Labels
```tsx
<button aria-label="Swap currencies">
  <ArrowDownUp />
</button>
```

### Keyboard Navigation
```tsx
<input
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleSwap();
  }}
/>
```

---

## Best Practices

1. ✅ Always validate user input
2. ✅ Show loading states
3. ✅ Handle errors gracefully
4. ✅ Provide clear feedback
5. ✅ Use semantic HTML
6. ✅ Test on multiple devices
7. ✅ Optimize for performance
8. ✅ Follow accessibility guidelines

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Lucide Icons](https://lucide.dev/)

---

**Happy Coding! 🚀**

