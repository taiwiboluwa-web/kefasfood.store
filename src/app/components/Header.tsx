import { ShoppingCart, Menu, X, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ThemeOption } from '../utils/themeUtils';
import logo from 'figma:asset/840e7e143c078ca76724f3dfd9ef24e8b1f93a18.png';

interface HeaderProps {
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  cartItemCount: number;
  onCartClick: () => void;
}

export function Header({ currentTheme, onThemeChange, cartItemCount, onCartClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center">
              <img 
                src={logo} 
                alt="Kefas Food Logo" 
                className="h-12 w-12 object-cover"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Kefas Food</h1>
              <p className="text-xs text-muted-foreground">Authentic Nigerian Foods</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Switcher */}
            <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#FF9500] hover:bg-[#FF9500]"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}