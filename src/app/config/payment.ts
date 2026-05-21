/**
 * Payment Configuration
 * 
 * PRODUCTION SETUP INSTRUCTIONS:
 * ================================
 * 
 * 1. STRIPE Setup:
 *    - Sign up at https://stripe.com
 *    - Get your API keys from Dashboard > Developers > API Keys
 *    - Replace STRIPE_PUBLISHABLE_KEY with your actual publishable key (pk_live_...)
 *    - Store STRIPE_SECRET_KEY on your backend server (never in frontend!)
 * 
 * 2. PAYPAL Setup:
 *    - Sign up at https://developer.paypal.com
 *    - Create an app in your PayPal Developer Dashboard
 *    - Get your Client ID from the app credentials
 *    - Replace PAYPAL_CLIENT_ID with your actual client ID
 * 
 * 3. PAYSTACK Setup (Recommended for African markets):
 *    - Sign up at https://paystack.com
 *    - Get your API keys from Settings > API Keys & Webhooks
 *    - Replace PAYSTACK_PUBLIC_KEY with your actual public key (pk_live_...)
 *    - Store PAYSTACK_SECRET_KEY on your backend server
 * 
 * 4. BACKEND REQUIREMENTS:
 *    - You MUST have a backend server to:
 *      a) Store secret API keys securely
 *      b) Process payment transactions server-side
 *      c) Handle webhooks from payment providers
 *      d) Store order records in a database
 *      e) Send confirmation emails
 * 
 * 5. SECURITY WARNING:
 *    - NEVER expose secret keys in frontend code
 *    - NEVER process payments purely from the frontend
 *    - ALWAYS validate payments on the server
 *    - ALWAYS use HTTPS in production
 */

export const PAYMENT_CONFIG = {
  // Current mode: 'demo' | 'production'
  mode: 'demo' as 'demo' | 'production',
  
  // Currency
  currency: 'GBP',
  currencySymbol: '£',
  
  // Stripe Configuration
  stripe: {
    publishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE', // Replace with: pk_live_xxxxx
    // Secret key must be stored on backend only!
    webhookSecret: 'YOUR_STRIPE_WEBHOOK_SECRET_HERE', // For backend use only
  },
  
  // PayPal Configuration
  paypal: {
    clientId: 'YOUR_PAYPAL_CLIENT_ID_HERE', // Replace with your PayPal Client ID
    // Live mode vs sandbox
    mode: 'sandbox' as 'sandbox' | 'live',
  },
  
  // Paystack Configuration (Great for Nigerian/African customers)
  paystack: {
    publicKey: 'YOUR_PAYSTACK_PUBLIC_KEY_HERE', // Replace with: pk_live_xxxxx
    // Secret key must be stored on backend only!
  },
  
  // WhatsApp Configuration (Alternative to online payment)
  whatsapp: {
    phoneNumber: '+447480140217',
    enabled: true,
  },
  
  // Backend API Endpoints (you'll need to create these)
  api: {
    baseUrl: 'YOUR_BACKEND_API_URL_HERE', // e.g., 'https://api.kefasfood.com'
    endpoints: {
      createPaymentIntent: '/api/payments/create-intent',
      confirmPayment: '/api/payments/confirm',
      createOrder: '/api/orders/create',
      getOrder: '/api/orders/:orderId',
      webhookHandler: '/api/webhooks/payment',
    }
  },
  
  // Order confirmation email settings (backend will handle this)
  email: {
    fromEmail: 'orders@kefasfood.com',
    confirmationTemplate: 'order-confirmation',
  }
};

// Helper function to check if payment is properly configured
export function isPaymentConfigured(): boolean {
  if (PAYMENT_CONFIG.mode === 'demo') {
    return true; // Demo mode always works
  }
  
  const stripeConfigured = PAYMENT_CONFIG.stripe.publishableKey !== 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
  const paypalConfigured = PAYMENT_CONFIG.paypal.clientId !== 'YOUR_PAYPAL_CLIENT_ID_HERE';
  const paystackConfigured = PAYMENT_CONFIG.paystack.publicKey !== 'YOUR_PAYSTACK_PUBLIC_KEY_HERE';
  
  return stripeConfigured || paypalConfigured || paystackConfigured;
}

// Helper to get active payment methods
export function getActivePaymentMethods() {
  if (PAYMENT_CONFIG.mode === 'demo') {
    return ['card', 'paypal', 'paystack', 'whatsapp'];
  }
  
  const methods = [];
  
  if (PAYMENT_CONFIG.stripe.publishableKey !== 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE') {
    methods.push('card');
  }
  
  if (PAYMENT_CONFIG.paypal.clientId !== 'YOUR_PAYPAL_CLIENT_ID_HERE') {
    methods.push('paypal');
  }
  
  if (PAYMENT_CONFIG.paystack.publicKey !== 'YOUR_PAYSTACK_PUBLIC_KEY_HERE') {
    methods.push('paystack');
  }
  
  if (PAYMENT_CONFIG.whatsapp.enabled) {
    methods.push('whatsapp');
  }
  
  return methods;
}
