import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameCard from '@/components/GameCard';
import { GAMES } from '@/lib/store';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="bg-gradient-green px-4 py-6">
        <h1 className="font-heading text-xl font-bold text-primary-foreground">
          CHOOSE SPECIAL GAMES
        </h1>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {GAMES.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
