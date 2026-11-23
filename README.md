# Gujarat Family Yatra

A private, mobile-friendly trip dashboard for the family journey (28 December 2026 – 3 January 2027), served by a Cloudflare Worker with Cloudflare D1.

## Production deployment

The production deployment is managed by GitHub Actions:

- Workflow: `.github/workflows/deploy-cloudflare.yml`
- Worker configuration: `wrangler.jsonc`
- Static assets: repository root, filtered by `.assetsignore`
- D1 migrations: `migrations/`
- Smoke tests: `tests/`

Every push to `main` runs the syntax and smoke tests. If they pass, GitHub Actions applies pending D1 migrations to the existing remote database, deploys the Worker and assets, then checks `/api/health`.

### One-time GitHub Secrets

In **GitHub → Settings → Secrets and variables → Actions**, add:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with permission to edit Workers Scripts, edit the target D1 database, and access the configured Workers Secrets Store binding. Restrict it to the account/resources needed for this application.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID that owns this Worker and D1 database.

Do not add `SESSION_SECRET` or `OPENAI_API_KEY` as repository files or expose them to the frontend. The existing Worker runtime bindings remain in Cloudflare: `SESSION_SECRET` stays as the existing Worker secret, and `OPENAI_API_KEY` stays in the configured Secrets Store binding.

### Safe database migration policy

- The workflow targets the existing database ID in `wrangler.jsonc`.
- Migrations are additive and tracked by Wrangler's D1 migration ledger.
- Never delete or recreate the production database as part of deployment.
- Existing migrations use `CREATE TABLE IF NOT EXISTS`, so a database whose tables were created previously can be brought under migration tracking without dropping existing rows.
- Review every future migration for destructive statements before merging it to `main`.

### Health check

The public endpoint `/api/health` checks that the Worker can query D1 and that the configured AI binding is present. The workflow fails if production health does not pass after deployment.

## Local validation

Requires Node.js 22 or newer:

```bash
npm run check
```

## Notes

- Trip facts, estimates and booking details must be verified with the relevant provider before travel.
- Browser-local expense and checklist data remain local to each device until those features are migrated to shared D1 records.
