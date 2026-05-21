import { ShoppingBag, Truck, Award } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import logo from 'figma:asset/840e7e143c078ca76724f3dfd9ef24e8b1f93a18.png';

export function AboutSection() {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Premium Selection',
      description: 'Handpicked products sourced directly from trusted Nigerian suppliers for authentic quality'
    },
    {
      icon: Truck,
      title: 'Fresh Imports',
      description: 'Regular shipments ensure you always receive the freshest products with optimal taste and quality'
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      description: 'Every item meets our strict quality standards. We stand behind everything we sell'
    }
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-white shadow-lg flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Kefas Food" 
                  className="h-32 w-32 object-cover"
                />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
            <div className="max-w-3xl mx-auto space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                Kefas Foods was born from a passion to share the authentic tastes of Nigeria with food lovers everywhere. 
                We carefully select and import premium Nigerian food products, ensuring every item meets our strict quality standards.
              </p>
              <p className="leading-relaxed">
                Whether you're cooking traditional dishes for your family, running a Nigerian restaurant, or catering an event, 
                we provide the authentic ingredients that make all the difference. Our commitment is simple: deliver the genuine 
                taste of home to Nigerians and food enthusiasts worldwide.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#1DB854] to-[#FF9500] flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}