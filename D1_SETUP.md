# Public reviews database setup

The site now has a public review interface and Worker API. Public reviews require a Cloudflare D1 database; until it is bound, the API intentionally returns a clear unavailable response rather than saving reviews only in a visitor's browser.

## Create the database

1. In Cloudflare, open **Storage & databases → D1 SQL Database**.
2. Create a database named `gujarat-trip-reviews`.
3. Copy its **Database ID**.

## Bind it to the Worker

Add a D1 binding to the `gujarat-family-trip` Worker:

- Binding name: `DB`
- Database: `gujarat-trip-reviews`

Because this project is deployed from GitHub with Wrangler configuration, also add the D1 binding to `wrangler.jsonc` after the database is created:

```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "gujarat-trip-reviews",
    "database_id": "PASTE_DATABASE_ID_HERE"
  }
]
```

Replace the placeholder with the real ID. Never put API keys or other secrets in this file.

## Create the table

Open the database's SQL Console and run the contents of `migrations/0001_public_reviews.sql`.

## Test

After the next successful Worker deployment:

- `GET /api/reviews` should return `{"reviews":[]}` initially.
- Submit a review through the website.
- Reload the page or open it on another device; the review should remain visible.
- Use **Summarise reviews with AI** to generate an evidence-based summary.

The AI summary uses only submitted public reviews. It does not create fake reviews or ratings.
