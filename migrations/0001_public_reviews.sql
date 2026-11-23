CREATE TABLE IF NOT EXISTS public_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('Hotel Laxmi Niwas · Dwarka','Hotel Sukhnath · Somnath','Hotel Ankur · Diu','Transport','Overall trip')),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 80),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 10 AND 1200),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_public_reviews_created ON public_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_reviews_category ON public_reviews(category);
