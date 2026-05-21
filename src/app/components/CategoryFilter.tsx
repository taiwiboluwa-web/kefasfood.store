import { Button } from './ui/button';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="border-b bg-background sticky top-16 z-40">
      <div className="container mx-auto px-4 py-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectCategory(category)}
                className={
                  selectedCategory === category
                    ? 'bg-[#1DB854] hover:bg-[#1DB854]/90 text-white'
                    : 'hover:border-[#1DB854] hover:text-[#1DB854]'
                }
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>
    </div>
  );
}
