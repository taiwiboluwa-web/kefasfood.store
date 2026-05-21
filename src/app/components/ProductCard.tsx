import { Plus, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Product } from '../data/products';
import { BrandedProductImage } from './BrandedProductImage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isComingSoon?: boolean;
}

export function ProductCard({ product, onAddToCart, onViewDetails, isComingSoon = false }: ProductCardProps) {
  const hasVariants = product.variants && product.variants.length > 1;
  const imageSrc = product.imageUrl || `https://source.unsplash.com/400x400/?${encodeURIComponent(product.image)}`;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg border-2 hover:border-[#1DB854]/20">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <BrandedProductImage
          src={imageSrc}
          alt={product.name}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
        {isComingSoon && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge className="text-sm bg-blue-500 hover:bg-blue-500">Coming Soon</Badge>
          </div>
        )}
        {!product.inStock && !isComingSoon && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
          </div>
        )}
        {product.badge && (
          <Badge className={`absolute top-2 left-2 ${
            product.badge === 'Best Seller' ? 'bg-[#FF9500] hover:bg-[#FF9500]' :
            product.badge === 'Popular' ? 'bg-[#1DB854] hover:bg-[#1DB854]' :
            'bg-blue-500 hover:bg-blue-500'
          }`}>
            {product.badge}
          </Badge>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onViewDetails(product)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs mb-2 border-[#1DB854] text-[#1DB854]">
            {product.category}
          </Badge>
          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-lg text-[#1DB854]">£{product.price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">/ {product.weight}</span>
        </div>
        
        {hasVariants && (
          <p className="text-xs text-muted-foreground mt-1">
            + {product.variants!.length - 1} more size{product.variants!.length > 2 ? 's' : ''}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full bg-[#1DB854] hover:bg-[#1DB854]/90 text-white"
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock || isComingSoon}
        >
          <Plus className="h-4 w-4 mr-2" />
          {hasVariants ? 'Select Size' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}