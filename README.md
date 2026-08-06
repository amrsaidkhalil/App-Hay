# Digital Cards

A HeyDrop-style digital business card + AI lead scanner + CRM sync tool,
built for use across Bilaal TV, Al-Iman Foundation, Wings of Mercy, EL HUDAA,
Shura Council, and Action MC.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind v4, Prisma + SQLite (dev;
swap to Postgres for production), Auth.js (Google), Anthropic Claude
(vision, for the scanner), `qrcode`.

## Running locally

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev -- --port 3100
```

Sign in with the "Continue as dev user (local only)" button on `/login` —
this bypass is active whenever Google OAuth isn't configured and
`NODE_ENV !== "production"`. The seeded dev user (`amr@example.com`) owns
cards under Bilaal TV and Action MC.

## What works today (Phase 1)

- Card CRUD with live preview, per-org branding (colors/fonts)
- Public card pages (`/c/[org]/[card]`) with QR code + `.vcf` download
- Inbound lead capture ("share your info back" on the public page)
- AI Contact Scanner (photo → parsed fields → confirm → save), once
  `ANTHROPIC_API_KEY` is set
- Leads table + CSV export
- Org branding settings (owner/admin only)
- Installable PWA (manifest + service worker, production only)

## Post-build checklist (Phase 2 — optional, gated by env vars)

Nothing below is required for the app to work — QR + vCard sharing and CSV
export work with zero external accounts. Add these when you want the extra
integrations:

| Feature | What to do | Env vars |
|---|---|---|
| AI Contact Scanner | Get an Anthropic API key | `ANTHROPIC_API_KEY` |
| Google sign-in + Contacts sync | Create a free OAuth client at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials). Redirect URI: `<your-url>/api/auth/callback/google`. Then add the `Account`/`Session`/`VerificationToken` tables Auth.js's Prisma adapter expects (`npx prisma migrate dev`) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` |
| Add to Google Wallet | Create a Google Wallet Issuer account + service account with "Wallet Object Issuer" role ([guide](https://developers.google.com/wallet/generic/getting-started)) | `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_WALLET_PRIVATE_KEY` |
| Add to Apple Wallet | Enroll in the Apple Developer Program ($99/yr), generate a Pass Type ID certificate, then implement `buildAppleWalletPass()` in `src/lib/wallet/apple.ts` (the comment there has the exact steps + library to use) | `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT_BASE64`, `APPLE_PASS_CERT_PASSWORD`, `APPLE_WWDR_CERT_BASE64` |

All of these are read from `.env` — see the comments there for exact
instructions per variable.

## Deploying

Target is Vercel (matches `bilaal-tv-web`). Swap the Prisma `datasource` in
`prisma/schema.prisma` from `sqlite` to `postgresql`, point `DATABASE_URL` at
a real Postgres instance (Vercel Postgres/Supabase/Neon all work), run
`prisma migrate deploy`, and set a real `AUTH_SECRET`.
