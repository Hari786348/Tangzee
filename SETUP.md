# Tangzee — Setup Guide (Phone-Friendly, Browser-Only)

This covers what YOU need to do in a browser. No terminal, no laptop.

## Step 1 — Put the code on GitHub (browser)
1. Go to github.com → sign up/log in.
2. Tap **+** → **New repository** → name it `tangzee` → Create.
3. On the repo page, tap **Add file → Upload files**, and upload every
   file from this project (keeping the folder structure: app/, lib/,
   supabase/, package.json, etc). Commit.

## Step 2 — Create your Supabase project (browser)
1. Go to supabase.com → sign up/log in.
2. **New project** → name it `tangzee`, set a database password (save it
   somewhere safe), choose a region near your shop → Create.
3. Once it's ready, open **SQL Editor → New query**.
4. Open `supabase/schema.sql` from this project, copy all of it, paste
   it into the SQL editor, tap **Run**. This creates every table and all
   the server-side business rules in one go.
5. Go to **Project Settings → API**. You'll need three values for Step 4:
   - `Project URL`
   - `anon public` key
   - `service_role` key (tap "reveal") — keep this one secret, never put
     it in the browser-facing code.

## Step 3 — Create your first owner login (browser)
1. In Supabase, go to **Authentication → Users → Add user** → enter your
   email + a password → Create user.
2. Go to **Table Editor → admin_users → Insert row**:
   - `auth_user_id`: paste the user id you just created (visible in the
     Authentication → Users list)
   - `role`: `owner`
   - `active`: true

## Step 4 — Deploy to Vercel (browser)
1. Go to vercel.com → sign up/log in with your GitHub account.
2. **Add New → Project** → select your `tangzee` repo → Import.
3. Before deploying, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
4. Tap **Deploy**. Vercel builds and hosts it — this is the one step
   that genuinely can't run inside a phone browser locally, but you never
   touch a terminal either; Vercel's cloud does the build for you.
5. You'll get a live URL like `tangzee.vercel.app`. `/admin/login` is
   your owner login; `/campaign/TZ001` is what a QR code would open.

## Step 5 — Email verification (OTP) — Resend (browser)
OTP is wired into the claim flow and /my-journey using email (via
Resend), not phone/SMS — email is free up to 3,000 sends/month, no
payment method needed to get started. Set it up entirely in your
phone's browser:

1. Go to resend.com → sign up.
2. Go to **API Keys → Create API Key**. Copy the key (starts with `re_`).
3. In Vercel, go to your project → **Settings → Environment Variables**
   and add:
   - `RESEND_API_KEY` — the key from step 2
   - `OTP_SESSION_SECRET` — any long random string (this signs the
     verified-email cookie; generate one at random.org/strings or
     just mash your keyboard for 40+ characters)
4. Redeploy (Vercel → Deployments → tap the latest → Redeploy) so the
   new environment variables take effect.

Note: by default, OTP emails send from `onboarding@resend.dev` (Resend's
shared test address), which reliably delivers to any inbox for testing
but can land in spam for real customers. Before going live, go to
Resend → **Domains → Add Domain**, verify a domain you own (e.g.
`tangzee.in`), then change the `from` address in
`app/api/otp/send/route.js` to something like
`Tangzee <hello@tangzee.in>`.

## What's built (complete)
Full database schema + all server-side rules, dessert menu + owner
management, Counter Mode, campaigns with QR generate/download, customer
/my-journey dashboard, owner analytics, OTP verification via email (Resend),
homepage + brand shell with your logo, "Only 1 Difference" info page,
and the audit log viewer.

This is the complete build from the spec. Nothing left needs new
architecture — from here it's your own content (real desserts, real
campaigns, shop address/hours) plus the setup steps above.
