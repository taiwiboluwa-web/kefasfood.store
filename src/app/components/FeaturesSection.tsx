import { MapPin, MessageCircle, Globe } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function FeaturesSection() {
  const features = [
    {
      icon: MapPin,
      title: 'Direct from Nigeria',
      description: 'Authentic products sourced directly from trusted Nigerian suppliers',
      color: '#1DB854'
    },
    {
      icon: MessageCircle,
      title: 'Easy Ordering',
      description: 'Order via WhatsApp with instant support',
      color: '#FF9500'
    },
    {
      icon: Globe,
      title: 'Global Delivery',
      description: 'We ship to countries worldwide',
      color: '#1DB854'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-all hover:border-[#1DB854]/20">
              <CardContent className="p-6 text-center">
                <div 
                  className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="h-8 w-8" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
