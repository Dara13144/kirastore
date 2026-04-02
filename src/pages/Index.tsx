import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GameCard from '@/components/GameCard';
import PromoCarousel from '@/components/PromoCarousel';
import { fetchGamesWithPackages, type Game } from '@/lib/store';
import heroBanner from '@/assets/hero-banner.jpg';

const Index = () => {
  const { data: allGames = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: fetchGamesWithPackages,
    staleTime: 30000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="animate-slide-down">
        <img src={heroBanner} alt="KIRA STORE - Diamond Top Up" className="w-full h-auto" width={1920} height={800} />
      </div>

      {/* Promotional Carousel */}
      <div className="container mx-auto px-4 py-4 animate-fade-in">
        <PromoCarousel />
      </div>

      {/* Game Section Title */}
      <div className="bg-gradient-green-dark px-4 py-4 animate-fade-in">
        <div className="container mx-auto">
          <h1 className="font-heading text-xl font-bold text-primary-foreground">
            ជ្រើសរើសហ្គេមពិសេស។
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {allGames.map((game, i) => (
              <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <GameCard game={game} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Index;
