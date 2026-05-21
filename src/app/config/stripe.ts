/**
 * Stripe Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Stripe Account:
 *    - Go to https://stripe.com
 *    - Sign up for a free account
 *    - Complete verification (takes 1-2 days for live payments)
 * 
 * 2. Get Your API Keys:
 *    - Go to https://dashboard.stripe.com/test/apikeys
 *    - Copy your "Publishable key" (starts with pk_test_...)
 *    - Replace PUBLISHABLE_KEY_HERE below
 * 
 * 3. Test Mode vs Live Mode:
 *    - Test mode: Use pk_test_... keys (no real money)
 *    - Live mode: Use pk_live_... keys (real transactions)
 * 
 * 4. Test Card Numbers:
 *    - Success: 4242 4242 4242 4242
 *    - Requires authentication: 4000 0025 0000 3155
 *    - Declined: 4000 0000 0000 9995
 *    - Use any future expiry date and any 3-digit CVV
 * 
 * 5. For Production:
 *    - Replace with pk_live_... key
 *    - Complete Stripe account verification
 *    - Enable live payments in Stripe dashboard
 */

// Replace this with your actual Stripe Publishable Key
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

// Test mode indicator
export const IS_TEST_MODE = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');

// Currency configuration
export const CURRENCY = 'gbp'; // GBP for UK
export const CURRENCY_SYMBOL = '£';

// Business details
export const BUSINESS_NAME = 'Kefas Foods';
export const BUSINESS_EMAIL = 'orders@kefasfoods.com';
export const SUPPORT_PHONE = '+44 7480 140217';
