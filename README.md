# Digital Cards

A HeyDrop-style digital business card + AI lead scanner + CRM sync tool,
built for use across Bilaal TV, Al-Iman Foundation, Wings of Mercy, EL HUDAA,
Shura Council, and Action MC.

Live repo: https://github.com/amrsaidkhalil/App-Hay

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4, Prisma + Postgres,
Auth.js (Google), Anthropic Claude (vision, for the scanner), `qrcode`.

## Running locally

Needs a Postgres database — the free tier of [Neon](https://neon.tech) or
Vercel Postgres both work. Point `DATABASE_URL` in `.env` at it, then:

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev -- --port 3100
```

Sign in with the "Continue as dev user (local only)" button on `/login` —
this bypass is active whenever Google OAuth isn't configured and
`NODE_ENV !== "production"`. The seeded dev user (`amr@example.com`) owns
cards under Bilaal TV and Action MC.

## Brands

Scoped to **Bilaal TV** and **Action MC**. To add another, append it to `ORGS`
in `prisma/seed.ts` and redeploy — the seed creates it and grants membership.

The seed also prunes orgs that aren't in that list, but it refuses to delete
one that still has cards or captured contacts (both cascade), so removing a
brand from `ORGS` won't silently destroy data.

## Card palette

Each brand has three colors with distinct roles:

| Field | Role |
|---|---|
| `primaryColor` | Solid card background |
| `textColor` | Text printed on the card |
| `secondaryColor` | Accent — logo ring, QR frame, QR modules |

Two corrections are applied automatically in `src/lib/brand.ts`:
the accent is nudged until it's visible against the background, and QR modules
are darkened until they clear 7:1 against white — a pale accent would otherwise
produce a code that looks fine but won't scan. The branding editor shows a live
contrast ratio and warns below 4.5:1.

## What works today

- Card CRUD with live preview, per-brand palette and logo
- Public card pages (`/c/[org]/[card]`) with QR code + `.vcf` download
- Inbound lead capture ("share your details back" on the public page)
- AI Contact Scanner (photo → parsed fields → confirm → save)
- Contacts list + CSV export
- Logo and photo upload (Vercel Blob)
- Native share sheet, falling back to copy-link on desktop
- Installable PWA (manifest + service worker, production only)

## Post-build checklist (Phase 2 — optional, gated by env vars)

Nothing below is required for the app to work — QR + vCard sharing and CSV
export work with zero external accounts. Add these when you want the extra
integrations:

| Feature | What to do | Env vars |
|---|---|---|
| AI Contact Scanner | Get an Anthropic API key | `ANTHROPIC_API_KEY` |
| Google sign-in + Contacts sync | Create a free OAuth client at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials). Redirect URI: `<your-url>/api/auth/callback/google`. Then add the `Account`/`Session`/`VerificationToken` tables Auth.js's Prisma adapter expects (`npx prisma db push`) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` |
| Add to Google Wallet | Create a Google Wallet Issuer account + service account with "Wallet Object Issuer" role ([guide](https://developers.google.com/wallet/generic/getting-started)) | `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_WALLET_PRIVATE_KEY` |
| Add to Apple Wallet | Enroll in the Apple Developer Program ($99/yr), generate a Pass Type ID certificate, then implement `buildAppleWalletPass()` in `src/lib/wallet/apple.ts` (the comment there has the exact steps + library to use) | `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT_BASE64`, `APPLE_PASS_CERT_PASSWORD`, `APPLE_WWDR_CERT_BASE64` |

All of these are read from `.env` — see the comments there for exact
instructions per variable.

## Deploying

1. Import `amrsaidkhalil/App-Hay` into Vercel (vercel.com → Add New →
   Project).
2. Vercel's Storage tab → Create Database → Postgres (Neon-backed) →
   `DATABASE_URL` gets set automatically.
3. Add `AUTH_SECRET` (any random string) and `ANTHROPIC_API_KEY` in
   Project Settings → Environment Variables. The Phase 2 vars in the table
   above are optional.
4. Deploy. The build command (`prisma generate && prisma db push && prisma
   db seed && next build`) creates the schema and seeds the 6 orgs
   automatically on every deploy — no manual step needed. The seed uses
   `upsert`, so re-running it on later deploys is safe and won't duplicate
   data.
