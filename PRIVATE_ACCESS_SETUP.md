# Private family access setup

## D1 database
Create table by running `migrations/0002_trip_users.sql` in the SQL console for your existing `gujarat-trip-reviews` D1 database.

## Add users
Each row uses:
- username: lowercase, 3–40 characters (letters, numbers, dot, underscore, hyphen)
- display_name: name shown internally
- password_salt: random 16-byte salt as 32 hex characters
- password_hash: PBKDF2-HMAC-SHA256 password hash as 64 hex characters
- iterations: 310000
- role: admin or member
- active: 1 to allow login, 0 to disable

Never put plaintext passwords in D1. Generate a salt and hash on a trusted local machine with Python:

```python
import os, hashlib
password = input("Temporary password: ")
salt = os.urandom(16)
digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310000)
print("password_salt =", salt.hex())
print("password_hash =", digest.hex())
```

Then insert the username, display name, salt, hash, iteration count, role and active flag into `trip_users`.

## Worker secrets and binding
- Add D1 binding name `DB` pointing to `gujarat-trip-reviews`.
- Add Worker secret `SESSION_SECRET`: generate 32 random bytes and store as 64 hex characters.
- Keep existing `OPENAI_API_KEY` binding.

The login cookie is Secure, HttpOnly, SameSite=Lax, signed, and expires after 14 days. The Worker checks the user is still active on every protected request. Deactivate an account by setting `active=0`.

## Wrangler config
Once you have the D1 database ID, add it under `d1_databases` in `wrangler.jsonc` with binding `DB`. Never commit any password or secret.
