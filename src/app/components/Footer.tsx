import { Instagram, MessageCircle, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';
import { ComingSoonSection } from './ComingSoonSection';

interface FooterProps {
  onScrollToProducts: () => void;
  onScrollToBulkOrders: () => void;
  onScrollToAbout: () => void;
  onScrollToReviews: () => void;
}

export function Footer({ onScrollToProducts, onScrollToBulkOrders, onScrollToAbout, onScrollToReviews }: FooterProps) {
  return (
    <footer className="border-t mt-16 bg-muted/30">
      {/* Coming Soon Section */}
      <ComingSoonSection />

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1DB854] to-[#FF9500] flex items-center justify-center">
                <span className="font-bold text-white">KF</span>
              </div>
              <div>
                <h3 className="font-bold">Kefas Foods</h3>
                <p className="text-xs text-muted-foreground">Authentic Nigerian Foods</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium Nigerian food products imported directly from Nigeria and delivered worldwide. 
              Your trusted source for authentic ingredients.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={onScrollToProducts} className="hover:text-[#1DB854] transition-colors">
                  Products
                </button>
              </li>
              <li>
                <button onClick={onScrollToBulkOrders} className="hover:text-[#1DB854] transition-colors">
                  Bulk Orders
                </button>
              </li>
              <li>
                <button onClick={onScrollToAbout} className="hover:text-[#1DB854] transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={onScrollToReviews} className="hover:text-[#1DB854] transition-colors">
                  Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <p className="text-muted-foreground mb-1">Phone:</p>
                <a
                  href="tel:+447480140217"
                  className="text-[#1DB854] hover:underline font-medium"
                >
                  +44 7480 140217
                </a>
              </li>
              <li>
                <p className="text-muted-foreground mb-1">Email:</p>
                <a
                  href="mailto:info@kefasfoods.com"
                  className="text-[#1DB854] hover:underline font-medium"
                >
                  info@kefasfoods.com
                </a>
              </li>
              <li className="pt-2">
                <p className="text-muted-foreground mb-3">Follow Us:</p>
                <div className="flex gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 hover:border-[#1DB854] hover:text-[#1DB854]"
                    onClick={() => window.open('https://instagram.com/kefasfoods', '_blank')}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 hover:border-[#1DB854] hover:text-[#1DB854]"
                    onClick={() => window.open('https://wa.me/447480140217', '_blank')}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 hover:border-[#1DB854] hover:text-[#1DB854]"
                    onClick={() => window.open('https://tiktok.com/@kefasfoods', '_blank')}
                  >
                    <Music className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <p>© {new Date().getFullYear()} Kefas Foods. All rights reserved.</p>
          <Link to="/admin" className="text-xs text-muted-foreground/50 hover:text-[#1DB854] transition-colors">
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
