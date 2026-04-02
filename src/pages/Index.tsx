import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameCard from '@/components/GameCard';
import { GAMES } from '@/lib/store';
import heroBanner from '@/assets/hero-banner.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="animate-slide-down">
        <img src={heroBanner} alt="KIRA STORE - Diamond Top Up" className="w-full h-auto" width={1920} height={800} />
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {GAMES.map((game, i) => (
            <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
