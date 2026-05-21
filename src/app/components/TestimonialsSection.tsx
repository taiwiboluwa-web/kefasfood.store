import { Star, Users, Award, CalendarCheck } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Amara O.',
      location: 'UK',
      initials: 'AO',
      rating: 5,
      text: 'Best Nigerian food store I\'ve found in the UK! The quality is exceptional and delivery is always on time. My family loves everything we order.'
    },
    {
      name: 'Chisom U.',
      location: 'Bradford',
      initials: 'CU',
      rating: 5,
      text: 'Finally found authentic Nigerian ingredients! The Egusi and Palm Oil taste just like home. Customer service is excellent too.'
    },
    {
      name: 'Ayobami C.',
      location: 'Chicago',
      initials: 'AC',
      rating: 5,
      text: 'Kefas Foods has been a lifesaver for our restaurant. Reliable bulk orders and competitive prices. Highly recommend!'
    },
    {
      name: 'Tunde J.',
      location: 'Dallas',
      initials: 'TJ',
      rating: 5,
      text: 'Great selection of traditional products. The Garri Ijebu and Yam Flour are top quality. Will definitely order again!'
    },
    {
      name: 'Adetunji H.',
      location: 'Houston',
      initials: 'AH',
      rating: 5,
      text: 'Perfect for bulk orders! Used them for our community event and everyone was impressed with the authentic taste. Professional service!'
    }
  ];

  const stats = [
    { icon: Users, label: 'Happy Customers', value: '5000+' },
    { icon: Star, label: 'Average Rating', value: '4.9' },
    { icon: CalendarCheck, label: 'Events Catered', value: '500+' }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Kefas Foods for authentic Nigerian products
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-[#1DB854]/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-[#1DB854]" />
                </div>
                <div className="text-3xl font-bold text-[#1DB854] mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1DB854] to-[#FF9500] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">{testimonial.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#FF9500] text-[#FF9500]" />
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
