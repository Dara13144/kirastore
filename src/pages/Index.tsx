import { Link } from 'react-router-dom';
import { Diamond, Zap, Shield, Clock } from 'lucide-react';
import heroBg from '@/assets/hero-diamonds.jpg';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover opacity-40" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="container relative mx-auto px-4 py-24 text-center md:py-36">
          <h1 className="mb-4 font-heading text-3xl font-black text-gradient md:text-5xl">
            KIRA STORE
          </h1>
          <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground md:text-lg">
            Top Up Diamond ភ្លាមៗ ✨ បង់ប្រាក់តាម Bakong KHQR សុវត្ថិភាព & រហ័ស
          </p>
          <Link
            to="/topup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-8 py-3 font-heading text-sm font-bold text-primary-foreground shadow-neon transition-transform hover:scale-105"
          >
            <Diamond className="h-5 w-5" /> Top Up Now
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Zap, title: 'Instant Delivery', desc: 'Diamonds delivered within minutes after payment confirmed' },
            { icon: Shield, title: 'Secure Payment', desc: 'Bakong KHQR with MD5 verification for every transaction' },
            { icon: Clock, title: '24/7 Service', desc: 'Auto-processing available around the clock' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-gradient-card p-6 transition-all hover:glow-border hover:shadow-neon">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-heading text-sm font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
