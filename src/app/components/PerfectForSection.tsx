import { Users, ChefHat, Utensils, Store, Home } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function PerfectForSection() {
  const customerTypes = [
    {
      icon: Home,
      title: 'Personal/Family Kitchen',
      description: 'Bring authentic Nigerian flavors to your home cooking',
      color: '#1DB854'
    },
    {
      icon: ChefHat,
      title: 'Restaurants',
      description: 'Stock your kitchen with premium Nigerian ingredients',
      color: '#FF9500'
    },
    {
      icon: Utensils,
      title: 'Caterers',
      description: 'Event supplies for memorable occasions',
      color: '#1DB854'
    },
    {
      icon: Store,
      title: 'Retailers',
      description: 'Resell authentic products to your customers',
      color: '#FF9500'
    },
    {
      icon: Users,
      title: 'Communities',
      description: 'Organize group orders for better value',
      color: '#1DB854'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Perfect For</h2>
          <p className="text-muted-foreground text-lg">
            Quality Nigerian foods for every need
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {customerTypes.map((type, index) => (
            <Card 
              key={index} 
              className="border-2 hover:shadow-xl transition-all hover:border-[#1DB854]/30 hover:-translate-y-1"
            >
              <CardContent className="p-6 text-center h-full flex flex-col">
                <div 
                  className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${type.color}15` }}
                >
                  <type.icon className="h-7 w-7" style={{ color: type.color }} />
                </div>
                <h3 className="font-semibold text-base mb-2 leading-tight">
                  {type.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {type.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
