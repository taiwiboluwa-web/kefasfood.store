import { useState, useEffect } from 'react';
import { Clock, Bell, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

// Types
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  sizes?: Array<{ size: string; price: number }>;
  description?: string;
  image?: string;
  imageUrl?: string;
  inStock?: boolean;
  badge?: 'Popular' | 'Best Seller' | 'New';
  variants?: { weight: string; price: number }[];
}

export function ComingSoonSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comingSoonProducts, setComingSoonProducts] = useState<Product[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Load coming soon settings from localStorage
    const loadComingSoonData = () => {
      const storedEnabled = localStorage.getItem('kefas_coming_soon_enabled');
      const enabled = storedEnabled === 'true';
      setIsEnabled(enabled);

      const storedProductIds = localStorage.getItem('kefas_coming_soon_products');
      const productIds: string[] = storedProductIds ? JSON.parse(storedProductIds) : [];

      const storedAllProducts = localStorage.getItem('kefas_all_products');
      const allProducts: Product[] = storedAllProducts ? JSON.parse(storedAllProducts) : [];

      // Filter products based on IDs in coming soon list
      const comingSoon = allProducts.filter(p => productIds.includes(p.id));
      setComingSoonProducts(comingSoon);
    };

    loadComingSoonData();

    // Listen for updates from admin dashboard
    const handleUpdate = () => {
      loadComingSoonData();
    };

    window.addEventListener('kefas_products_updated', handleUpdate);
    window.addEventListener('kefas_coming_soon_updated', handleUpdate);

    return () => {
      window.removeEventListener('kefas_products_updated', handleUpdate);
      window.removeEventListener('kefas_coming_soon_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (comingSoonProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % comingSoonProducts.length);
    }, 5000); // Change product every 5 seconds

    return () => clearInterval(interval);
  }, [comingSoonProducts.length]);

  // Don't render if disabled or no products
  if (!isEnabled || comingSoonProducts.length === 0) {
    return null;
  }

  const activeProduct = comingSoonProducts[currentIndex];

  const handleNext = () => {
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % comingSoonProducts.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrevious = () => {
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + comingSoonProducts.length) % comingSoonProducts.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNotifyMe = () => {
    const productName = activeProduct.name;
    const whatsappMessage = `🔔 *Product Notification Request*\n\nI would like to be notified when "${productName}" is available.\n\nPlease add me to the notification list.\n\nThank you!`;
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/447480140217?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to register for notifications...');
  };

  return (
    <section className="py-16 bg-gradient-to-br from-[#1DB854]/5 via-background to-[#FF9500]/5">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#FF9500]/10 text-[#FF9500] px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Coming Soon</span>
              {comingSoonProducts.length > 1 && (
                <span className="ml-2 px-2 py-0.5 bg-[#FF9500]/20 rounded-full text-xs">
                  {currentIndex + 1} of {comingSoonProducts.length}
                </span>
              )}
            </div>
            <h2 className={`text-4xl font-bold mb-4 transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
              {activeProduct.name}
            </h2>
            <p className={`text-xl text-muted-foreground max-w-2xl mx-auto min-h-[60px] transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
              {activeProduct.description}
            </p>
          </div>

          {/* Main Content */}
          <div className="relative grid lg:grid-cols-2 gap-8 items-center bg-gradient-to-br from-[#1DB854]/10 to-[#FF9500]/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-[#1DB854]/20">
            {/* Navigation Arrows */}
            {comingSoonProducts.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                  aria-label="Previous product"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                  aria-label="Next product"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image Side */}
            <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
              <div className={`w-full h-full transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-105' : 'opacity-100 transform scale-100'}`}>
                {activeProduct.imageUrl ? (
                  <img
                    src={activeProduct.imageUrl}
                    alt={activeProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageWithFallback
                    src={activeProduct.image || ''}
                    alt={activeProduct.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {/* Overlay Badge */}
              <div className={`absolute top-4 right-4 bg-[#1DB854] text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
                <p className="text-sm font-semibold">Premium Quality</p>
              </div>

              {/* Image indicators */}
              {comingSoonProducts.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {comingSoonProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-white w-6'
                          : 'bg-white/50 hover:bg-white/75 w-2'
                      }`}
                      aria-label={`View product ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content Side */}
            <div className="p-8 lg:p-12">
              <div className={`space-y-6 transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
                {/* Product Info */}
                <div className="space-y-4 min-h-[220px]">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#1DB854]/10 flex items-center justify-center flex-shrink-0">
                      <div className="h-3 w-3 rounded-full bg-[#1DB854]"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Category</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeProduct.category}
                      </p>
                    </div>
                  </div>

                  {activeProduct.variants && activeProduct.variants.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1DB854]/10 flex items-center justify-center flex-shrink-0">
                        <div className="h-3 w-3 rounded-full bg-[#1DB854]"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Available Sizes</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeProduct.variants.map(v => v.weight).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#1DB854]/10 flex items-center justify-center flex-shrink-0">
                      <div className="h-3 w-3 rounded-full bg-[#1DB854]"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Premium Quality</h3>
                      <p className="text-sm text-muted-foreground">
                        Carefully selected and processed to preserve authentic taste and freshness
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-[#FF9500]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-[#FF9500]" />
                    <p className="font-semibold">Launching Soon</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We're working hard to bring you the best quality products. Be the first to know when they're available!
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handleNotifyMe}
                  size="lg"
                  className="w-full bg-[#1DB854] hover:bg-[#1DB854]/90 text-white transition-colors"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Notify Me When Available
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Click to send us a WhatsApp message and we'll notify you when this is in stock
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-card rounded-lg p-6 border text-center">
              <div className="h-12 w-12 rounded-full bg-[#1DB854]/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-[#1DB854]" />
              </div>
              <h3 className="font-semibold mb-2">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                Only the finest products make it to our selection
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border text-center">
              <div className="h-12 w-12 rounded-full bg-[#FF9500]/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-[#FF9500]" />
              </div>
              <h3 className="font-semibold mb-2">Preserved Freshness</h3>
              <p className="text-sm text-muted-foreground">
                Carefully processed to lock in the authentic taste
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 border text-center">
              <div className="h-12 w-12 rounded-full bg-[#1DB854]/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6 text-[#1DB854]" />
              </div>
              <h3 className="font-semibold mb-2">Early Access</h3>
              <p className="text-sm text-muted-foreground">
                Be among the first to order when we launch
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}