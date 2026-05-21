import { ImageWithFallback } from './figma/ImageWithFallback';
import logo from 'figma:asset/840e7e143c078ca76724f3dfd9ef24e8b1f93a18.png';

interface BrandedProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function BrandedProductImage({ src, alt, className }: BrandedProductImageProps) {
  return (
    <div className="relative w-full h-full">
      {/* Product Image */}
      <ImageWithFallback
        src={src}
        alt={alt}
        className={className}
      />

      {/* Kefas Food Logo Overlay - positioned in bottom right corner */}
      <div className="absolute bottom-3 right-3 rounded-full shadow-lg h-12 w-12 overflow-hidden">
        <img
          src={logo}
          alt="Kefas Food"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}