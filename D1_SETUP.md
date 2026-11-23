# Cloudflare D1 setup and migration policy

The production D1 database already exists and is configured in `wrangler.jsonc`:

- Binding: `DB`
- Database: `gujarat-trip-reviews`
- Database ID: `6903edf4-e024-4bdd-b480-132362972180`

**Do not create a replacement database or delete the existing one.** The GitHub Actions deployment applies pending migrations to this existing database.

## Existing schema migrations

- `migrations/0001_public_reviews.sql`
- `migrations/0002_trip_users.sql`

Both create their tables and indexes using `IF NOT EXISTS`. This is intentional: if the tables already exist from earlier manual setup, applying the migrations does not drop or overwrite their existing rows. Wrangler records applied migration names in its D1 migration ledger.

## Automated production deployment

The workflow `.github/workflows/deploy-cloudflare.yml`:

1. Runs Worker syntax validation and repository smoke tests.
2. Applies pending migrations to the remote database.
3. Deploys the Worker and static assets.
4. Verifies `/api/health`, including a real D1 query and AI binding presence.

Do not add destructive database reset commands to this workflow.

## GitHub Actions secrets

Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` under GitHub repository **Settings → Secrets and variables → Actions**. The API token needs Workers Scripts edit, D1 edit for this database, and access needed to deploy the configured Workers Secrets Store binding.

Keep the existing `SESSION_SECRET` Worker secret and `OPENAI_API_KEY` Secrets Store entry in Cloudflare. They are not part of Git and must not be copied into the repository.

## Future migrations

Create new sequential SQL files in `migrations/`, for example `0003_group_chat.sql`. Prefer additive changes. Review any `DROP`, destructive `ALTER`, bulk `DELETE`, or data rewrite carefully before merging. Production migrations are applied automatically after tests pass.
