import { Trash2, Minus, Plus, ShoppingBag, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from './ui/sheet';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  weight: string;
  quantity: number;
  image: string;
  imageUrl?: string; // Actual product image URL
}

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, weight: string, quantity: number) => void;
  onRemoveItem: (productId: string, weight: string) => void;
  onCheckout: () => void;
  onPayOnline: () => void; // New prop for online payment
}

export function CartSheet({
  open,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onPayOnline
}: CartSheetProps) {
  const calculateItemTotal = (item: CartItem) => {
    return item.price * item.quantity;
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#1DB854]" />
            Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review and manage items in your shopping cart before placing your order via WhatsApp.
          </SheetDescription>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h3 className="font-semibold mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add some delicious Nigerian products to get started!
            </p>
            <Button onClick={onClose} className="bg-[#1DB854] hover:bg-[#1DB854]/90">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden -mx-6 px-6">
              <ScrollArea className="h-full">
                <div className="space-y-4 py-4">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.weight}`} className="flex gap-4 p-4 border rounded-lg">
                      <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <ImageWithFallback
                          src={item.imageUrl || `https://source.unsplash.com/200x200/?${encodeURIComponent(item.image)}`}
                          alt={item.productName}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-1">{item.productName}</h4>
                            <p className="text-xs text-muted-foreground">{item.weight}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => onRemoveItem(item.productId, item.weight)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          £{item.price.toFixed(2)} each
                        </p>

                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.productId, item.weight, item.quantity - 1);
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  onUpdateQuantity(item.productId, item.weight, val);
                                }
                              }}
                              className="h-8 w-16 border-0 border-x text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => {
                                onUpdateQuantity(item.productId, item.weight, item.quantity + 1);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Subtotal:</span>
                          <span className="font-semibold text-[#1DB854]">
                            £{calculateItemTotal(item).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-shrink-0 border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>£{totalAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-[#1DB854]">£{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <SheetFooter className="flex-col sm:flex-col gap-2">
                <Button
                  className="w-full bg-[#FF9500] hover:bg-[#FF9500]/90 text-white"
                  size="lg"
                  onClick={onPayOnline}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay Online
                </Button>
                <Button
                  className="w-full bg-[#1DB854] hover:bg-[#1DB854]/90 text-white"
                  size="lg"
                  onClick={onCheckout}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Order via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}