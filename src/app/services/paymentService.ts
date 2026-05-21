/**
 * Payment Service
 * 
 * This service provides a unified interface for handling payments across different providers.
 * In DEMO mode, it simulates successful payments.
 * In PRODUCTION mode, it integrates with real payment APIs.
 * 
 * PRODUCTION IMPLEMENTATION NOTES:
 * ==================================
 * 
 * For each payment method, you'll need to:
 * 1. Install the provider's SDK (e.g., npm install @stripe/stripe-js)
 * 2. Replace mock functions with real API calls
 * 3. Implement proper error handling
 * 4. Add server-side verification
 */

import { PAYMENT_CONFIG } from '../config/payment';
import { CartItem } from '../components/CartSheet';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  clientSecret?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  error?: string;
  transactionId?: string;
}

export interface CustomerData {
  email: string;
  phone: string;
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

class PaymentService {
  /**
   * Create a payment intent (first step in payment flow)
   * 
   * PRODUCTION: This should call your backend API, which creates the payment
   * intent on the payment provider's server and returns the client secret.
   */
  async createPaymentIntent(
    amount: number,
    cartItems: CartItem[],
    method: 'stripe' | 'paypal' | 'paystack'
  ): Promise<PaymentIntent> {
    if (PAYMENT_CONFIG.mode === 'demo') {
      // Demo mode: simulate API call
      await this.simulateDelay(800);
      
      return {
        id: `pi_${this.generateRandomId()}`,
        amount,
        currency: PAYMENT_CONFIG.currency,
        status: 'pending',
        clientSecret: `pi_${this.generateRandomId()}_secret_${this.generateRandomId()}`,
      };
    }
    
    // PRODUCTION IMPLEMENTATION:
    // --------------------------
    // const response = await fetch(`${PAYMENT_CONFIG.api.baseUrl}${PAYMENT_CONFIG.api.endpoints.createPaymentIntent}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     amount,
    //     currency: PAYMENT_CONFIG.currency,
    //     paymentMethod: method,
    //     cartItems,
    //     metadata: {
    //       orderId: generateOrderId(), // Your order ID
    //       source: 'kefas-food-website'
    //     }
    //   })
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to create payment intent');
    // }
    // 
    // return await response.json();
    
    throw new Error('Payment is not configured. Please set up your payment provider in /src/app/config/payment.ts');
  }

  /**
   * Process Stripe Card Payment
   * 
   * PRODUCTION: Use @stripe/stripe-js library
   * npm install @stripe/stripe-js
   */
  async processStripePayment(
    paymentIntent: PaymentIntent,
    cardData: {
      cardNumber: string;
      cardName: string;
      expiryDate: string;
      cvv: string;
    },
    customerData: CustomerData
  ): Promise<PaymentResult> {
    if (PAYMENT_CONFIG.mode === 'demo') {
      await this.simulateDelay(2000);
      
      return {
        success: true,
        paymentId: paymentIntent.id,
        orderId: `KF-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${this.generateRandomId(6)}`,
        transactionId: `txn_${this.generateRandomId()}`,
      };
    }
    
    // PRODUCTION IMPLEMENTATION:
    // --------------------------
    // import { loadStripe } from '@stripe/stripe-js';
    // 
    // const stripe = await loadStripe(PAYMENT_CONFIG.stripe.publishableKey);
    // 
    // if (!stripe) {
    //   throw new Error('Stripe failed to load');
    // }
    // 
    // const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
    //   paymentIntent.clientSecret!,
    //   {
    //     payment_method: {
    //       card: {
    //         number: cardData.cardNumber,
    //         exp_month: parseInt(cardData.expiryDate.split('/')[0]),
    //         exp_year: parseInt('20' + cardData.expiryDate.split('/')[1]),
    //         cvc: cardData.cvv,
    //       },
    //       billing_details: {
    //         name: cardData.cardName,
    //         email: customerData.email,
    //         phone: customerData.phone,
    //       }
    //     }
    //   }
    // );
    // 
    // if (error) {
    //   return {
    //     success: false,
    //     paymentId: paymentIntent.id,
    //     orderId: '',
    //     error: error.message,
    //   };
    // }
    // 
    // // Confirm with your backend
    // const confirmResponse = await fetch(`${PAYMENT_CONFIG.api.baseUrl}${PAYMENT_CONFIG.api.endpoints.confirmPayment}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     paymentIntentId: confirmedIntent.id,
    //     customerData,
    //   })
    // });
    // 
    // const result = await confirmResponse.json();
    // return result;
    
    throw new Error('Stripe is not configured');
  }

