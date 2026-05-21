import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Product } from '../data/products';
import { Plus, Package, Check } from 'lucide-react';
import { useState } from 'react';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { BrandedProductImage } from './BrandedProductImage';

interface ProductPreviewModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedWeight: string, selectedPrice: number) => void;
}

export function ProductPreviewModal({ product, open, onClose, onAddToCart }: ProductPreviewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<{ weight: string; price: number } | null>(null);

  if (!product) return null;

  const hasVariants = product.variants && product.variants.length > 0;
  const displayWeight = selectedVariant?.weight || product.weight;
  const displayPrice = selectedVariant?.price || product.price;
  const imageSrc = product.imageUrl || `https://source.unsplash.com/600x600/?${encodeURIComponent(product.image)}`;

  const handleAddToCart = () => {
    onAddToCart(product, displayWeight, displayPrice);
    onClose();
    setSelectedVariant(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedVariant(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            View product details and select your preferred size
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <BrandedProductImage
              src={imageSrc}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <Badge className="bg-[#1DB854] hover:bg-[#1DB854]/90 mb-2">
                {product.category}
              </Badge>
              {product.inStock ? (
                <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  In Stock
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-2">
                  Out of Stock
                </Badge>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-[#1DB854]">
                  £{displayPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {displayWeight}
              </p>
            </div>

            {/* Size Selector */}
            {hasVariants && (
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base">Select Size</Label>
                <RadioGroup 
                  value={selectedVariant ? `${selectedVariant.weight}-${selectedVariant.price}` : `${product.weight}-${product.price}`}
                  onValueChange={(value) => {
                    const [weight, priceStr] = value.split('-');
                    const price = parseFloat(priceStr);
                    setSelectedVariant({ weight, price });
                  }}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {product.variants!.map((variant) => (
                      <div key={`${variant.weight}-${variant.price}`}>
                        <RadioGroupItem
                          value={`${variant.weight}-${variant.price}`}
                          id={`${variant.weight}-${variant.price}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`${variant.weight}-${variant.price}`}
                          className="flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer peer-data-[state=checked]:border-[#1DB854] peer-data-[state=checked]:bg-[#1DB854]/5 hover:bg-muted/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{variant.weight}</span>
                          </div>
                          <span className="font-bold text-[#1DB854]">£{variant.price.toFixed(2)}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Best Value */}
            {hasVariants && product.variants!.length > 1 && (
              <div className="border rounded-lg p-4 bg-gradient-to-br from-[#FF9500]/5 to-[#1DB854]/5">
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="h-4 w-4 text-[#FF9500]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Best Value</h4>
                    <p className="text-sm text-muted-foreground">
                      Larger sizes offer better value per unit. Stock up and save!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-initial"
          >
            Close
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 sm:flex-initial bg-[#1DB854] hover:bg-[#1DB854]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}