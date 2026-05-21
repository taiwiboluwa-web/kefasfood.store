import React, { useState, useEffect } from 'react';
import { Eye, Package, ShoppingCart, DollarSign, RefreshCw, X, Plus, Upload, Image as ImageIcon, Trash2, Lock, AlertCircle, LockOpen, ArrowLeft, Download, Search, ChevronUp, ChevronDown, Moon, Sun, RotateCcw, Edit, CloudUpload } from 'lucide-react';
import { Link } from 'react-router';
import { products as staticProducts, Product, categories } from './data/products';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { syncFromSupabase, stockStatusSync, productPricesSync, comingSoonSync, productsSync, syncAllToSupabase } from '../lib/dataSync';
import { uploadProductImage, deleteProductImage, fileToBase64 } from '../lib/imageStorage';
import { diagnoseStorageIssues } from '../lib/fixSupabaseStorage';
import { clearOldCache } from './version';

interface VisitData {
  id: string;
  timestamp: number;
  date: string;
  userAgent: string;
  ip: string;
  path: string;
}

export function AdminVisits() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'visits' | 'inventory' | 'comingsoon'>('visits');
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockStatus, setStockStatus] = useState<Record<string, boolean>>({});
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});
  const [variantPrices, setVariantPrices] = useState<Record<string, Record<string, number>>>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [comingSoonEnabled, setComingSoonEnabled] = useState(false);
  const [comingSoonProducts, setComingSoonProducts] = useState<string[]>([]);
  const [showAddComingSoonModal, setShowAddComingSoonModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'Cassava/Tuber Flakes',
    price: undefined,
    weight: '',
    description: '',
    imageUrl: '',
    inStock: true
  });
  const [productVariants, setProductVariants] = useState<{ weight: string; price: number }[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'file'>('url');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check version and clear cache if needed
    clearOldCache();

    // Run storage diagnostics to check Supabase health
    diagnoseStorageIssues().catch(err => {
      console.error('Storage diagnostics failed:', err);
    });

    // Check if user has already authenticated in this session
    const auth = sessionStorage.getItem('kefas_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchVisits();
      fetchStock();
    }
  }, []);

  // Load theme preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('kefas_admin_theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Listen for real-time updates from storage events and custom events
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for custom events dispatched by this same admin panel
    const handleStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setStockStatus(customEvent.detail);
      }
    };

    const handlePriceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { productPrices, variantPrices } = customEvent.detail;
        if (productPrices) setProductPrices(productPrices);
        if (variantPrices) setVariantPrices(variantPrices);
      }
    };

    const handleProductsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setAllProducts(customEvent.detail);
      }
    };

    const handleComingSoonUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { enabled, products } = customEvent.detail;
        setComingSoonEnabled(enabled);
        setComingSoonProducts(products);
      }
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kefas_stock_status' && e.newValue) {
        setStockStatus(JSON.parse(e.newValue));
      }
      if (e.key === 'kefas_product_prices' && e.newValue) {
        setProductPrices(JSON.parse(e.newValue));
      }
      if (e.key === 'kefas_variant_prices' && e.newValue) {
        setVariantPrices(JSON.parse(e.newValue));
      }
      if (e.key === 'kefas_all_products' && e.newValue) {
        setAllProducts(JSON.parse(e.newValue));
      }
      if (e.key === 'kefas_coming_soon_enabled' && e.newValue) {
        setComingSoonEnabled(JSON.parse(e.newValue));
      }
      if (e.key === 'kefas_coming_soon_products' && e.newValue) {
        setComingSoonProducts(JSON.parse(e.newValue));
      }
      if (e.key === 'kefas_local_visits' && e.newValue) {
        const visits = JSON.parse(e.newValue);
        visits.sort((a: VisitData, b: VisitData) => b.timestamp - a.timestamp);
        setVisits(visits);
      }
    };

    window.addEventListener('kefas_stock_updated', handleStockUpdate);
    window.addEventListener('kefas_prices_updated', handlePriceUpdate);
    window.addEventListener('kefas_products_updated', handleProductsUpdate);
    window.addEventListener('kefas_coming_soon_updated', handleComingSoonUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Poll less frequently (30 seconds) as a fallback for edge cases
    const intervalId = setInterval(() => {
      fetchVisits(false);
      fetchStock(false);
    }, 30000);

    return () => {
      window.removeEventListener('kefas_stock_updated', handleStockUpdate);
      window.removeEventListener('kefas_prices_updated', handlePriceUpdate);
      window.removeEventListener('kefas_products_updated', handleProductsUpdate);
      window.removeEventListener('kefas_coming_soon_updated', handleComingSoonUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '@kefas_bhs2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('kefas_admin_auth', 'true');
      setLoginError('');
      fetchVisits();
      fetchStock();
    } else {
      setLoginError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kefas_admin_auth');
    setPassword('');
    setVisits([]);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('kefas_admin_theme', newTheme ? 'dark' : 'light');
  };

  const handleClearAllVisits = () => {
    try {
      localStorage.removeItem('kefas_local_visits');
      setVisits([]);
      setShowClearConfirm(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to clear visits:', err);
      setError('Failed to clear visit data');
    }
  };

  const fetchVisits = async (showLoading: boolean | React.MouseEvent = true) => {
    const shouldLoad = typeof showLoading === 'boolean' ? showLoading : true;
    if (shouldLoad) setLoading(true);
    setError(null);
    try {
      const storedVisits = localStorage.getItem('kefas_local_visits');
      const visits = storedVisits ? JSON.parse(storedVisits) : [];
      visits.sort((a: VisitData, b: VisitData) => b.timestamp - a.timestamp);
      setVisits(visits);
    } catch (err: any) {
      console.error('Failed to fetch visits from localStorage:', err);
      setVisits([]);
      setError(err.message || 'An unknown error occurred while fetching visits.');
    } finally {
      if (shouldLoad) setLoading(false);
    }
  };

  const fetchStock = async (showLoading: boolean | React.MouseEvent = true) => {
    const shouldLoad = typeof showLoading === 'boolean' ? showLoading : true;
    if (shouldLoad) setLoadingStock(true);
    try {
      // Sync from Supabase first to get latest data across all accounts
      await syncFromSupabase();

      // Load unified product list
      const storedProducts = localStorage.getItem('kefas_all_products');
      let loadedProducts: Product[] = [];
      
      if (storedProducts) {
        // Use existing product list from localStorage
        loadedProducts = JSON.parse(storedProducts);
      } else {
        // First time: Initialize with static products
        loadedProducts = [...staticProducts];
        localStorage.setItem('kefas_all_products', JSON.stringify(loadedProducts));
      }
      
      setAllProducts(loadedProducts);
      const allCurrentProducts = loadedProducts;

      // Fallback to localStorage for stock management
      const storedStock = localStorage.getItem('kefas_stock_status');
      if (storedStock) {
        setStockStatus(JSON.parse(storedStock));
      } else {
        // Initialize with default static products state
        const initialStock: Record<string, boolean> = {};
        allCurrentProducts.forEach(p => {
          initialStock[p.id] = p.inStock !== false;
        });
        setStockStatus(initialStock);
        localStorage.setItem('kefas_stock_status', JSON.stringify(initialStock));
      }

      // Load prices
      const storedPrices = localStorage.getItem('kefas_product_prices');
      if (storedPrices) {
        setProductPrices(JSON.parse(storedPrices));
      } else {
        const initialPrices: Record<string, number> = {};
        allCurrentProducts.forEach(p => {
          initialPrices[p.id] = p.price;
        });
        setProductPrices(initialPrices);
        localStorage.setItem('kefas_product_prices', JSON.stringify(initialPrices));
      }

      // Load variant prices
      const storedVariantPrices = localStorage.getItem('kefas_variant_prices');
      if (storedVariantPrices) {
        setVariantPrices(JSON.parse(storedVariantPrices));
      } else {
        const initialVariantPrices: Record<string, Record<string, number>> = {};
        allCurrentProducts.forEach(p => {
          if (p.variants) {
            initialVariantPrices[p.id] = {};
            p.variants.forEach(v => {
              initialVariantPrices[p.id][v.weight] = v.price;
            });
          }
        });
        setVariantPrices(initialVariantPrices);
        localStorage.setItem('kefas_variant_prices', JSON.stringify(initialVariantPrices));
      }

      // Load coming soon settings
      const storedComingSoonEnabled = localStorage.getItem('kefas_coming_soon_enabled');
      if (storedComingSoonEnabled) {
        setComingSoonEnabled(JSON.parse(storedComingSoonEnabled));
      } else {
        // Initialize with disabled state by default - all products available
        const defaultEnabled = false;
        setComingSoonEnabled(defaultEnabled);
        localStorage.setItem('kefas_coming_soon_enabled', JSON.stringify(defaultEnabled));
      }

      const storedComingSoonProducts = localStorage.getItem('kefas_coming_soon_products');
      let parsedComingSoon: string[] = [];

      if (storedComingSoonProducts) {
        parsedComingSoon = JSON.parse(storedComingSoonProducts);
      } else {
        // Initialize with empty array - no products in coming soon by default
        parsedComingSoon = [];
        localStorage.setItem('kefas_coming_soon_products', JSON.stringify(parsedComingSoon));
      }

      setComingSoonProducts(parsedComingSoon);
    } catch (err: any) {
      console.error('Failed to fetch from localStorage:', err);
    } finally {
      if (shouldLoad) setLoadingStock(false);
    }
  };

  const toggleStock = async (productId: string, currentStock: boolean) => {
    const newStatus = !currentStock;
    const newStockStatus = { ...stockStatus, [productId]: newStatus };
    const productName = allProducts.find(p => p.id === productId)?.name || 'Product';

    // Update state immediately for instant UI feedback
    setStockStatus(newStockStatus);

    try {
      localStorage.setItem('kefas_stock_status', JSON.stringify(newStockStatus));

      // Sync to Supabase for cross-account updates
      await stockStatusSync.save(newStockStatus);

      // Dispatch a custom event so the storefront components can update in real-time
      window.dispatchEvent(new CustomEvent('kefas_stock_updated', {
        detail: newStockStatus
      }));

      // Show success toast
      toast.success(`${productName} marked as ${newStatus ? 'In Stock' : 'Out of Stock'}`);
    } catch (err: any) {
      console.error('Error toggling stock:', err);
      // Revert on error
      setStockStatus(stockStatus);
      setError(`Failed to update stock for ${productName}`);
      toast.error(`Failed to update ${productName}`);
    }
  };

  const updatePrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;

    const productName = allProducts.find(p => p.id === productId)?.name || 'Product';
    const newPrices = { ...productPrices, [productId]: newPrice };

    // Update state immediately for instant UI feedback
    setProductPrices(newPrices);

    try {
      localStorage.setItem('kefas_product_prices', JSON.stringify(newPrices));

      // Sync to Supabase for cross-account updates
      await productPricesSync.save(newPrices, variantPrices);

      // Dispatch custom event for storefront
      window.dispatchEvent(new CustomEvent('kefas_prices_updated', {
        detail: {
          productPrices: newPrices,
          variantPrices
        }
      }));

      // Show success toast
      toast.success(`Price updated for ${productName}: £${newPrice.toFixed(2)}`);
    } catch (err: any) {
      console.error('Error updating price:', err);
      setProductPrices(productPrices);
      setError(`Failed to update price for ${productName}`);
      toast.error(`Failed to update price for ${productName}`);
    }
  };

  const updateVariantPrice = async (productId: string, weight: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;

    const product = allProducts.find(p => p.id === productId);
    const productName = product?.name || 'Product';

    const newVariantPrices = {
      ...variantPrices,
      [productId]: {
        ...(variantPrices[productId] || {}),
        [weight]: newPrice
      }
    };

    // Update state immediately for instant UI feedback
    setVariantPrices(newVariantPrices);

    // Also update base price if this variant matches the base weight
    let newProductPrices = { ...productPrices };
    if (product && product.weight === weight) {
      newProductPrices[productId] = newPrice;
      setProductPrices(newProductPrices);
      try {
        localStorage.setItem('kefas_product_prices', JSON.stringify(newProductPrices));
      } catch (err) {
        console.error(err);
      }
    }

    try {
      localStorage.setItem('kefas_variant_prices', JSON.stringify(newVariantPrices));

      // Sync to Supabase for cross-account updates
      await productPricesSync.save(newProductPrices, newVariantPrices);

      window.dispatchEvent(new CustomEvent('kefas_prices_updated', {
        detail: {
          productPrices: newProductPrices,
          variantPrices: newVariantPrices
        }
      }));

      // Show success toast
      toast.success(`Variant price updated for ${productName} (${weight}): £${newPrice.toFixed(2)}`);
    } catch (err: any) {
      console.error('Error updating variant price:', err);
      setVariantPrices(variantPrices);
      setError(`Failed to update variant price for ${productName}`);
      toast.error(`Failed to update variant price for ${productName}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    // Remove from unified products list
    const updatedProducts = allProducts.filter(p => p.id !== productId);
    setAllProducts(updatedProducts);

    // Update localStorage
    try {
      localStorage.setItem('kefas_all_products', JSON.stringify(updatedProducts));

      // Sync to Supabase for cross-account updates
      await productsSync.save(updatedProducts);
      
      // Also remove from stock status and prices
      const newStockStatus = { ...stockStatus };
      delete newStockStatus[productId];
      setStockStatus(newStockStatus);
      localStorage.setItem('kefas_stock_status', JSON.stringify(newStockStatus));
      
      const newProductPrices = { ...productPrices };
      delete newProductPrices[productId];
      setProductPrices(newProductPrices);
      localStorage.setItem('kefas_product_prices', JSON.stringify(newProductPrices));
      
      const newVariantPrices = { ...variantPrices };
      delete newVariantPrices[productId];
      setVariantPrices(newVariantPrices);
      localStorage.setItem('kefas_variant_prices', JSON.stringify(newVariantPrices));
      
      // Dispatch events for storefront
      window.dispatchEvent(new CustomEvent('kefas_products_updated', { detail: updatedProducts }));
      window.dispatchEvent(new Event('kefas_inventory_updated'));
      
      toast.success(`Deleted "${product.name}"`);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      toast.error('Failed to delete product');
    }
  };

  const handleMoveProduct = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = allProducts.findIndex(p => p.id === productId);
    
    if (currentIndex === -1) {
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check bounds
    if (newIndex < 0 || newIndex >= allProducts.length) {
      return;
    }
    
    // Swap positions
    const updatedProducts = [...allProducts];
    [updatedProducts[currentIndex], updatedProducts[newIndex]] = 
      [updatedProducts[newIndex], updatedProducts[currentIndex]];
    
    setAllProducts(updatedProducts);

    try {
      localStorage.setItem('kefas_all_products', JSON.stringify(updatedProducts));

      // Sync to Supabase for cross-account updates
      await productsSync.save(updatedProducts);

      window.dispatchEvent(new CustomEvent('kefas_products_updated', { detail: updatedProducts }));
      window.dispatchEvent(new Event('kefas_inventory_updated'));
      toast.success(`Moved ${direction}`);
    } catch (err: any) {
      console.error('Error moving product:', err);
      setAllProducts(allProducts); // Revert
      toast.error('Failed to move product');
    }
  };

  const toggleComingSoonEnabled = async () => {
    const newEnabled = !comingSoonEnabled;
    setComingSoonEnabled(newEnabled);

    try {
      localStorage.setItem('kefas_coming_soon_enabled', JSON.stringify(newEnabled));

      // Sync to Supabase for cross-account updates
      await comingSoonSync.save(newEnabled, comingSoonProducts);

      window.dispatchEvent(new CustomEvent('kefas_coming_soon_updated', {
        detail: { enabled: newEnabled, products: comingSoonProducts }
      }));
      toast.success(newEnabled ? 'Coming Soon section enabled' : 'Coming Soon section disabled');
    } catch (err: any) {
      console.error('Error toggling coming soon:', err);
      setComingSoonEnabled(!newEnabled);
      toast.error('Failed to toggle Coming Soon section');
    }
  };

  const handleAddToComingSoon = async (productId: string) => {
    if (comingSoonProducts.includes(productId)) {
      toast.error('Product already in Coming Soon');
      return;
    }

    const updatedComingSoon = [...comingSoonProducts, productId];
    setComingSoonProducts(updatedComingSoon);

    try {
      localStorage.setItem('kefas_coming_soon_products', JSON.stringify(updatedComingSoon));

      // Sync to Supabase for cross-account updates
      await comingSoonSync.save(comingSoonEnabled, updatedComingSoon);

      window.dispatchEvent(new CustomEvent('kefas_coming_soon_updated', {
        detail: { enabled: comingSoonEnabled, products: updatedComingSoon }
      }));
      toast.success('Added to Coming Soon');
      setShowAddComingSoonModal(false);
    } catch (err: any) {
      console.error('Error adding to coming soon:', err);
      setComingSoonProducts(comingSoonProducts);
      toast.error('Failed to add to Coming Soon');
    }
  };

  const handleRemoveFromComingSoon = async (productId: string) => {
    const updatedComingSoon = comingSoonProducts.filter(id => id !== productId);
    setComingSoonProducts(updatedComingSoon);

    try {
      localStorage.setItem('kefas_coming_soon_products', JSON.stringify(updatedComingSoon));

      // Sync to Supabase for cross-account updates
      await comingSoonSync.save(comingSoonEnabled, updatedComingSoon);

      window.dispatchEvent(new CustomEvent('kefas_coming_soon_updated', {
        detail: { enabled: comingSoonEnabled, products: updatedComingSoon }
      }));
      toast.success('Removed from Coming Soon');
    } catch (err: any) {
      console.error('Error removing from coming soon:', err);
      setComingSoonProducts(comingSoonProducts);
      toast.error('Failed to remove from Coming Soon');
    }
  };

  const handleResetComingSoonDefaults = async () => {
    // Reset to default: disabled with no products
    const defaultProducts: string[] = [];

    setComingSoonProducts(defaultProducts);
    setComingSoonEnabled(false);

    try {
      localStorage.setItem('kefas_coming_soon_products', JSON.stringify(defaultProducts));
      localStorage.setItem('kefas_coming_soon_enabled', JSON.stringify(false));

      // Sync to Supabase for cross-account updates
      await comingSoonSync.save(false, defaultProducts);

      window.dispatchEvent(new CustomEvent('kefas_coming_soon_updated', {
        detail: { enabled: false, products: defaultProducts }
      }));
      toast.success('Coming Soon section reset to defaults (disabled, all products available)');
    } catch (err: any) {
      console.error('Error resetting coming soon:', err);
      toast.error('Failed to reset Coming Soon section');
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      console.log('🔄 Starting manual sync to Supabase...');
      
      // First sync TO Supabase (push all local data to cloud)
      await syncAllToSupabase();
      
      // Then sync FROM Supabase (pull latest data from cloud)
      await syncFromSupabase();
      
      // Reload the stock data to reflect any changes
      await fetchStock(false);
      
      console.log('✅ Manual sync completed successfully');
      toast.success('✅ Synced to Supabase successfully!');
    } catch (err: any) {
      console.error('❌ Manual sync failed:', err);
      toast.error('Failed to sync with Supabase');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloseAddProductModal = () => {
    setShowAddProductModal(false);
    setNewProductForm({
      name: '',
      category: 'Cassava/Tuber Flakes',
      price: undefined,
      weight: '',
      description: '',
      imageUrl: '',
      inStock: true
    });
    setProductVariants([]);
    setImagePreview('');
    setImageUploadMethod('url');
    setError(null);
  };

  const handleOpenEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setNewProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      weight: product.weight,
      description: product.description,
      imageUrl: product.imageUrl,
      inStock: product.inStock
    });

    // Set variants (excluding the base variant)
    if (product.variants && product.variants.length > 1) {
      const otherVariants = product.variants.filter(v => v.weight !== product.weight);
      setProductVariants(otherVariants);
    } else {
      setProductVariants([]);
    }

    setImagePreview(product.imageUrl || '');
    setShowEditProductModal(true);
  };

  const handleCloseEditProductModal = () => {
    setShowEditProductModal(false);
    setEditingProduct(null);
    setNewProductForm({
      name: '',
      category: 'Cassava/Tuber Flakes',
      price: undefined,
      weight: '',
      description: '',
      imageUrl: '',
      inStock: true
    });
    setProductVariants([]);
    setImagePreview('');
    setImageUploadMethod('url');
    setError(null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== ADD PRODUCT FORM SUBMITTED ===');
    console.log('Form data:', newProductForm);
    console.log('Product variants:', productVariants);
    
    // Clear previous errors
    setError(null);
    
    // Validate required fields
    if (!newProductForm.name?.trim()) {
      console.log('Validation failed: name is missing');
      setError('Product name is required');
      toast.error('Product name is required');
      return;
    }
    
    if (!newProductForm.price || isNaN(newProductForm.price) || newProductForm.price <= 0) {
      console.log('Validation failed: price is invalid', newProductForm.price);
      setError('Valid price is required');
      toast.error('Please enter a valid price');
      return;
    }
    
    if (!newProductForm.weight?.trim()) {
      console.log('Validation failed: weight is missing');
      setError('Weight/Size is required');
      toast.error('Weight/Size is required');
      return;
    }
    
    console.log('Validation passed!');

    // Prepare variants array - include base size + additional variants
    const allVariants = [
      { weight: newProductForm.weight, price: Number(newProductForm.price) },
      ...productVariants.filter(v => v.weight && v.price > 0)
    ];

    const newProduct: Product = {
      id: `custom_${Date.now()}`,
      name: newProductForm.name,
      category: newProductForm.category || 'Cassava/Tuber Flakes',
      price: Number(newProductForm.price),
      weight: newProductForm.weight,
      description: newProductForm.description || '',
      image: newProductForm.name.toLowerCase().replace(/\s+/g, '-'),
      imageUrl: newProductForm.imageUrl,
      inStock: newProductForm.inStock !== false,
      variants: allVariants.length > 1 ? allVariants : []
    };

    // Find the position to insert - at the end of the category section
    const categoryProducts = allProducts.filter(p => p.category === newProduct.category);
    let insertIndex = allProducts.length; // Default to end
    
    if (categoryProducts.length > 0) {
      // Find the last product in this category
      const lastCategoryProduct = categoryProducts[categoryProducts.length - 1];
      insertIndex = allProducts.findIndex(p => p.id === lastCategoryProduct.id) + 1;
    }
    
    // Insert product at the correct position
    const updatedProducts = [...allProducts];
    updatedProducts.splice(insertIndex, 0, newProduct);
    setAllProducts(updatedProducts);
    
    const newStockStatus = { ...stockStatus, [newProduct.id]: newProduct.inStock };
    const newPrices = { ...productPrices, [newProduct.id]: newProduct.price };
    
    // Also add variant prices if they exist
    const newVariantPrices = { ...variantPrices };
    if (allVariants.length > 1) {
      newVariantPrices[newProduct.id] = {};
      allVariants.forEach(variant => {
        newVariantPrices[newProduct.id][variant.weight] = variant.price;
      });
    }
    
    setStockStatus(newStockStatus);
    setProductPrices(newPrices);
    setVariantPrices(newVariantPrices);

    try {
      console.log('Adding new product:', newProduct);
      console.log('Variant prices:', newVariantPrices);

      localStorage.setItem('kefas_all_products', JSON.stringify(updatedProducts));
      localStorage.setItem('kefas_stock_status', JSON.stringify(newStockStatus));
      localStorage.setItem('kefas_product_prices', JSON.stringify(newPrices));
      localStorage.setItem('kefas_variant_prices', JSON.stringify(newVariantPrices));

      // Sync to Supabase for cross-account updates
      await Promise.all([
        productsSync.save(updatedProducts),
        stockStatusSync.save(newStockStatus),
        productPricesSync.save(newPrices, newVariantPrices)
      ]);

      window.dispatchEvent(new CustomEvent('kefas_products_updated', { detail: updatedProducts }));
      window.dispatchEvent(new CustomEvent('kefas_stock_updated', { detail: newStockStatus }));
      window.dispatchEvent(new CustomEvent('kefas_prices_updated', {
        detail: {
          productPrices: newPrices,
          variantPrices: newVariantPrices
        }
      }));

      console.log('Product added successfully, closing modal');
      handleCloseAddProductModal();
      toast.success(`Product "${newProduct.name}" added successfully!`);
    } catch (err: any) {
      console.error('Error adding new product:', err);

      // Check if it's a quota exceeded error
      if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
        setError('Storage quota exceeded. Please use image URLs instead of uploading files, or delete some products to free up space.');
        toast.error('Storage full! Use image URLs instead of file uploads.');
      } else {
        setError('Failed to add new product');
        toast.error('Failed to add product');
      }

      setAllProducts(allProducts);
      setStockStatus(stockStatus);
      setProductPrices(productPrices);
      setVariantPrices(variantPrices);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    console.log('=== EDIT PRODUCT FORM SUBMITTED ===');
    console.log('Form data:', newProductForm);
    console.log('Product variants:', productVariants);

    // Clear previous errors
    setError(null);

    // Validate required fields
    if (!newProductForm.name?.trim()) {
      setError('Product name is required');
      toast.error('Product name is required');
      return;
    }

    if (!newProductForm.price || isNaN(newProductForm.price) || newProductForm.price <= 0) {
      setError('Valid price is required');
      toast.error('Please enter a valid price');
      return;
    }

    if (!newProductForm.weight?.trim()) {
      setError('Weight/Size is required');
      toast.error('Weight/Size is required');
      return;
    }

    // Prepare variants array
    const allVariants = [
      { weight: newProductForm.weight, price: Number(newProductForm.price) },
      ...productVariants.filter(v => v.weight && v.price > 0)
    ];

    const updatedProduct: Product = {
      ...editingProduct,
      name: newProductForm.name,
      category: newProductForm.category || editingProduct.category,
      price: Number(newProductForm.price),
      weight: newProductForm.weight,
      description: newProductForm.description || '',
      imageUrl: newProductForm.imageUrl,
      inStock: newProductForm.inStock !== false,
      variants: allVariants.length > 1 ? allVariants : []
    };

    // Update in products array
    const updatedProducts = allProducts.map(p =>
      p.id === editingProduct.id ? updatedProduct : p
    );

    setAllProducts(updatedProducts);

    const newStockStatus = { ...stockStatus, [editingProduct.id]: updatedProduct.inStock };
    const newPrices = { ...productPrices, [editingProduct.id]: updatedProduct.price };

    // Update variant prices
    const newVariantPrices = { ...variantPrices };
    if (allVariants.length > 1) {
      newVariantPrices[editingProduct.id] = {};
      allVariants.forEach(variant => {
        newVariantPrices[editingProduct.id][variant.weight] = variant.price;
      });
    } else {
      // Remove variant prices if product no longer has variants
      delete newVariantPrices[editingProduct.id];
    }

    setStockStatus(newStockStatus);
    setProductPrices(newPrices);
    setVariantPrices(newVariantPrices);

    try {
      console.log('Updating product:', updatedProduct);

      localStorage.setItem('kefas_all_products', JSON.stringify(updatedProducts));
      localStorage.setItem('kefas_stock_status', JSON.stringify(newStockStatus));
      localStorage.setItem('kefas_product_prices', JSON.stringify(newPrices));
      localStorage.setItem('kefas_variant_prices', JSON.stringify(newVariantPrices));

      // Sync to Supabase
      await Promise.all([
        productsSync.save(updatedProducts),
        stockStatusSync.save(newStockStatus),
        productPricesSync.save(newPrices, newVariantPrices)
      ]);

      window.dispatchEvent(new CustomEvent('kefas_products_updated', { detail: updatedProducts }));
      window.dispatchEvent(new CustomEvent('kefas_stock_updated', { detail: newStockStatus }));
      window.dispatchEvent(new CustomEvent('kefas_prices_updated', {
        detail: {
          productPrices: newPrices,
          variantPrices: newVariantPrices
        }
      }));

      console.log('Product updated successfully, closing modal');
      handleCloseEditProductModal();
      toast.success(`Product "${updatedProduct.name}" updated successfully!`);
    } catch (err: any) {
      console.error('Error updating product:', err);

      if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
        setError('Storage quota exceeded. Please use image URLs instead of uploading files.');
        toast.error('Storage full! Use image URLs instead.');
      } else {
        setError('Failed to update product');
        toast.error('Failed to update product');
      }

      setAllProducts(allProducts);
      setStockStatus(stockStatus);
      setProductPrices(productPrices);
      setVariantPrices(variantPrices);
    }
  };

  const handleDownloadCSV = () => {
    if (visits.length === 0) return;
    
    const headers = ['Date & Time', 'IP Address', 'Path', 'User Agent'];
    const csvContent = [
      headers.join(','),
      ...visits.map(v => {
        const date = new Date(v.timestamp).toLocaleString();
        return `"${date}","${v.ip}","${v.path}","${v.userAgent.replace(/"/g, '""')}"`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kefas-visitors-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#1DB854]/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#1DB854]" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Admin Access</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mt-2 text-sm">
              Please enter the admin password to view the live visitor spreadsheet.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-[#1DB854] focus:border-[#1DB854] outline-none transition-all dark:text-white"
                placeholder="Enter password"
                autoFocus
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {loginError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#1DB854] hover:bg-[#199d47] text-white font-medium py-2.5 rounded-lg transition-colors focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              Unlock Spreadsheet
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-[#1DB854] hover:underline inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Return to website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Link to="/" className="inline-flex items-center text-sm font-medium text-[#1DB854] hover:underline mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to site
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
              Live Visitor Spreadsheet
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Track when people visit your website.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md p-1 mr-2 shadow-sm">
              <button
                onClick={() => setActiveTab('visits')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === 'visits' 
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
              >
                Visitors
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === 'inventory' 
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
              >
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-1.5" />
                  Inventory
                </span>
              </button>
              <button
                onClick={() => setActiveTab('comingsoon')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === 'comingsoon' 
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                }`}
              >
                <span className="flex items-center">
                  Coming Soon
                </span>
              </button>
            </div>
            
            {/* Storage Diagnostic Button */}
            <button
              onClick={async () => {
                toast.info('🔍 Running storage diagnostics... Check console (F12)');
                const result = await diagnoseStorageIssues();
                if (result) {
                  toast.success('✅ Supabase Storage is working!');
                } else {
                  toast.error('❌ Storage issues found. Check console for fix instructions.');
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none transition-colors"
              title="Test Supabase Storage (Check if image uploads will work)"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-[#1DB854]" />
              Test Storage
            </button>

            {/* Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center px-4 py-2 bg-[#1DB854] border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#199d47] focus:outline-none disabled:opacity-50 disabled:bg-[#1DB854]/70 transition-colors"
              title="Sync all data to Supabase cloud database"
            >
              <CloudUpload className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none transition-colors"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2 text-zinc-400" />
                  Dark
                </>
              )}
            </button>
            
            <button 
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none"
            >
              <LockOpen className="w-4 h-4 mr-2 text-zinc-400" />
              Lock
            </button>
            {activeTab === 'visits' && (
              <>
                <button 
                  onClick={fetchVisits}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  disabled={loading || visits.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-[#1DB854] border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#199d47] focus:outline-none disabled:opacity-50 disabled:bg-[#1DB854]/70"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={loading || visits.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-red-500 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-600 focus:outline-none disabled:opacity-50 disabled:bg-red-500/70"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {activeTab === 'visits' ? (
          <>
            {/* Info Banner */}
            <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong className="font-semibold">Visit data persists permanently:</strong> All visits are stored locally and will remain even after exporting to CSV. Use the "Clear All" button if you need to reset the data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Path
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                        IP Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                        Device Info (User Agent)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {loading && visits.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                          <div className="flex flex-col items-center justify-center">
                            <RefreshCw className="w-8 h-8 animate-spin text-zinc-300 dark:text-zinc-700 mb-4" />
                            Loading visitor data...
                          </div>
                        </td>
                      </tr>
                    ) : visits.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                          No visitors recorded yet. The spreadsheet will automatically update as people visit.
                        </td>
                      </tr>
                    ) : (
                      visits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {new Date(visit.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">
                              {visit.path || '/'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                            {visit.ip !== 'Unknown IP' ? visit.ip : 'Hidden'}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 hidden md:table-cell max-w-[200px] truncate" title={visit.userAgent}>
                            {visit.userAgent}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-zinc-50 dark:bg-zinc-950/50 px-6 py-3 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>Showing {visits.length} total visits</span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#1DB854] mr-2 animate-pulse"></span>
                    Live tracking active
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : activeTab === 'inventory' ? (
          <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-auto">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Product Inventory</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your product catalog, prices, and stock status.</p>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#1DB854] focus:border-[#1DB854] sm:text-sm"
                    placeholder="Search products..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    console.log('Opening Add Product modal');
                    setShowAddProductModal(true);
                  }}
                  className="flex-shrink-0 bg-[#1DB854] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#1ed760] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DB854] flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Price / Sizes
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.category.toLowerCase().includes(inventorySearch.toLowerCase()))
                    .map((product, index, filteredArray) => {
                      const isProductInStock = stockStatus[product.id] !== undefined ? stockStatus[product.id] : product.inStock;
                      const productIndex = allProducts.findIndex(p => p.id === product.id);
                      
                      return (
                        <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex items-center justify-center">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-zinc-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.name}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">{product.weight}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {product.variants && product.variants.length > 0 ? (
                              <div className="space-y-3">
                                {product.variants.map(v => (
                                  <div key={v.weight} className="flex items-center justify-between gap-4">
                                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-16 truncate" title={v.weight}>
                                      {v.weight}
                                    </span>
                                    <div className="flex items-center">
                                      <span className="mr-1 text-zinc-500">£</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        key={`variant-${product.id}-${v.weight}-${variantPrices[product.id]?.[v.weight] || v.price}`}
                                        className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#1DB854] outline-none"
                                        defaultValue={variantPrices[product.id]?.[v.weight] !== undefined ? variantPrices[product.id][v.weight] : v.price}
                                        onBlur={(e) => {
                                          const newPrice = parseFloat(e.target.value);
                                          if (!isNaN(newPrice) && newPrice >= 0) {
                                            updateVariantPrice(product.id, v.weight, newPrice);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const newPrice = parseFloat(e.currentTarget.value);
                                            if (!isNaN(newPrice) && newPrice >= 0) {
                                              updateVariantPrice(product.id, v.weight, newPrice);
                                            }
                                            e.currentTarget.blur();
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="mr-1 text-zinc-500">£</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  key={`price-${product.id}-${productPrices[product.id] || product.price}`}
                                  className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#1DB854] outline-none"
                                  defaultValue={productPrices[product.id] !== undefined ? productPrices[product.id] : product.price}
                                  onBlur={(e) => {
                                    const newPrice = parseFloat(e.target.value);
                                    if (!isNaN(newPrice) && newPrice >= 0) {
                                      updatePrice(product.id, newPrice);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newPrice = parseFloat(e.currentTarget.value);
                                      if (!isNaN(newPrice) && newPrice >= 0) {
                                        updatePrice(product.id, newPrice);
                                      }
                                      e.currentTarget.blur();
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => toggleStock(product.id, isProductInStock)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                                isProductInStock ? 'bg-[#1DB854]' : 'bg-zinc-200 dark:bg-zinc-700'
                              }`}
                              role="switch"
                              aria-checked={isProductInStock}
                            >
                              <span className="sr-only">Use setting</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isProductInStock ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className={`ml-3 inline-block align-middle text-sm ${isProductInStock ? 'text-[#1DB854]' : 'text-zinc-500 dark:text-zinc-400'}`}>
                              {isProductInStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditProductModal(product)}
                                className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                title="Edit product"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {/* Move Up Button */}
                              <button
                                onClick={() => handleMoveProduct(product.id, 'up')}
                                disabled={productIndex === 0}
                                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              
                              {/* Move Down Button */}
                              <button
                                onClick={() => handleMoveProduct(product.id, 'down')}
                                disabled={productIndex === allProducts.length - 1}
                                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                                title="Delete product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
              {allProducts.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.category.toLowerCase().includes(inventorySearch.toLowerCase())).length === 0 && (
                <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No products found matching "{inventorySearch}"
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'comingsoon' ? (
          <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-auto">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Coming Soon Products</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Manage products to display in the Coming Soon section on your website.
                  {allProducts.length > 0 
                    ? ` (${comingSoonProducts.length} of ${allProducts.length} products in Coming Soon)` 
                    : ' Loading products...'
                  }
                </p>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleComingSoonEnabled}
                    className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                      comingSoonEnabled ? 'bg-[#1DB854]' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                    role="switch"
                    aria-checked={comingSoonEnabled}
                    title={comingSoonEnabled ? 'Disable Coming Soon section' : 'Enable Coming Soon section'}
                  >
                    <span className="sr-only">Toggle Coming Soon section</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        comingSoonEnabled ? 'translate-x-8' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${comingSoonEnabled ? 'text-[#1DB854]' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {comingSoonEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <button
                  onClick={handleResetComingSoonDefaults}
                  className="flex-shrink-0 bg-orange-500 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center gap-2"
                  title="Reset to default products (Prawns & Banga Spice)"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Defaults
                </button>
                <button
                  onClick={() => setShowAddComingSoonModal(true)}
                  disabled={!comingSoonEnabled}
                  className="flex-shrink-0 bg-[#1DB854] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#1ed760] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DB854] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {comingSoonProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No products in Coming Soon section yet.
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {comingSoonEnabled ? 'Click "Add Product" to get started.' : 'Enable Coming Soon section to add products.'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                    {comingSoonProducts.map(productId => {
                      const product = allProducts.find(p => p.id === productId);
                      if (!product) return null;

                      return (
                        <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex items-center justify-center">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-zinc-400" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.name}</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">{product.weight}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleRemoveFromComingSoon(product.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Add to Coming Soon Modal */}
      {showAddComingSoonModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowAddComingSoonModal(false)}
            />
            
            <div className="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-zinc-200 dark:border-zinc-800">
              <div className="bg-white dark:bg-zinc-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Add Product to Coming Soon
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      Total products: {allProducts.length} | Available: {allProducts.filter(p => !comingSoonProducts.includes(p.id)).length}
                    </p>
                    
                    <div className="mt-2 max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {allProducts.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                              No products loaded yet.
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              Go to Inventory tab first to see your products.
                            </p>
                          </div>
                        ) : (
                          <>
                            {allProducts
                              .filter(p => !comingSoonProducts.includes(p.id))
                              .map(product => (
                                <button
                                  key={product.id}
                                  onClick={() => handleAddToComingSoon(product.id)}
                                  className="w-full flex items-center p-3 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                                >
                                  <div className="h-10 w-10 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden flex items-center justify-center">
                                    {product.imageUrl ? (
                                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <Package className="h-5 w-5 text-zinc-400" />
                                    )}
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.name}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{product.category}</div>
                                  </div>
                                  <Plus className="h-5 w-5 text-[#1DB854]" />
                                </button>
                              ))}
                            {allProducts.filter(p => !comingSoonProducts.includes(p.id)).length === 0 && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                                All products are already in Coming Soon
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddComingSoonModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-zinc-300 dark:border-zinc-700 shadow-sm px-4 py-2 bg-white dark:bg-zinc-800 text-base font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DB854] sm:w-auto sm:text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
              aria-hidden="true"
              onClick={handleCloseAddProductModal}
            />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="relative inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-zinc-200 z-[101]">
              <div className="light-mode-force">
              <form onSubmit={handleAddProduct}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#1DB854]/10 sm:mx-0 sm:h-10 sm:w-10">
                      <Package className="h-6 w-6 text-[#1DB854]" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-zinc-900" id="modal-title">
                        Add New Product
                      </h3>
                      
                      {/* Error Display */}
                      {error && (
                        <div className="mt-3 rounded-md bg-red-50 p-3 border border-red-200">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Product Name */}
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="e.g., Garri Ijebu"
                            className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                            value={newProductForm.name}
                            onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                          />
                        </div>
                        
                        {/* Category Dropdown & Base Price */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="category"
                              id="category"
                              required
                              className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                              value={newProductForm.category}
                              onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                            >
                              {categories.filter(c => c !== 'All Products').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Base Price (£) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="price"
                              id="price"
                              min="0"
                              step="0.01"
                              required
                              placeholder="0.00"
                              className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                              value={newProductForm.price || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setNewProductForm({
                                  ...newProductForm, 
                                  price: value === '' ? undefined : parseFloat(value)
                                });
                              }}
                            />
                          </div>
                        </div>

                        {/* Base Weight/Size */}
                        <div>
                          <label htmlFor="weight" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Base Weight/Size <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="weight"
                            id="weight"
                            required
                            placeholder="e.g., 2kg, 500g, 1L"
                            className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                            value={newProductForm.weight}
                            onChange={(e) => setNewProductForm({...newProductForm, weight: e.target.value})}
                          />
                        </div>

                        {/* Additional Size Variants */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Additional Sizes (Optional)
                            </label>
                            <button
                              type="button"
                              onClick={() => setProductVariants([...productVariants, { weight: '', price: 0 }])}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#1DB854] hover:text-[#1ed760] transition-colors"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Size
                            </button>
                          </div>
                          {productVariants.length > 0 && (
                            <div className="space-y-2">
                              {productVariants.map((variant, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="e.g., 5kg"
                                    className="flex-1 block rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1.5 border"
                                    value={variant.weight}
                                    onChange={(e) => {
                                      const newVariants = [...productVariants];
                                      newVariants[index].weight = e.target.value;
                                      setProductVariants(newVariants);
                                    }}
                                  />
                                  <div className="flex items-center flex-1">
                                    <span className="text-xs text-zinc-500 mr-1">£</span>
                                    <input
                                      type="number"
                                      placeholder="0.00"
                                      min="0"
                                      step="0.01"
                                      className="w-full block rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-1.5 border"
                                      value={variant.price || ''}
                                      onChange={(e) => {
                                        const newVariants = [...productVariants];
                                        newVariants[index].price = parseFloat(e.target.value);
                                        setProductVariants(newVariants);
                                      }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVariants = productVariants.filter((_, i) => i !== index);
                                      setProductVariants(newVariants);
                                    }}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Image Upload Section */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Product Image
                          </label>

                          {/* Image Upload Method Tabs */}
                          <div className="flex gap-2 mb-3">
                            <button
                              type="button"
                              onClick={() => setImageUploadMethod('url')}
                              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                imageUploadMethod === 'url'
                                  ? 'bg-[#1DB854] text-white shadow-md'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                              }`}
                            >
                              📎 Image URL
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageUploadMethod('file')}
                              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                imageUploadMethod === 'file'
                                  ? 'bg-[#1DB854] text-white shadow-md'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                              }`}
                            >
                              📤 Upload File
                            </button>
                          </div>

                          {/* URL Input */}
                          {imageUploadMethod === 'url' && (
                            <div>
                              <input
                                type="url"
                                name="imageUrl"
                                id="imageUrl"
                                placeholder="https://i.imgur.com/example.jpg"
                                className="block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                                value={newProductForm.imageUrl || ''}
                                onChange={(e) => {
                                  setNewProductForm({...newProductForm, imageUrl: e.target.value});
                                  setImagePreview(e.target.value);
                                }}
                              />
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                💡 Free hosting: <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-[#1DB854] hover:underline font-medium">Imgur</a> · <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-[#1DB854] hover:underline font-medium">ImgBB</a>
                              </p>
                            </div>
                          )}

                          {/* File Upload */}
                          {imageUploadMethod === 'file' && (
                            <div>
                              <div className="border-2 border-dashed border-[#1DB854] dark:border-[#1DB854] rounded-lg p-6 text-center hover:bg-[#1DB854]/5 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*,image/webp,image/svg+xml,image/bmp,image/tiff,image/heic,image/heif"
                                  id="imageFile"
                                  className="hidden"
                                  disabled={isUploadingImage}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      console.log('📁 File selected:', file.name, file.size, 'bytes', file.type);

                                      // Check file size
                                      if (file.size > 10485760) {
                                        toast.error('File too large! Maximum size is 10MB');
                                        return;
                                      }

                                      setIsUploadingImage(true);
                                      try {
                                        // Show preview immediately
                                        const preview = await fileToBase64(file);
                                        setImagePreview(preview);

                                        // Upload to Supabase Storage
                                        const productId = newProductForm.name?.toLowerCase().replace(/\s+/g, '-') || `product-${Date.now()}`;
                                        console.log('🚀 Uploading as productId:', productId);
                                        const imageUrl = await uploadProductImage(file, productId);

                                        if (imageUrl) {
                                          setNewProductForm({...newProductForm, imageUrl});
                                          if (imageUrl.startsWith('data:')) {
                                            toast.success('✅ Image saved locally (using fallback storage)');
                                          } else {
                                            toast.success('✅ Image uploaded to Supabase Storage!');
                                          }
                                          console.log('✅ Upload complete:', imageUrl);
                                        } else {
                                          toast.error('Upload failed. Please use an image URL instead (Imgur or ImgBB recommended)');
                                          setImagePreview('');
                                        }
                                      } catch (err) {
                                        console.error('❌ Image upload error:', err);
                                        toast.error('Upload error. Please try again or use image URL.');
                                        setImagePreview('');
                                      } finally {
                                        setIsUploadingImage(false);
                                        // Reset file input so same file can be selected again
                                        const input = document.getElementById('imageFile') as HTMLInputElement;
                                        if (input) input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <label htmlFor="imageFile" className={`cursor-pointer block ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  {isUploadingImage ? (
                                    <>
                                      <RefreshCw className="w-12 h-12 mx-auto text-[#1DB854] mb-3 animate-spin" />
                                      <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium">
                                        Uploading to Supabase Storage...
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                        Please wait...
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-12 h-12 mx-auto text-[#1DB854] mb-3" />
                                      <p className="text-base text-zinc-900 dark:text-zinc-100 font-medium mb-1">
                                        Click here to select an image
                                      </p>
                                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        or drag and drop
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                                        Any image format • 10MB max per file
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                        PNG, JPG, GIF, WebP, SVG, BMP, TIFF, HEIC, etc.
                                      </p>
                                      <p className="text-xs text-[#1DB854] mt-1 font-medium">
                                        ✨ Supabase Storage = Unlimited space for all images!
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                        💾 localStorage backup for small images (browser has ~5MB total limit)
                                      </p>
                                    </>
                                  )}
                                </label>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
                                💡 Your image will be uploaded to secure cloud storage
                              </p>
                            </div>
                          )}

                          {/* Image Preview */}
                          {imagePreview && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Preview:</p>
                              <div className="relative w-24 h-24 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                <img 
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                  onError={() => setImagePreview('')}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview('');
                                    setNewProductForm({...newProductForm, imageUrl: ''});
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            placeholder="Describe your product..."
                            className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                            value={newProductForm.description}
                            onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
                          />
                        </div>

                        {/* Stock Status Toggle */}
                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 pt-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              Available in Stock
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Product will be {newProductForm.inStock ? 'visible' : 'hidden'} on storefront
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewProductForm({...newProductForm, inStock: !newProductForm.inStock})}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                              newProductForm.inStock ? 'bg-[#1DB854]' : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                newProductForm.inStock ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="submit"
                    onClick={() => console.log('Save Product button clicked!')}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-[#1DB854] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#1ed760] focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseAddProductModal}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-base font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Reuse Add Product Modal structure but for editing */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={handleCloseEditProductModal}
            />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="relative inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-zinc-200 z-[101]">
              <div className="light-mode-force">
              <form onSubmit={handleEditProduct}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Edit className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg font-medium leading-6 text-zinc-900" id="modal-title">
                        Edit Product
                      </h3>

                      {/* Error Display */}
                      {error && (
                        <div className="mt-3 rounded-md bg-red-50 p-3 border border-red-200">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                          </div>
                        </div>
                      )}

                      {/* Reuse the same form structure as Add Product */}
                      <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Product Name */}
                        <div>
                          <label htmlFor="edit-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="edit-name"
                            required
                            placeholder="e.g., Garri Ijebu"
                            className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                            value={newProductForm.name}
                            onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                          />
                        </div>

                        {/* Category & Base Price */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="edit-category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Category <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="category"
                              id="edit-category"
                              required
                              className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                              value={newProductForm.category}
                              onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                            >
                              {categories.filter(c => c !== 'All Products').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="edit-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                              Base Price (£) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="price"
                              id="edit-price"
                              min="0"
                              step="0.01"
                              required
                              placeholder="0.00"
                              className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                              value={newProductForm.price || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setNewProductForm({
                                  ...newProductForm,
                                  price: value === '' ? undefined : parseFloat(value)
                                });
                              }}
                            />
                          </div>
                        </div>

                        {/* Base Weight/Size */}
                        <div>
                          <label htmlFor="edit-weight" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Base Weight/Size <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="weight"
                            id="edit-weight"
                            required
                            placeholder="e.g., 2kg, 500g, 1L"
                            className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                            value={newProductForm.weight}
                            onChange={(e) => setNewProductForm({...newProductForm, weight: e.target.value})}
                          />
                        </div>

                        {/* Product Image */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Product Image
                          </label>

                          {/* Image Upload Method Tabs */}
                          <div className="flex gap-2 mb-3">
                            <button
                              type="button"
                              onClick={() => setImageUploadMethod('url')}
                              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                imageUploadMethod === 'url'
                                  ? 'bg-[#1DB854] text-white shadow-md'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                              }`}
                            >
                              📎 Image URL
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageUploadMethod('file')}
                              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                imageUploadMethod === 'file'
                                  ? 'bg-[#1DB854] text-white shadow-md'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                              }`}
                            >
                              📤 Upload File
                            </button>
                          </div>

                          {/* URL Input */}
                          {imageUploadMethod === 'url' && (
                            <div>
                              <input
                                type="url"
                                name="imageUrl"
                                id="edit-imageUrl"
                                placeholder="https://i.imgur.com/example.jpg"
                                className="block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                                value={newProductForm.imageUrl || ''}
                                onChange={(e) => {
                                  setNewProductForm({...newProductForm, imageUrl: e.target.value});
                                  setImagePreview(e.target.value);
                                }}
                              />
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                💡 Free hosting: <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-[#1DB854] hover:underline font-medium">Imgur</a> · <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-[#1DB854] hover:underline font-medium">ImgBB</a>
                              </p>
                            </div>
                          )}

                          {/* File Upload */}
                          {imageUploadMethod === 'file' && (
                            <div>
                              <div className="border-2 border-dashed border-[#1DB854] dark:border-[#1DB854] rounded-lg p-6 text-center hover:bg-[#1DB854]/5 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*,image/webp,image/svg+xml,image/bmp,image/tiff,image/heic,image/heif"
                                  id="editImageFile"
                                  className="hidden"
                                  disabled={isUploadingImage}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      console.log('📁 File selected for edit:', file.name, file.size, 'bytes', file.type);

                                      if (file.size > 10485760) {
                                        toast.error('File too large! Maximum size is 10MB');
                                        return;
                                      }

                                      setIsUploadingImage(true);
                                      try {
                                        const preview = await fileToBase64(file);
                                        setImagePreview(preview);

                                        const productId = editingProduct?.id || `product-${Date.now()}`;
                                        console.log('🚀 Uploading for product:', productId);
                                        const imageUrl = await uploadProductImage(file, productId);

                                        if (imageUrl) {
                                          setNewProductForm({...newProductForm, imageUrl});
                                          if (imageUrl.startsWith('data:')) {
                                            toast.success('✅ Image saved locally (using fallback storage)');
                                          } else {
                                            toast.success('✅ Image uploaded to Supabase Storage!');
                                          }
                                          console.log('✅ Upload complete:', imageUrl);
                                        } else {
                                          toast.error('Upload failed. Please use an image URL instead (Imgur or ImgBB recommended)');
                                          setImagePreview('');
                                        }
                                      } catch (err) {
                                        console.error('❌ Image upload error:', err);
                                        toast.error('Upload error. Please try again.');
                                        setImagePreview('');
                                      } finally {
                                        setIsUploadingImage(false);
                                        const input = document.getElementById('editImageFile') as HTMLInputElement;
                                        if (input) input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <label htmlFor="editImageFile" className={`cursor-pointer block ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  {isUploadingImage ? (
                                    <>
                                      <RefreshCw className="w-12 h-12 mx-auto text-[#1DB854] mb-3 animate-spin" />
                                      <p className="text-base text-zinc-600 dark:text-zinc-400 font-medium">
                                        Uploading to Supabase Storage...
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-12 h-12 mx-auto text-[#1DB854] mb-3" />
                                      <p className="text-base text-zinc-900 dark:text-zinc-100 font-medium mb-1">
                                        Click here to select an image
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                                        Any image format • 10MB max per file
                                      </p>
                                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                        PNG, JPG, GIF, WebP, SVG, BMP, TIFF, HEIC, etc.
                                      </p>
                                      <p className="text-xs text-[#1DB854] mt-1 font-medium">
                                        ✨ Supabase Storage = Unlimited space for all images!
                                      </p>
                                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                        💾 localStorage backup for small images (browser has ~5MB total limit)
                                      </p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          )}

                          {/* Image Preview */}
                          {imagePreview && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Preview:</p>
                              <div className="relative w-24 h-24 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  onError={() => setImagePreview('')}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview('');
                                    setNewProductForm({...newProductForm, imageUrl: ''});
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label htmlFor="edit-description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="edit-description"
                            rows={3}
                            placeholder="Describe your product..."
                            className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 shadow-sm focus:border-[#1DB854] focus:ring-[#1DB854] sm:text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 border"
                            value={newProductForm.description}
                            onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
                          />
                        </div>

                        {/* Additional Variants */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              Additional Sizes (Optional)
                            </label>
                            <button
                              type="button"
                              onClick={() => setProductVariants([...productVariants, { weight: '', price: 0 }])}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#1DB854] hover:text-[#1ed760] transition-colors"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Size
                            </button>
                          </div>
                          {productVariants.length > 0 && (
                            <div className="space-y-2">
                              {productVariants.map((variant, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="e.g., 5kg"
                                    className="flex-1 block rounded-md border-zinc-300 text-sm bg-white text-zinc-900 px-2 py-1.5 border"
                                    value={variant.weight}
                                    onChange={(e) => {
                                      const newVariants = [...productVariants];
                                      newVariants[index].weight = e.target.value;
                                      setProductVariants(newVariants);
                                    }}
                                  />
                                  <div className="flex items-center flex-1">
                                    <span className="text-xs text-zinc-500 mr-1">£</span>
                                    <input
                                      type="number"
                                      placeholder="0.00"
                                      min="0"
                                      step="0.01"
                                      className="w-full block rounded-md border-zinc-300 text-sm bg-white text-zinc-900 px-2 py-1.5 border"
                                      value={variant.price || ''}
                                      onChange={(e) => {
                                        const newVariants = [...productVariants];
                                        newVariants[index].price = parseFloat(e.target.value);
                                        setProductVariants(newVariants);
                                      }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVariants = productVariants.filter((_, i) => i !== index);
                                      setProductVariants(newVariants);
                                    }}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Stock Status Toggle */}
                        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              Available in Stock
                            </p>
                            <p className="text-xs text-zinc-500">
                              Product will be {newProductForm.inStock ? 'visible' : 'hidden'} on storefront
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewProductForm({...newProductForm, inStock: !newProductForm.inStock})}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 ${
                              newProductForm.inStock ? 'bg-[#1DB854]' : 'bg-zinc-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                newProductForm.inStock ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-zinc-200">
                  <button
                    type="submit"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Update Product
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEditProductModal}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-base font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-zinc-900/75 backdrop-blur-sm transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowClearConfirm(false)}
            />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-xl bg-white dark:bg-zinc-900 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-zinc-200 dark:border-zinc-800">
              <div className="bg-white dark:bg-zinc-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-100" id="modal-title">
                      Clear All Visits
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Are you sure you want to clear all recorded visits? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleClearAllVisits}
                >
                  Clear Visits
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-base font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#1DB854] focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}