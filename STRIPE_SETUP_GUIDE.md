# 💳 Complete Stripe Payment Setup Guide for Kefas Foods

This guide will walk you through implementing real online payments for your e-commerce website.

## 🎯 What You'll Get

- **Accept real credit/debit card payments** (Visa, Mastercard, Amex, etc.)
- **Secure PCI-compliant payment processing** (Stripe handles all security)
- **Test mode for development** (no real money until you're ready)
- **Support for GBP (£) currency**
- **Mobile-responsive payment forms**
- **Instant payment confirmations**

---

## 📋 Step-by-Step Setup

### Step 1: Create a Stripe Account (5 minutes)

1. **Go to Stripe**
   - Visit [https://stripe.com](https://stripe.com)
   - Click "Start now" or "Sign up"

2. **Fill in Your Details**
   - Business name: `Kefas Foods`
   - Email: Your business email
   - Password: Create a strong password
   - Country: United Kingdom

3. **Verify Your Email**
   - Check your email inbox
   - Click the verification link Stripe sends you

4. **Complete Your Profile**
   - Add business details
   - Add bank account for payouts (required for live payments)
   - Upload business documents if requested

---

### Step 2: Get Your API Keys (2 minutes)

1. **Log into Stripe Dashboard**
   - Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)

2. **Switch to Test Mode**
   - Look at the top right - there's a toggle that says "Test mode"
   - Make sure it's **ON** (this is safe for testing)

3. **Get Your Publishable Key**
   - Click "Developers" in the top menu
   - Click "API keys" in the sidebar
   - Find "Publishable key" - it starts with `pk_test_...`
   - Click "Reveal test key" and copy it

---

### Step 3: Add Your Key to the Website (1 minute)

1. **Open the Stripe Config File**
   - Location: `/src/app/config/stripe.ts`
   
2. **Replace the Placeholder Key**
   - Find this line:
     ```typescript
     export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
     ```
   - Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual key:
     ```typescript
     export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51abc123def...';
     ```

3. **Save the File**
   - The payment system is now active!

---

### Step 4: Test Your Payments (5 minutes)

Stripe provides test card numbers that simulate real payments:

#### ✅ Successful Payment
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVV:** Any 3 digits (e.g., `123`)
- **Result:** Payment succeeds

#### 🔐 3D Secure Authentication
- **Card Number:** `4000 0025 0000 3155`
- **Result:** Requires additional authentication (test the auth flow)

#### ❌ Declined Card
- **Card Number:** `4000 0000 0000 9995`
- **Result:** Payment is declined

#### 💰 Insufficient Funds
- **Card Number:** `4000 0000 0000 9995`
- **Result:** Card is declined due to insufficient funds

**How to Test:**
1. Add products to cart on your website
2. Click "Pay Online"
3. Enter one of the test card numbers above
4. Complete the payment
5. Check if order confirmation appears

---

### Step 5: Enable Live Payments (When Ready)

⚠️ **Only do this when you're ready to accept real money!**

#### Complete Stripe Verification
1. **Submit Business Information**
   - In Stripe Dashboard, go to "Settings"
   - Complete all required sections (usually takes 1-2 business days)

2. **Add Bank Account**
   - Go to "Settings" → "Payouts"
   - Add your business bank account for receiving payments

3. **Enable Live Mode**
   - Once verified, Stripe will activate your live account

#### Switch to Live API Key
1. **Get Live Key**
   - In Stripe Dashboard, turn OFF "Test mode" toggle
   - Go to "Developers" → "API keys"
   - Copy your "Publishable key" (starts with `pk_live_...`)

2. **Update Config File**
   - Open `/src/app/config/stripe.ts`
   - Replace test key with live key:
     ```typescript
     export const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_LIVE_KEY';
     ```

3. **Test with Real Card**
   - Use a small amount first to verify everything works
   - Check that payment appears in Stripe Dashboard
   - Verify money arrives in your bank account

---

## 🔒 Security & Compliance

### What Stripe Handles For You
- ✅ **PCI Compliance** - Stripe is PCI Level 1 certified
- ✅ **Card Data Storage** - Cards never touch your servers
- ✅ **Fraud Detection** - Built-in Stripe Radar protection
- ✅ **3D Secure** - Automatic authentication when needed
- ✅ **Encryption** - All data encrypted in transit and at rest

### What You Need to Do
- ✅ **Use HTTPS** - Figma Make deploys use HTTPS by default
- ✅ **Keep API Keys Secret** - Never commit live keys to git
- ✅ **Monitor Transactions** - Check Stripe Dashboard regularly

---

## 💰 Pricing

Stripe charges per successful transaction:

- **UK Cards:** 1.5% + £0.20
- **European Cards:** 2.5% + £0.20
- **International Cards:** 3.25% + £0.20

**Example:**
- £50 order with UK card = £50 - (£50 × 0.015 + £0.20) = **£49.05 to you**

**No monthly fees** - You only pay when you get paid!

---

## 📧 Customer Experience

### What Customers See
1. Click "Pay Online" in cart
2. Secure Stripe payment form appears
3. Enter card details
4. Click "Pay £X.XX"
5. Instant confirmation with order ID

### Email Confirmations
Stripe can send automated receipts:
1. Go to Stripe Dashboard
2. Settings → Emails
3. Enable "Successful payments"
4. Customize email template

---

## 🐛 Troubleshooting

### Payment Form Not Showing
- ✅ Check you added the API key correctly
- ✅ Make sure key starts with `pk_test_` or `pk_live_`
- ✅ Check browser console for errors

### "Invalid API Key" Error
- ✅ Verify you copied the entire key
- ✅ Make sure no extra spaces before/after
- ✅ Check you're using publishable key (not secret key)

### Test Payments Not Working
- ✅ Make sure you're in Test Mode in Stripe Dashboard
- ✅ Use test card numbers from Step 4
- ✅ Check Stripe Dashboard logs for error messages

### Live Payments Declined
- ✅ Verify Stripe account is fully activated
- ✅ Check bank account is connected
- ✅ Review declined payment in Stripe Dashboard

---

## 📊 Monitoring Orders

### View Payments
1. **Stripe Dashboard**
   - Go to "Payments" section
   - See all transactions, refunds, disputes

2. **Your Website**
   - Orders are saved to browser localStorage
   - Check: `localStorage.getItem('kefas_orders')`

### Process Orders
1. Customer pays online
2. You receive notification (set up in Stripe)
3. Prepare order for delivery
4. Contact customer with tracking info
5. Mark as fulfilled in your system

---

## 🎓 Additional Resources

- **Stripe Documentation:** [https://stripe.com/docs](https://stripe.com/docs)
- **Test Cards:** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Support:** [https://support.stripe.com](https://support.stripe.com)
- **Status:** [https://status.stripe.com](https://status.stripe.com)

---

## ✅ Quick Checklist

- [ ] Created Stripe account
- [ ] Verified email address
- [ ] Copied publishable test key
- [ ] Added key to `/src/app/config/stripe.ts`
- [ ] Tested with test card `4242 4242 4242 4242`
- [ ] Confirmed order ID appears
- [ ] Reviewed transaction in Stripe Dashboard

For live payments (later):
- [ ] Completed Stripe verification
- [ ] Added bank account
- [ ] Switched to live API key
- [ ] Tested with real card (small amount)
- [ ] Confirmed payment in bank account

---

## 💡 Pro Tips

1. **Start in Test Mode** - Perfect your flow before going live
2. **Enable Email Receipts** - Customers love confirmation emails
3. **Monitor Dashboard** - Check it daily when starting out
4. **Set Up Webhooks** - Get notified of successful payments (advanced)
5. **Add Delivery Form** - Collect shipping address during checkout
6. **Offer Refunds** - Easy to do through Stripe Dashboard

---

## 🚀 You're Ready!

Your payment system is now professionally configured. Customers can pay with credit/debit cards securely, and you'll receive funds directly to your bank account.

**Need Help?** Contact Stripe support - they have excellent 24/7 support for all account holders.

---

*Last Updated: April 2026*
