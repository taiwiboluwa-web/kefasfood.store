import { Phone, ShoppingBag, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import kilishiImage from 'figma:asset/bac21d5d3c8dff767e9554fc7d452d8699514f26.png';
import garriIjebuImage from 'figma:asset/1c260d02146d57917953c8a49e0728d4f386fed9.png';
import pupuruImage from 'figma:asset/43edfd391ba64c9c52521a1cf5bde6aed95b358f.png';
import tapiocaImage from 'figma:asset/47c2fa613a25f39ff15d07a5ab2837c35c010d21.png';
import garriYellowImage from 'figma:asset/40a538ddbe89d3666a8c50f1f98abd40fbf71da2.png';
import eluboImage from 'figma:asset/68e918be9298ccb4dca7cff4dd6ce5c3f0425a92.png';
import pepperSoupSpiceImage from 'figma:asset/6645c4914bf7815d1c474112fe941cbe4a096a1d.png';
import suyaSpiceImage from 'figma:asset/28afa8dccc68c6da0a8f2f3f0d4d174cb4f6733c.png';
import locustBeansImage from 'figma:asset/722ded55ffe51e39e2c4df0ea30b609251f8ebe7.png';
import tigernutImage from 'figma:asset/d0848aa8009f4e5d58e6460a5b847be7c570d060.png';
import zoboLeavesImage from 'figma:asset/92054193fec7e05317724e509ffb22324b88696d.png';
import palmOilImage from 'figma:asset/d8a5a00365cdb54f22b59aaa0e03fcf914385145.png';
import honeyBeansImage from 'figma:asset/29f480ce91a133c72d2f1a3962c30fef808d91fb.png';
import ofadaRiceImage from 'figma:asset/b0cf58245f714eb1d9144be20a945ed1c4c5067a.png';
import egusiImage from 'figma:asset/ab99c011473e774e205b9eb9899821cb2b635567.png';
import ogbonoImage from 'figma:asset/d74ad80a6452e0fe2b75370849699785edbe1b4b.png';
import abachaImage from 'figma:asset/d1504be10e0974e8e63dea9152c4c57311c1289b.png';
import catfishCutletImage from 'figma:asset/c936ffa90e5bc8b00c1a4bb4db38fafd1c06bf4f.png';
import goatMeatImage from 'figma:asset/e7cc9c8d2c13f5ed91f2f09ce18a7f4fc753b4e1.png';
import catfishWholeImage from 'figma:asset/83d89f967e1a0ece391945d11938af4141da88c4.png';
import okpaImage from 'figma:asset/37c421ad92e8a354927bc0c1e2aabe4b86c15e0d.png';
import ponmoImage from 'figma:asset/0587b6e475442fda6ea2a36d99ff4746a0c57ca9.png';
import unwashedPonmoImage from 'figma:asset/ded1cf880b7aba0f7fcd2e0fd192a98cafed2d11.png';
import soakedPonmoImage from 'figma:asset/d19dd2efbf5a9efc3e6f9d1f2bcc9e040248f24f.png';
import ugbaImage from 'figma:asset/c68c0bb059bf91dfdc6206da48546315d8141527.png';

interface HeroProps {
  onScrollToProducts: () => void;
}

const heroImages = [
  { src: kilishiImage, alt: 'Kilishi - Traditional Nigerian dried spiced meat' },
  { src: garriIjebuImage, alt: 'Garri Ijebu - Premium cassava flour' },
  { src: pupuruImage, alt: 'Pupuru - Fermented cassava flour' },
  { src: tapiocaImage, alt: 'Tapioca - Premium quality cassava' },
  { src: garriYellowImage, alt: 'Yellow Garri - Finely processed' },
  { src: eluboImage, alt: 'Elubo - Pure yam flour' },
  { src: pepperSoupSpiceImage, alt: 'Pepper Soup Spices' },
  { src: suyaSpiceImage, alt: 'Suya Spice - Traditional blend' },
  { src: locustBeansImage, alt: 'Fermented Locust Beans' },
  { src: tigernutImage, alt: 'Tigernuts - Premium quality' },
  { src: zoboLeavesImage, alt: 'Zobo Leaves - Premium dried hibiscus' },
  { src: palmOilImage, alt: 'Palm Oil - Pure & Natural' },
  { src: honeyBeansImage, alt: 'Sweet Honey Beans - Premium white beans' },
  { src: ofadaRiceImage, alt: 'Ofada Rice - Authentic Nigerian brown rice' },
  { src: egusiImage, alt: 'Egusi - Ground melon seeds' },
  { src: ogbonoImage, alt: 'Ogbono - Wild mango seeds' },
  { src: abachaImage, alt: 'Abacha - African salad' },
  { src: catfishCutletImage, alt: 'Smoked Catfish Cutlet' },
  { src: goatMeatImage, alt: 'Dried Goat Meat - Premium quality' },
  { src: catfishWholeImage, alt: 'Whole Smoked Catfish' },
  { src: okpaImage, alt: 'Okpa - Bambara nut flour' },
  { src: ponmoImage, alt: 'Prewashed Dried Ponmo - Cow skin' },
  { src: unwashedPonmoImage, alt: 'Unwashed Ponmo - Dried cow skin' },
  { src: soakedPonmoImage, alt: 'Soaked Ponmo - Ready to cook' },
  { src: ugbaImage, alt: 'Ugba - Sliced oil bean seed' }
];

export function Hero({ onScrollToProducts }: HeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1DB854]/10 via-background to-[#FF9500]/10 border-b">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="bg-[#1DB854]/10 text-[#1DB854] px-4 py-1.5 rounded-full text-sm font-semibold">
                  Premium Nigerian Foods
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Kefas Foods
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-[#1DB854]">
                Authentic Taste, Premium Quality
              </p>
              <p className="text-lg text-muted-foreground">
                Import premium Nigerian food products directly from Nigeria. Quality ingredients for traditional dishes, delivered to your doorstep across the globe.
              </p>
              
              {/* Feature Checkmarks */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#1DB854] flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">100% Authentic Nigerian Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#1DB854] flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Fresh Imports, Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#1DB854] flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Worldwide Shipping Available</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => window.open('https://wa.me/447480140217', '_blank')}
                className="bg-[#1DB854] hover:bg-[#1DB854]/90 text-white"
              >
                <Phone className="h-5 w-5 mr-2" />
                Order on WhatsApp
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onScrollToProducts}
                className="border-[#1DB854] text-[#1DB854] hover:bg-[#1DB854]/10"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                View Products
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1DB854]">30+</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FF9500]">7</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Globe className="h-6 w-6 text-[#1DB854]" />
                </div>
                <div className="text-sm text-muted-foreground">Worldwide</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={heroImages[currentImageIndex].src}
                alt={heroImages[currentImageIndex].alt}
                className="object-cover w-full h-full transition-opacity duration-1000"
              />
            </div>
            {/* Image indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}