  /**
   * Process PayPal Payment
   * 
   * PRODUCTION: Use @paypal/react-paypal-js library
   * npm install @paypal/react-paypal-js
   */
  async processPayPalPayment(
    amount: number,
    cartItems: CartItem[],
    customerData: CustomerData
  ): Promise<PaymentResult> {
    if (PAYMENT_CONFIG.mode === 'demo') {
      await this.simulateDelay(2000);
      
      return {
        success: true,
        paymentId: `PAYPAL-${this.generateRandomId()}`,
        orderId: `KF-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${this.generateRandomId(6)}`,
        transactionId: `txn_${this.generateRandomId()}`,
      };
    }
    
    // PRODUCTION IMPLEMENTATION:
    // --------------------------
    // This should redirect to PayPal or open PayPal modal
    // The actual implementation depends on your backend setup
    // 
    // const response = await fetch(`${PAYMENT_CONFIG.api.baseUrl}/api/payments/paypal/create`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     amount,
    //     currency: PAYMENT_CONFIG.currency,
    //     cartItems,
    //     customerData,
    //   })
    // });
    // 
    // const { approvalUrl, orderId } = await response.json();
    // 
    // // Redirect to PayPal
    // window.location.href = approvalUrl;
    
    throw new Error('PayPal is not configured');
  }

  /**
   * Process Paystack Payment
   * 
   * PRODUCTION: Use Paystack Inline JS
   * Add script to your HTML: <script src="https://js.paystack.co/v1/inline.js"></script>
   */
  async processPaystackPayment(
    amount: number,
    cartItems: CartItem[],
    customerData: CustomerData
  ): Promise<PaymentResult> {
    if (PAYMENT_CONFIG.mode === 'demo') {
      await this.simulateDelay(2000);
      
      return {
        success: true,
        paymentId: `PSK-${this.generateRandomId()}`,
        orderId: `KF-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${this.generateRandomId(6)}`,
        transactionId: `txn_${this.generateRandomId()}`,
      };
    }
    
    // PRODUCTION IMPLEMENTATION:
    // --------------------------
    // return new Promise((resolve, reject) => {
    //   const handler = (window as any).PaystackPop.setup({
    //     key: PAYMENT_CONFIG.paystack.publicKey,
    //     email: customerData.email,
    //     amount: amount * 100, // Amount in kobo (for NGN) or pence (for GBP)
    //     currency: PAYMENT_CONFIG.currency,
    //     ref: `${Date.now()}`,
    //     metadata: {
    //       custom_fields: [
    //         {
    //           display_name: "Customer Phone",
    //           variable_name: "phone",
    //           value: customerData.phone
    //         }
    //       ],
    //       cart_items: cartItems
    //     },
    //     callback: function(response: any) {
    //       // Verify transaction on your backend
    //       fetch(`${PAYMENT_CONFIG.api.baseUrl}/api/payments/paystack/verify`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ reference: response.reference })
    //       })
    //       .then(res => res.json())
    //       .then(result => {
    //         resolve({
    //           success: true,
    //           paymentId: response.reference,
    //           orderId: result.orderId,
    //           transactionId: response.transaction,
    //         });
    //       });
    //     },
    //     onClose: function() {
    //       reject(new Error('Payment cancelled'));
    //     }
    //   });
    //   
    //   handler.openIframe();
    // });
    
    throw new Error('Paystack is not configured');
  }

  /**
   * Save order to backend/database
   * 
   * PRODUCTION: This should save to your database via backend API
   */
  async saveOrder(
    orderId: string,
    cartItems: CartItem[],
    customerData: CustomerData,
    paymentResult: PaymentResult,
    totalAmount: number
  ): Promise<void> {
    if (PAYMENT_CONFIG.mode === 'demo') {
      // In demo mode, save to localStorage
      const orders = JSON.parse(localStorage.getItem('kefasFood_orders') || '[]');
      
      const order = {
        id: orderId,
        items: cartItems,
        customer: customerData,
        payment: paymentResult,
        total: totalAmount,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      
      orders.unshift(order); // Add to beginning
      localStorage.setItem('kefasFood_orders', JSON.stringify(orders.slice(0, 50))); // Keep last 50
      
      await this.simulateDelay(300);
      return;
    }
    
    // PRODUCTION IMPLEMENTATION:
    // --------------------------
    // const response = await fetch(`${PAYMENT_CONFIG.api.baseUrl}${PAYMENT_CONFIG.api.endpoints.createOrder}`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     orderId,
    //     items: cartItems,
    //     customer: customerData,
    //     payment: paymentResult,
    //     total: totalAmount,
    //     status: 'confirmed',
    //   })
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to save order');
    // }
  }

  /**
   * Send order confirmation email
   * 
   * PRODUCTION: This should be handled by your backend
   */
  async sendOrderConfirmation(
    orderId: string,
    customerEmail: string,
    cartItems: CartItem[]
  ): Promise<void> {
    if (PAYMENT_CONFIG.mode === 'demo') {
      await this.simulateDelay(500);
      console.log(`📧 Order confirmation email would be sent to: ${customerEmail}`);
      return;
    }
    
    // PRODUCTION IMPLEMENTATION:
    // --------------------------
    // await fetch(`${PAYMENT_CONFIG.api.baseUrl}/api/emails/order-confirmation`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     orderId,
    //     email: customerEmail,
    //     items: cartItems,
    //   })
    // });
  }

  // Helper functions
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRandomId(length: number = 24): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
