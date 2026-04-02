
-- Create games table
CREATE TABLE public.games (
  id text PRIMARY KEY,
  name text NOT NULL,
  publisher text NOT NULL,
  icon_url text,
  banner_url text,
  region text DEFAULT '',
  hot boolean DEFAULT false,
  out_of_stock boolean DEFAULT false,
  id_fields jsonb NOT NULL DEFAULT '[]',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create game_packages table
CREATE TABLE public.game_packages (
  id text PRIMARY KEY,
  game_id text NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  category text NOT NULL DEFAULT 'normal',
  tag text,
  image_url text,
  disabled boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

-- Create orders table
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  game_id text NOT NULL,
  game_name text NOT NULL,
  player_ids jsonb NOT NULL DEFAULT '{}',
  player_name text,
  package_id text NOT NULL,
  package_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  transaction_hash text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Games: anyone can read
CREATE POLICY "Anyone can read games" ON public.games FOR SELECT USING (true);

-- Packages: anyone can read
CREATE POLICY "Anyone can read packages" ON public.game_packages FOR SELECT USING (true);

-- Orders: anyone can insert and read
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);

-- Seed games
INSERT INTO public.games (id, name, publisher, region, hot, out_of_stock, id_fields, sort_order) VALUES
('mlbb-kh', 'MOBILE LEGENDS | KHMER', 'Moonton', '🇰🇭', true, false, '[{"label":"USER ID","placeholder":"58647857","key":"userId"},{"label":"ZONE ID","placeholder":"56744","key":"zoneId"}]', 1),
('mlbb-ph', 'MOBILE LEGENDS | PHILIPPINES', 'Moonton', '🇵🇭', false, false, '[{"label":"USER ID","placeholder":"58647857","key":"userId"},{"label":"ZONE ID","placeholder":"56744","key":"zoneId"}]', 2),
('mlbb-id', 'MOBILE LEGENDS | INDONESIA', 'Moonton', '🇮🇩', false, false, '[{"label":"USER ID","placeholder":"58647857","key":"userId"},{"label":"ZONE ID","placeholder":"56744","key":"zoneId"}]', 3),
('ff-kh', 'FREE FIRE | KHMER', 'Garena', '🇰🇭', true, false, '[{"label":"PLAYER ID","placeholder":"1234567890","key":"playerId"}]', 4),
('ff-id', 'FREE FIRE | INDONESIA', 'Garena', '🇮🇩', false, false, '[{"label":"PLAYER ID","placeholder":"1234567890","key":"playerId"}]', 5),
('ff-vn', 'FREE FIRE | VIETNAM', 'Garena', '🇻🇳', false, false, '[{"label":"PLAYER ID","placeholder":"1234567890","key":"playerId"}]', 6),
('ff-tw', 'FREE FIRE | TAIWAN', 'Garena', '🇹🇼', false, false, '[{"label":"PLAYER ID","placeholder":"1234567890","key":"playerId"}]', 7),
('magic-chess', 'MAGIC CHESS GOGO', 'Moonton', '', false, false, '[{"label":"USER ID","placeholder":"58647857","key":"userId"}]', 8),
('hok', 'HONOR OF KINGS', 'TiMi Studio', '', false, true, '[{"label":"USER ID","placeholder":"12345678","key":"userId"}]', 9);

-- Seed packages
INSERT INTO public.game_packages (id, game_id, name, price, category, tag, sort_order) VALUES
('mlkh-1', 'mlbb-kh', '150x2', 2.38, 'best-seller', 'First Recharge', 1),
('mlkh-2', 'mlbb-kh', '50x2', 0.91, 'best-seller', 'First Recharge', 2),
('mlkh-3', 'mlbb-kh', '250x2', 3.79, 'best-seller', 'First Recharge', 3),
('mlkh-4', 'mlbb-kh', '500x2', 7.60, 'best-seller', 'First Recharge', 4),
('mlkh-5', 'mlbb-kh', '172+wkp', 4.05, 'best-seller', NULL, 5),
('mlkh-6', 'mlbb-kh', '257+wkp', 5.07, 'best-seller', 'Full Ticket', 6),
('mlkh-7', 'mlbb-kh', 'Weekly Elite Bundle', 0.92, 'best-seller', NULL, 7),
('mlkh-8', 'mlbb-kh', 'Monthly Epic Bundle', 3.99, 'best-seller', NULL, 8),
('mlkh-9', 'mlbb-kh', '11 Diamonds', 0.25, 'normal', NULL, 9),
('mlkh-10', 'mlbb-kh', '22 Diamonds', 0.49, 'normal', NULL, 10),
('mlkh-11', 'mlbb-kh', '55 Diamonds', 0.92, 'normal', 'Try', 11),
('mlkh-12', 'mlbb-kh', '86 Diamonds', 1.29, 'normal', NULL, 12),
('mlkh-13', 'mlbb-kh', '172 Diamonds', 2.53, 'normal', NULL, 13),
('mlkh-14', 'mlbb-kh', '257 Diamonds', 3.79, 'normal', NULL, 14),
('mlkh-15', 'mlbb-kh', '344 Diamonds', 5.06, 'normal', NULL, 15),
('mlkh-16', 'mlbb-kh', '429 Diamonds', 6.32, 'normal', NULL, 16),
('mlkh-17', 'mlbb-kh', '514 Diamonds', 7.59, 'normal', NULL, 17),
('mlkh-18', 'mlbb-kh', '706 Diamonds', 10.11, 'normal', NULL, 18),
('mlph-1', 'mlbb-ph', '56 Diamonds', 0.99, 'normal', NULL, 1),
('mlph-2', 'mlbb-ph', '112 Diamonds', 1.99, 'normal', NULL, 2),
('mlph-3', 'mlbb-ph', '224 Diamonds', 3.99, 'normal', NULL, 3),
('mlid-1', 'mlbb-id', '86 Diamonds', 1.29, 'normal', NULL, 1),
('mlid-2', 'mlbb-id', '172 Diamonds', 2.53, 'normal', NULL, 2),
('mlid-3', 'mlbb-id', '257 Diamonds', 3.79, 'normal', NULL, 3),
('ffkh-1', 'ff-kh', 'Evo3D', 0.82, 'best-seller', NULL, 1),
('ffkh-2', 'ff-kh', 'Evo7D', 0.97, 'best-seller', NULL, 2),
('ffkh-3', 'ff-kh', 'Evo30D', 2.49, 'best-seller', NULL, 3),
('ffkh-4', 'ff-kh', 'WeeklyLite', 0.49, 'best-seller', 'Get 20💎', 4),
('ffkh-5', 'ff-kh', 'Good luck', 0.57, 'best-seller', 'One day, by chance.', 5),
('ffkh-6', 'ff-kh', 'lvp6', 0.42, 'best-seller', NULL, 6),
('ffkh-7', 'ff-kh', 'lvp10', 0.79, 'best-seller', NULL, 7),
('ffkh-8', 'ff-kh', 'lvp15', 0.79, 'best-seller', NULL, 8),
('ffkh-9', 'ff-kh', '25 Diamonds', 0.29, 'normal', 'Try', 9),
('ffkh-10', 'ff-kh', '100 Diamonds', 0.95, 'normal', NULL, 10),
('ffkh-11', 'ff-kh', '310 Diamonds', 2.85, 'normal', NULL, 11),
('ffkh-12', 'ff-kh', '520 Diamonds', 4.75, 'normal', NULL, 12),
('ffkh-13', 'ff-kh', '1060 Diamonds', 9.50, 'normal', NULL, 13),
('ffid-1', 'ff-id', '100 Diamonds', 0.99, 'normal', NULL, 1),
('ffid-2', 'ff-id', '310 Diamonds', 2.99, 'normal', NULL, 2),
('ffvn-1', 'ff-vn', '100 Diamonds', 0.99, 'normal', NULL, 1),
('ffvn-2', 'ff-vn', '310 Diamonds', 2.99, 'normal', NULL, 2),
('fftw-1', 'ff-tw', '100 Diamonds', 0.99, 'normal', NULL, 1),
('mc-1', 'magic-chess', '60 Diamonds', 0.99, 'normal', NULL, 1),
('mc-2', 'magic-chess', '180 Diamonds', 2.99, 'normal', NULL, 2);
