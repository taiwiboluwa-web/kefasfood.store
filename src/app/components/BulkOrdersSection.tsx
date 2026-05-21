import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Building2, TrendingDown, Users, Store } from 'lucide-react';
import { toast } from 'sonner';

export function BulkOrdersSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    quantity: '',
    phone: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build WhatsApp message
    let message = '🏢 *Bulk Order Inquiry*\n\n';
    message += `*Full Name:* ${formData.fullName}\n`;
    message += `*Business Name:* ${formData.businessName}\n`;
    message += `*Quantity Needed:* ${formData.quantity}\n`;
    message += `*Phone:* ${formData.phone}\n`;
    message += `*Location:* ${formData.location}\n\n`;
    message += 'Please provide bulk pricing and availability details.';

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/447480140217?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp for bulk order inquiry...');
    
    // Reset form
    setFormData({
      fullName: '',
      businessName: '',
      quantity: '',
      phone: '',
      location: ''
    });
  };

  const bulkProducts = [
    { name: 'Pupuru', sizes: '2.5kg - 15kg', price: '£7.99 - £39.99', discount: '14%' },
    { name: 'Palm Oil', sizes: '1.5kg - 25kg', price: '£7.49 - £109.99', discount: '13%' },
    { name: 'Egusi', sizes: '500g - 2kg', price: '£4.99 - £18.99', discount: '12%' },
    { name: 'Yam Flour', sizes: '2kg - 5kg', price: '£9.99 - £23.99', discount: '14%' },
    { name: 'Garri Ijebu', sizes: '2kg - 5kg', price: '£5.99 - £13.99', discount: '13%' },
    { name: 'Dried Goat Meat', sizes: '1.2kg+', price: '£40.00+', discount: '12%' }
  ];

  return (
    <section id="bulk-orders" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Bulk Orders</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Special pricing for restaurants, caterers, and businesses. Get premium Nigerian products in bulk with exclusive discounts.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Bulk Order Form */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6">Request Bulk Pricing</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter business name (optional)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity Needed *</Label>
                  <Input
                    id="quantity"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g., 50kg Pupuru, 20L Palm Oil"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 XXX XXX XXXX"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>

                <Button type="submit" className="w-full bg-[#1DB854] hover:bg-[#1DB854]/90">
                  Submit Bulk Inquiry
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Perfect For & Bulk Pricing */}
          <div className="space-y-6">
            {/* Perfect For */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Perfect For</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#1DB854]/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-5 w-5 text-[#1DB854]" />
                    </div>
                    <div>
                      <p className="font-medium">Restaurants</p>
                      <p className="text-sm text-muted-foreground">Stock your kitchen</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-[#FF9500]" />
                    </div>
                    <div>
                      <p className="font-medium">Caterers</p>
                      <p className="text-sm text-muted-foreground">Event supplies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#1DB854]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-[#1DB854]" />
                    </div>
                    <div>
                      <p className="font-medium">Retailers</p>
                      <p className="text-sm text-muted-foreground">Resell products</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="h-5 w-5 text-[#FF9500]" />
                    </div>
                    <div>
                      <p className="font-medium">Communities</p>
                      <p className="text-sm text-muted-foreground">Group orders</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Pricing Table */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Popular Bulk Items</h3>
                <div className="space-y-3">
                  {bulkProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sizes}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1DB854]">{product.price}</p>
                        <p className="text-xs text-[#FF9500] font-medium">Save up to {product.discount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
