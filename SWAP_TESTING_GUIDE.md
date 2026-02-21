# Currency Swap Feature - Testing Guide

## 🚀 Quick Start

### Start the Application

**Option 1: Quick Start (Both servers)**
```bash
npm run start:quick
```

**Option 2: Manual Start**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

---

## ✅ Testing Checklist

### **Part 1: Admin Setup (Exchange Rates)**

1. **Login as Admin**
   - Navigate to the app
   - Login with admin credentials
   - Go to Admin Settings page

2. **Access Exchange Rates Tab**
   - Click on "Exchange Rates" tab in Admin Settings
   - You should see:
     - Swap Fee Percentage section
     - Minimum Swap Amounts section
     - Exchange Rates table with all currency pairs

3. **Test Rate Management**
   - [ ] Click "Edit" on swap fee percentage
   - [ ] Change the value (e.g., from 0.5% to 1%)
   - [ ] Click "Save" - should see success message
   - [ ] Verify the new fee is displayed

4. **Test Minimum Amounts**
   - [ ] Click "Edit" on minimum swap amounts
   - [ ] Change a value (e.g., USDC from 1 to 5)
   - [ ] Click "Save" - should see success message
   - [ ] Verify the new minimum is displayed

5. **Test Exchange Rate Updates**
   - [ ] Click edit icon on any rate row (e.g., USDC → JAMZ)
   - [ ] Change the rate value
   - [ ] Click save icon - should see success message
   - [ ] Verify the rate is updated in the table

6. **Test Rate History**
   - [ ] Click "View History" button
   - [ ] Modal should open showing rate change history
   - [ ] Verify your recent changes are logged
   - [ ] Close the modal

---

### **Part 2: User Swap Interface**

1. **Access Wallet**
   - Login as a regular user (or create a test user)
   - Navigate to Wallet page
   - You should see three tabs: Balances, Swap, Transactions

2. **Navigate to Swap Tab**
   - [ ] Click on "Swap" tab
   - [ ] Interface should load showing:
     - From currency dropdown
     - Amount input field
     - Swap currencies button (arrows)
     - To currency dropdown
     - Calculated amount display
     - Exchange rate info
     - Fee information
     - Swap button

3. **Test Currency Selection**
   - [ ] Select different "From" currencies
   - [ ] Select different "To" currencies
   - [ ] Verify exchange rate updates automatically
   - [ ] Try selecting same currency for both - should work but rate = 1

4. **Test Amount Input**
   - [ ] Enter an amount in the "From" field
   - [ ] Verify "To" amount calculates automatically
   - [ ] Verify fee is displayed correctly
   - [ ] Click "MAX" button - should fill with full balance

5. **Test Swap Currencies Button**
   - [ ] Click the swap arrows button
   - [ ] Verify From and To currencies switch places
   - [ ] Verify amounts are cleared

6. **Test Validation**
   - [ ] Try to swap with 0 amount - should show error
   - [ ] Try to swap more than your balance - should show error
   - [ ] Try to swap less than minimum amount - should show error
   - [ ] All errors should display clearly

---

### **Part 3: Execute Swap**

**Prerequisites:** Make sure your test user has some balance in at least one currency.

1. **Successful Swap**
   - [ ] Select From currency (one you have balance in)
   - [ ] Select To currency (different from From)
   - [ ] Enter valid amount (above minimum, below balance)
   - [ ] Click "Swap" button
   - [ ] Confirmation modal should appear showing:
     - Amount you're paying
     - Amount you'll receive
     - Exchange rate
     - Fee amount
   - [ ] Click "Confirm Swap"
   - [ ] Should see success message
   - [ ] Balances should update immediately

2. **Verify Transaction**
   - [ ] Go to "Transactions" tab
   - [ ] Find your swap transaction
   - [ ] Verify it shows:
     - Type: swap
     - Correct amounts
     - Swap details (from/to currencies, rate, fee)
   - [ ] Check timestamp is correct

3. **Verify Balance Changes**
   - [ ] Go back to "Balances" tab
   - [ ] Verify From currency decreased by swap amount
   - [ ] Verify To currency increased by received amount (minus fee)
   - [ ] Math should be: `received = (fromAmount × rate) - fee`

---

### **Part 4: Edge Cases**

1. **Insufficient Balance**
   - [ ] Try to swap more than you have
   - [ ] Should show "Insufficient balance" error
   - [ ] Swap button should be disabled or show error

2. **Below Minimum Amount**
   - [ ] Try to swap less than minimum (check admin settings)
   - [ ] Should show minimum amount error
   - [ ] Error should specify the minimum for that currency

3. **Cancel Swap**
   - [ ] Start a swap
   - [ ] Click "Swap" button
   - [ ] In confirmation modal, click "Cancel"
   - [ ] Modal should close
   - [ ] No swap should be executed

4. **Multiple Swaps**
   - [ ] Execute 2-3 swaps in a row
   - [ ] Verify each one works correctly
   - [ ] Check all appear in transaction history
   - [ ] Verify balances are correct after all swaps

---

### **Part 5: UI/UX Testing**

1. **Responsive Design**
   - [ ] Test on desktop (full width)
   - [ ] Test on tablet (resize browser)
   - [ ] Test on mobile (resize to phone width)
   - [ ] All elements should be visible and usable

2. **Loading States**
   - [ ] Check for loading spinner when fetching rates
   - [ ] Check for loading state during swap execution
   - [ ] Buttons should be disabled during loading

3. **Error Handling**
   - [ ] Disconnect from internet (or stop backend)
   - [ ] Try to swap - should show error message
   - [ ] Reconnect - should work again

4. **Animations**
   - [ ] Success messages should fade in/out
   - [ ] Error messages should fade in/out
   - [ ] Tab transitions should be smooth
   - [ ] Modal should have smooth open/close animation

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to fetch exchange rates"
- **Solution**: Make sure backend is running and connected to MongoDB

### Issue: "Insufficient balance"
- **Solution**: Add funds to your wallet first (use deposit feature)

### Issue: Rates not updating
- **Solution**: Refresh the page or check admin settings

### Issue: Swap button disabled
- **Solution**: Check validation errors, ensure amount is valid

---

## 📊 Test Data Suggestions

### Create Test Scenarios:
1. **Small swap**: 1 USDC → JAMZ
2. **Large swap**: 100 USDC → NGN
3. **Reverse swap**: JAMZ → USDC
4. **Multi-currency**: USDC → AED, then AED → INR

### Expected Results:
- Default fee: 0.5%
- Example: 100 USDC → JAMZ at rate 100
  - Gross: 10,000 JAMZ
  - Fee: 50 JAMZ (0.5%)
  - Net received: 9,950 JAMZ

---

## ✨ Success Criteria

All tests pass if:
- ✅ Admin can view and update all exchange rates
- ✅ Admin can modify fee percentage and minimums
- ✅ Users can see current rates and fees
- ✅ Swaps execute correctly with proper validation
- ✅ Balances update accurately after swaps
- ✅ Transaction history records all swaps
- ✅ UI is responsive and user-friendly
- ✅ Error messages are clear and helpful

---

## 🚀 Ready to Deploy?

Once all tests pass:
```bash
npm run build
npm run deploy
```

Or use your preferred deployment method!

