import type { Game } from '@/lib/store';
import { Link } from 'react-router-dom';

interface Props {
  game: Game;
}

const GameCard = ({ game }: Props) => {
  const isDisabled = game.outOfStock;

  return (
    <div className="game-card-hover overflow-hidden rounded-2xl border-2 border-border bg-card p-3">
      <div className="relative mb-3">
        <img
          src={game.icon}
          alt={game.name}
          className={`mx-auto h-20 w-20 rounded-xl object-contain ${isDisabled ? 'opacity-40 grayscale' : ''}`}
          loading="lazy"
          width={80}
          height={80}
        />
        {game.hot && (
          <span className="absolute -right-1 -top-1 rounded-md bg-accent px-2 py-0.5 font-heading text-[10px] font-bold text-accent-foreground">
            HOT
          </span>
        )}
      </div>

      <h3 className="mb-2 text-center font-heading text-xs font-bold leading-tight text-foreground">
        {game.name}
      </h3>

      {isDisabled ? (
        <div className="rounded-full bg-muted py-2 text-center text-xs font-medium text-muted-foreground">
          Out of stock
        </div>
      ) : (
        <Link
          to={`/topup/${game.id}`}
          className="block rounded-full bg-gradient-green py-2 text-center text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
        >
          Top up
        </Link>
      )}
    </div>
  );
};

export default GameCard;
