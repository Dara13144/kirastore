import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import promoMlbb from '@/assets/promo-mlbb.jpg';
import promoFreefire from '@/assets/promo-freefire.jpg';
import promoHok from '@/assets/promo-hok.jpg';
import promoWeekly from '@/assets/promo-weekly.jpg';

const slides = [
  { image: promoMlbb, alt: 'Mobile Legends Price List', link: '/topup/mlbb-kh' },
  { image: promoFreefire, alt: 'Free Fire Diamond Recharge', link: '/topup/ff-kh' },
  { image: promoHok, alt: 'Honor of Kings Special Offer', link: '/topup/hok' },
  { image: promoWeekly, alt: 'Weekly Special Bonus Diamonds', link: '/' },
];

const PromoCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [paused, next]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl shadow-green"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <Link
            key={slide.alt}
            to={slide.link}
            className="w-full flex-shrink-0"
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-auto object-cover aspect-[2/1]"
              loading="lazy"
            />
          </Link>
        ))}
      </div>

      {/* Nav Arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1.5 text-foreground backdrop-blur-sm transition hover:bg-background/80"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1.5 text-foreground backdrop-blur-sm transition hover:bg-background/80"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-5 bg-primary-foreground' : 'w-2 bg-primary-foreground/50'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoCarousel;
