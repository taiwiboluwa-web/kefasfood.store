/**
 * Theme Utilities
 * Manages multiple theme options for Kefas Food website
 */

export type ThemeOption = 
  | 'light' 
  | 'dark' 
  | 'sunset' 
  | 'forest' 
  | 'ocean' 
  | 'nigerian-pride'
  | 'green-focus'
  | 'orange-focus'
  | 'auto'
  | 'seasons';

export interface Theme {
  id: ThemeOption;
  name: string;
  description: string;
  icon: string;
}

export const THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright',
    icon: '☀️'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes',
    icon: '🌙'
  },
  {
    id: 'auto',
    name: 'Auto',
    description: 'Follows time of day',
    icon: '🌓'
  },
  {
    id: 'seasons',
    name: 'Seasons',
    description: 'Changes with seasons',
    icon: '🍂'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm evening vibes',
    icon: '🌅'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural and organic',
    icon: '🌿'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool and refreshing',
    icon: '🌊'
  },
  {
    id: 'nigerian-pride',
    name: 'Nigerian Pride',
    description: 'Green & white heritage',
    icon: '🇳🇬'
  },
  {
    id: 'green-focus',
    name: 'Green Focus',
    description: 'Emphasize freshness',
    icon: '💚'
  },
  {
    id: 'orange-focus',
    name: 'Orange Focus',
    description: 'Warm and vibrant',
    icon: '🧡'
  }
];

/**
 * Get current season based on month
 * Northern Hemisphere seasons
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth(); // 0-11
  
  // Spring: March (2), April (3), May (4)
  if (month >= 2 && month <= 4) return 'spring';
  
  // Summer: June (5), July (6), August (7)
  if (month >= 5 && month <= 7) return 'summer';
  
  // Autumn/Fall: September (8), October (9), November (10)
  if (month >= 8 && month <= 10) return 'autumn';
  
  // Winter: December (11), January (0), February (1)
  return 'winter';
}

/**
 * Get theme based on current season
 */
export function getSeasonalTheme(): ThemeOption {
  const season = getCurrentSeason();
  
  const seasonalThemes: Record<string, ThemeOption> = {
    spring: 'forest',      // 🌿 Fresh greens for spring growth
    summer: 'orange-focus', // 🧡 Warm and vibrant for summer
    autumn: 'sunset',       // 🌅 Warm tones for fall
    winter: 'ocean'         // 🌊 Cool blues for winter
  };
  
  return seasonalThemes[season];
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: ThemeOption) {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove(
    'dark', 
    'sunset', 
    'forest', 
    'ocean', 
    'nigerian-pride',
    'green-focus',
    'orange-focus'
  );
  
  // Handle auto theme (time-based)
  if (theme === 'auto') {
    const hour = new Date().getHours();
    const autoTheme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    if (autoTheme === 'dark') {
      root.classList.add('dark');
    }
  } 
  // Handle seasonal theme
  else if (theme === 'seasons') {
    const seasonalTheme = getSeasonalTheme();
    if (seasonalTheme !== 'light') {
      root.classList.add(seasonalTheme);
    }
  } 
  // Handle regular themes
  else if (theme !== 'light') {
    // Add the selected theme class (light has no class, it's the default)
    root.classList.add(theme);
  }
  
  // Save to localStorage
  localStorage.setItem('kefasFood_theme', theme);
}

/**
 * Get saved theme or default
 */
export function getSavedTheme(): ThemeOption {
  const saved = localStorage.getItem('kefasFood_theme') as ThemeOption;
  return saved || 'dark'; // Default to dark as requested
}

/**
 * Check if it's currently day or night (for auto theme)
 */
export function getCurrentTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

/**
 * Get a human-readable description of the current season and theme
 */
export function getSeasonalDescription(): string {
  const season = getCurrentSeason();
  const seasonNames = {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter'
  };
  
  const themeNames = {
    forest: 'Forest theme (fresh greens)',
    'orange-focus': 'Orange Focus theme (warm vibes)',
    sunset: 'Sunset theme (warm evening)',
    ocean: 'Ocean theme (cool blues)'
  };
  
  const seasonalTheme = getSeasonalTheme();
  return `${seasonNames[season]} - ${themeNames[seasonalTheme]}`;
}