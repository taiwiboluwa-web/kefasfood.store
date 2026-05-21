import { useState, useEffect } from 'react';
import { Package, Calendar, CreditCard, Phone, Mail, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { CartItem } from './CartSheet';
import { Badge } from './ui/badge';

interface Order {
  id: string;
  items: CartItem[];
  customer: {
    email: string;
    phone: string;
    name?: string;
  };
  payment: {
    success: boolean;
    paymentId: string;
    transactionId?: string;
  };
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

interface OrderHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function OrderHistoryModal({ open, onClose }: OrderHistoryModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadOrders();
    }
  }, [open]);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem('kefasFood_orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      }
    } else {
      setOrders([]);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#1DB854] text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'shipped':
        return 'bg-[#FF9500] text-white';
      case 'delivered':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#1DB854]" />
            Order History
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Your order history will appear here after you make your first purchase.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div
                    key={order.id}
                    className="border rounded-lg overflow-hidden hover:border-[#1DB854]/50 transition-colors"
                  >
                    {/* Order Header */}
                    <div
                      className="p-4 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono font-semibold text-sm">{order.id}</span>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {totalItems} item{totalItems !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-[#1DB854]">
                              £{order.total.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="p-4 border-t space-y-4">
                        {/* Customer Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground">Customer Details</h4>
                            <div className="space-y-1 text-sm">
                              {order.customer.name && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{order.customer.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                {order.customer.email}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {order.customer.phone}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-muted-foreground">Payment Details</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5" />
                                <span className="text-muted-foreground">Payment ID:</span>
                              </div>
                              <div className="font-mono text-xs break-all">
                                {order.payment.paymentId}
                              </div>
                              {order.payment.transactionId && (
                                <>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-muted-foreground">Transaction ID:</span>
                                  </div>
                                  <div className="font-mono text-xs break-all">
                                    {order.payment.transactionId}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Order Items */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-muted-foreground">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {item.selectedWeight} × {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-semibold text-sm">
                                  £{(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between font-bold">
                            <span>Total Amount</span>
                            <span className="text-lg text-[#1DB854]">
                              £{order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
