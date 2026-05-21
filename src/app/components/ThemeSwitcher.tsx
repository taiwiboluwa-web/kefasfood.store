import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { THEMES, ThemeOption, getSeasonalDescription } from '../utils/themeUtils';

interface ThemeSwitcherProps {
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);

  const handleThemeSelect = (theme: ThemeOption) => {
    onThemeChange(theme);
    setOpen(false);
  };

  const currentThemeData = THEMES.find(t => t.id === currentTheme);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change theme"
          className="relative"
        >
          <Palette className="h-5 w-5" />
          {currentThemeData && (
            <span className="absolute -top-1 -right-1 text-xs">
              {currentThemeData.icon}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Choose Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Basic Themes */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-muted-foreground mb-1.5">Basic</div>
          {THEMES.filter(t => ['light', 'dark', 'auto', 'seasons'].includes(t.id)).map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{theme.icon}</span>
                <div>
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {theme.id === 'seasons' && currentTheme === 'seasons' 
                      ? getSeasonalDescription()
                      : theme.description
                    }
                  </div>
                </div>
              </div>
              {currentTheme === theme.id && (
                <Check className="h-4 w-4 text-[#1DB854]" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Mood Themes */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-muted-foreground mb-1.5">Moods</div>
          {THEMES.filter(t => ['sunset', 'forest', 'ocean'].includes(t.id)).map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{theme.icon}</span>
                <div>
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                </div>
              </div>
              {currentTheme === theme.id && (
                <Check className="h-4 w-4 text-[#1DB854]" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Brand Themes */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-muted-foreground mb-1.5">Brand</div>
          {THEMES.filter(t => ['nigerian-pride', 'green-focus', 'orange-focus'].includes(t.id)).map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{theme.icon}</span>
                <div>
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                </div>
              </div>
              {currentTheme === theme.id && (
                <Check className="h-4 w-4 text-[#1DB854]" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}