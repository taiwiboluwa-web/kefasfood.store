import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturesSection } from './components/FeaturesSection';
import { PerfectForSection } from './components/PerfectForSection';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CartSheet, CartItem } from './components/CartSheet';
import { ProductPreviewModal } from './components/ProductPreviewModal';
import { BulkOrdersSection } from './components/BulkOrdersSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { AboutSection } from './components/AboutSection';
import { PaymentModal } from './components/PaymentModal';
import { StripePaymentModal } from './components/StripePaymentModal';
import { Footer } from './components/Footer';
import { products as staticProducts, categories, Product } from './data/products';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { generateOrderId, formatOrderTimestamp } from './utils/orderUtils';
import { ThemeOption, applyTheme, getSavedTheme, getCurrentTimeBasedTheme } from './utils/themeUtils';
import { VisitorTracker } from './components/VisitorTracker';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { syncFromSupabase } from '../lib/dataSync';
import { clearOldCache, APP_VERSION } from './version';

export function MainPage() {
  // Check version and clear cache if needed
  useEffect(() => {
    clearOldCache();
    console.log(`🚀 Kefas Food Store v${APP_VERSION}`);
  }, []);

  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(() => getSavedTheme());
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Initialize cart from localStorage
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('kefasFood_cart');
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          return [];
        }
      }
    }
    return [];
  });

  const productsRef = useRef<HTMLDivElement>(null);
  const bulkOrdersRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [comingSoonEnabled, setComingSoonEnabled] = useState(false); // Disabled by default - all products available
  const [comingSoonProductIds, setComingSoonProductIds] = useState<string[]>([]); // No products in coming soon by default

  // Fetch stock status to override static data
  useEffect(() => {
    const loadStock = async () => {
      try {
        // Sync from Supabase first to get latest data across all accounts
        await syncFromSupabase();

        const storedStock = localStorage.getItem('kefas_stock_status');
        const storedPrices = localStorage.getItem('kefas_product_prices');
        const storedVariantPrices = localStorage.getItem('kefas_variant_prices');
        
        let stockData: Record<string, boolean> = {};
        let priceData: Record<string, number> = {};
        let variantPriceData: Record<string, Record<string, number>> = {};
        
        if (storedStock) stockData = JSON.parse(storedStock);
        if (storedPrices) priceData = JSON.parse(storedPrices);
        if (storedVariantPrices) variantPriceData = JSON.parse(storedVariantPrices);
        
      // Load unified product list
      const storedAllProducts = localStorage.getItem('kefas_all_products');
      let allProducts: Product[] = staticProducts;
      if (storedAllProducts) {
        try {
          allProducts = JSON.parse(storedAllProducts);
        } catch (e) {
          console.error('Failed to parse all products:', e);
        }
      }

      setProducts(
        allProducts.map(p => {
          const newPrice = priceData[p.id] !== undefined ? priceData[p.id] : p.price;
          let newVariants = p.variants;
          
          if (p.variants) {
            newVariants = p.variants.map(v => ({
              ...v,
              price: variantPriceData[p.id]?.[v.weight] !== undefined ? variantPriceData[p.id][v.weight] : v.price
            }));
          }
          
          return {
            ...p,
            inStock: stockData[p.id] !== undefined ? stockData[p.id] : p.inStock,
            price: newPrice,
            variants: newVariants
          };
        })
      );

      // Load coming soon settings (use defaults if not set)
      const storedComingSoonEnabled = localStorage.getItem('kefas_coming_soon_enabled');
      if (storedComingSoonEnabled !== null) {
        setComingSoonEnabled(JSON.parse(storedComingSoonEnabled));
      } else {
        // Set default in localStorage so it persists - disabled by default
        localStorage.setItem('kefas_coming_soon_enabled', JSON.stringify(false));
      }

      const storedComingSoonProducts = localStorage.getItem('kefas_coming_soon_products');
      if (storedComingSoonProducts !== null) {
        setComingSoonProductIds(JSON.parse(storedComingSoonProducts));
      } else {
        // Set default products in localStorage so it persists - empty by default
        const defaultComingSoonProducts: string[] = []; // No products in coming soon
        localStorage.setItem('kefas_coming_soon_products', JSON.stringify(defaultComingSoonProducts));
      }
      } catch (err) {
        console.error('Failed to parse storage data:', err);
      }
    };

    // Load initially
    loadStock();

    // Listen for custom event from admin panel
    const handleStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const stockData = customEvent.detail;
        setProducts(prevProducts => 
          prevProducts.map(p => ({
            ...p,
            inStock: stockData[p.id] !== undefined ? stockData[p.id] : p.inStock
          }))
        );
      }
    };

    const handleProductsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const allProducts = customEvent.detail as Product[];
        
        // Re-apply current stock and prices
        try {
          const storedStock = localStorage.getItem('kefas_stock_status');
          const storedPrices = localStorage.getItem('kefas_product_prices');
          const storedVariantPrices = localStorage.getItem('kefas_variant_prices');
          
          let stockData: Record<string, boolean> = {};
          let priceData: Record<string, number> = {};
          let variantPriceData: Record<string, Record<string, number>> = {};
          
          if (storedStock) stockData = JSON.parse(storedStock);
          if (storedPrices) priceData = JSON.parse(storedPrices);
          if (storedVariantPrices) variantPriceData = JSON.parse(storedVariantPrices);
          
          setProducts(
            allProducts.map(p => {
              const newPrice = priceData[p.id] !== undefined ? priceData[p.id] : p.price;
              let newVariants = p.variants;
              
              if (p.variants) {
                newVariants = p.variants.map(v => ({
                  ...v,
                  price: variantPriceData[p.id]?.[v.weight] !== undefined ? variantPriceData[p.id][v.weight] : v.price
                }));
              }
              
              return {
                ...p,
                inStock: stockData[p.id] !== undefined ? stockData[p.id] : p.inStock,
                price: newPrice,
                variants: newVariants
              };
            })
          );
        } catch (err) {
          console.error(err);
        }
      }
    };

    const handlePriceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { productPrices, variantPrices } = customEvent.detail;
        setProducts(prevProducts => 
          prevProducts.map(p => {
            const newPrice = productPrices?.[p.id] !== undefined ? productPrices[p.id] : p.price;
            
            let newVariants = p.variants;
            if (p.variants && variantPrices) {
              newVariants = p.variants.map(v => ({
                ...v,
                price: variantPrices[p.id]?.[v.weight] !== undefined ? variantPrices[p.id][v.weight] : v.price
              }));
            }
            
            return {
              ...p,
              price: newPrice,
              variants: newVariants
            };
          })
        );
      }
    };

    // Listen for storage event across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kefas_stock_status' && e.newValue) {
        try {
          const stockData = JSON.parse(e.newValue);
          setProducts(prevProducts => 
            prevProducts.map(p => ({
              ...p,
              inStock: stockData[p.id] !== undefined ? stockData[p.id] : p.inStock
            }))
          );
        } catch (err) {
          console.error('Failed to parse stock from storage event:', err);
        }
      }
      
      if (e.key === 'kefas_product_prices' || e.key === 'kefas_variant_prices') {
        try {
          const storedPrices = localStorage.getItem('kefas_product_prices');
          const storedVariantPrices = localStorage.getItem('kefas_variant_prices');
          
          let priceData: Record<string, number> = {};
          let variantPriceData: Record<string, Record<string, number>> = {};
          
          if (storedPrices) priceData = JSON.parse(storedPrices);
          if (storedVariantPrices) variantPriceData = JSON.parse(storedVariantPrices);
          
          setProducts(prevProducts => 
            prevProducts.map(p => {
              const newPrice = priceData[p.id] !== undefined ? priceData[p.id] : p.price;
              
              let newVariants = p.variants;
              if (p.variants) {
                newVariants = p.variants.map(v => ({
                  ...v,
                  price: variantPriceData[p.id]?.[v.weight] !== undefined ? variantPriceData[p.id][v.weight] : v.price
                }));
              }
              
              return {
                ...p,
                price: newPrice,
                variants: newVariants
              };
            })
          );
        } catch (err) {
          console.error('Failed to parse prices from storage event:', err);
        }
      }
    };

    const handleComingSoonUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { enabled, products: productIds } = customEvent.detail;
        setComingSoonEnabled(enabled);
        setComingSoonProductIds(productIds);
      }
    };

    window.addEventListener('kefas_stock_updated', handleStockUpdate);
    window.addEventListener('kefas_prices_updated', handlePriceUpdate);
    window.addEventListener('kefas_products_updated', handleProductsUpdate);
    window.addEventListener('kefas_coming_soon_updated', handleComingSoonUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('kefas_stock_updated', handleStockUpdate);
      window.removeEventListener('kefas_prices_updated', handlePriceUpdate);
      window.removeEventListener('kefas_products_updated', handleProductsUpdate);
      window.removeEventListener('kefas_coming_soon_updated', handleComingSoonUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Set favicon and document title
  useEffect(() => {
    // Set document title
    document.title = 'Kefas Foods - Premium Nigerian Food Imports';

    // Create favicon
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw background circle (green)
      ctx.fillStyle = '#1DB854';
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw 'K' letter in white
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('K', 32, 35);
      
      // Add orange accent dot
      ctx.fillStyle = '#FF9500';
      ctx.beginPath();
      ctx.arc(50, 14, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Convert to favicon
      const link = document.querySelector('link[rel~="icon"]') as HTMLLinkElement || document.createElement('link');
      link.rel = 'icon';
      link.href = canvas.toDataURL('image/png');
      
      if (!document.querySelector('link[rel~="icon"]')) {
        document.head.appendChild(link);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kefasFood_cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // Apply theme on mount and when changed
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Auto theme: Update every minute if auto is selected
  // Seasons theme: Update every hour to check for season changes
  useEffect(() => {
    if (currentTheme === 'auto') {
      const interval = setInterval(() => {
        applyTheme('auto');
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    } else if (currentTheme === 'seasons') {
      const interval = setInterval(() => {
        applyTheme('seasons');
      }, 3600000); // Check every hour
      
      return () => clearInterval(interval);
    }
  }, [currentTheme]);

  const handleThemeChange = (theme: ThemeOption) => {
    setCurrentTheme(theme);
  };

  // Scroll functions
  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBulkOrders = () => {
    bulkOrdersRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter products
  const filteredProducts = selectedCategory === 'All Products'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Add to cart - opens preview if has variants, otherwise adds directly
  const handleAddToCart = (product: Product) => {
    if (product.variants && product.variants.length > 1) {
      setPreviewProduct(product);
    } else {
      handleAddToCartWithDetails(product, product.weight, product.price);
    }
  };

  // Add to cart with specific variant
  const handleAddToCartWithDetails = (product: Product, weight: string, price: number) => {
    const itemKey = `${product.id}-${weight}`;
    const existingItem = cartItems.find(item => item.productId === product.id && item.weight === weight);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.productId === product.id && item.weight === weight
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Updated ${product.name} (${weight}) in cart`);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        price: price,
        weight: weight,
        quantity: 1,
        image: product.image,
        imageUrl: product.imageUrl // Include actual product image
      };
      setCartItems([...cartItems, newItem]);
      toast.success(`Added ${product.name} (${weight}) to cart`);
    }
  };

  // Update quantity
  const handleUpdateQuantity = (productId: string, weight: string, quantity: number) => {
    setCartItems(cartItems.map(item =>
      item.productId === productId && item.weight === weight
        ? { ...item, quantity }
        : item
    ));
  };

  // Remove from cart
  const handleRemoveItem = (productId: string, weight: string) => {
    const item = cartItems.find(i => i.productId === productId && i.weight === weight);
    setCartItems(cartItems.filter(item => !(item.productId === productId && item.weight === weight)));
    if (item) {
      toast.success(`Removed ${item.productName} from cart`);
    }
  };

  // Checkout via WhatsApp
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Generate unique Order ID
    const orderId = generateOrderId();
    const orderTimestamp = formatOrderTimestamp();

    // Build WhatsApp message with Order ID
    let message = '🛒 *New Order from Kefas Food Website*\\n\\n';
    message += `📋 *Order ID:* ${orderId}\\n`;
    message += `📅 *Date & Time:* ${orderTimestamp}\\n\\n`;
    message += '*Order Details:*\\n';
    message += '─────────────────\\n\\n';
    
    cartItems.forEach((item, index) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      message += `${index + 1}. *${item.productName}*\\n`;
      message += `   Size: ${item.weight}\\n`;
      message += `   Quantity: ${item.quantity}\\n`;
      message += `   Price: £${item.price.toFixed(2)} each\\n`;
      message += `   Subtotal: £${itemTotal}\\n\\n`;
    });

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    message += '─────────────────\\n';
    message += `*Total Amount: £${totalAmount.toFixed(2)}*\\n\\n`;
    message += 'Please confirm this order and provide delivery details.'

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/447480140217?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Show success message with Order ID
    toast.success(
      `Order ${orderId} created! Opening WhatsApp...`,
      { duration: 5000 }
    );
  };

  // Handle online payment
  const handlePayOnline = () => {
    if (cartItems.length === 0) return;
    
    // Generate order ID for payment
    const orderId = generateOrderId();
    setCurrentOrderId(orderId);
    
    // Close cart and open payment modal
    setCartOpen(false);
    setPaymentModalOpen(true);
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    // Clear cart
    setCartItems([]);
    setPaymentModalOpen(false);
    
    toast.success('Thank you for your order! We will contact you shortly with delivery details.');
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      <VisitorTracker />
      <Toaster position="top-center" />
      
      {/* Header */}
      <Header
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
      />

      {/* Hero Section */}
      <Hero onScrollToProducts={scrollToProducts} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Perfect For Section */}
      <PerfectForSection />

      {/* Category Filter */}
      <CategoryFilter
        categories={Array.from(new Set([...categories, ...products.map(p => p.category)]))}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Products Section */}
      <section ref={productsRef} className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {selectedCategory === 'All Products' ? 'All Products' : selectedCategory}
          </h2>
          <p className="text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isComingSoon = comingSoonEnabled && comingSoonProductIds.includes(product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                onViewDetails={setPreviewProduct}
                isComingSoon={isComingSoon}
              />
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </section>

      {/* Bulk Orders Section */}
      <div ref={bulkOrdersRef}>
        <BulkOrdersSection />
      </div>

      {/* Testimonials Section */}
      <div ref={reviewsRef}>
        <TestimonialsSection />
      </div>

      {/* About Section */}
      <div ref={aboutRef}>
        <AboutSection />
      </div>

      {/* Footer */}
      <Footer
        onScrollToProducts={scrollToProducts}
        onScrollToBulkOrders={scrollToBulkOrders}
        onScrollToAbout={scrollToAbout}
        onScrollToReviews={scrollToReviews}
      />

      {/* Cart Sheet */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onPayOnline={handlePayOnline}
      />

      {/* Product Preview Modal */}
      <ProductPreviewModal
        product={previewProduct}
        open={!!previewProduct}
        onClose={() => setPreviewProduct(null)}
        onAddToCart={handleAddToCartWithDetails}
      />

      {/* Payment Modal */}
      <StripePaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        cartItems={cartItems}
        totalAmount={cartTotal}
        orderId={currentOrderId}
        onPaymentSuccess={handlePaymentSuccess}
        customerEmail=""
        customerPhone=""
      />
    </div>
  );
}