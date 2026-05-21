import { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, Lock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { CartItem } from './CartSheet';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  orderId: string;
  onPaymentSuccess: () => void;
}

export function PaymentModal({
  open,
  onClose,
  cartItems,
  totalAmount,
  orderId,
  onPaymentSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
    }
    
    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) return;
    }
    
    // CVV max 3 digits
    if (field === 'cvv' && value.length > 3) return;
    
    setFormData({ ...formData, [field]: formattedValue });
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessing(false);
    setPaymentComplete(true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Call success callback after a short delay
    setTimeout(() => {
      onPaymentSuccess();
      handleClose();
    }, 3000);
  };

  const handleClose = () => {
    setPaymentComplete(false);
    setFormData({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      email: '',
      phone: ''
    });
    onClose();
  };

  const isFormValid = () => {
    if (paymentMethod === 'card') {
      return (
        formData.cardNumber.replace(/\s/g, '').length === 16 &&
        formData.cardName.length > 0 &&
        formData.expiryDate.length === 5 &&
        formData.cvv.length === 3 &&
        formData.email.length > 0 &&
        formData.phone.length > 0
      );
    } else {
      return formData.email.length > 0 && formData.phone.length > 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!paymentComplete ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#1DB854]" />
                Secure Payment
              </DialogTitle>
              <DialogDescription>
                Complete your order for Kefas Food products. All transactions are secure and encrypted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Order ID:</span>
                  <span className="font-mono text-sm font-semibold">{orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Items:</span>
                  <span className="text-sm">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s)</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-[#1DB854]">£{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-[#1DB854]" />
                      <div>
                        <div className="font-semibold">Credit/Debit Card</div>
                        <div className="text-xs text-muted-foreground">Visa, Mastercard, Amex</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 text-[#FF9500]" />
                      <div>
                        <div className="font-semibold">PayPal</div>
                        <div className="text-xs text-muted-foreground">Fast and secure</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 7480 140217"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card Details (only show if card is selected) */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Card Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Cardholder Name *</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={formData.cardName}
                        onChange={(e) => handleInputChange('cardName', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date *</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          maxLength={3}
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Demo Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Demo Payment Mode:</strong> This is a demonstration payment interface. You can practice the checkout flow here. For real payments, please configure Stripe (see documentation).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#1DB854] hover:bg-[#1DB854]/90"
                  onClick={handlePayment}
                  disabled={!isFormValid() || processing}
                >
                  {processing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay £{totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Success Screen
          <div className="py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-[#1DB854]/10 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-[#1DB854]" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground mb-4">
                  Your order has been confirmed and will be processed shortly.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 inline-block">
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono font-bold text-lg">{orderId}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A confirmation email has been sent to {formData.email}. We'll contact you at {formData.phone} with delivery details.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}