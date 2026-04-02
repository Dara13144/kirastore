import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameCard from '@/components/GameCard';
import { GAMES } from '@/lib/store';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-green px-4 py-8 animate-slide-down">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-2xl font-bold text-primary-foreground animate-fade-in">
            CHOOSE SPECIAL GAMES
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/80 animate-fade-in" style={{ animationDelay: '200ms' }}>
            • Quality • Safety • Affordable price
          </p>
        </div>
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
