# Media Chief

Web platform for press release distribution across 50 U.S. newspapers — one in every state — plus Facebook.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- MDX for the blog
- react-hook-form + zod for forms
- Resend for email
- Stripe for payments (USD)
- Drizzle ORM + Postgres
- Deploy: Railway

## Local dev

```bash
npm install
cp .env.example .env.local
# fill in the variables in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Railway

1. Connect the repo in the Railway dashboard.
2. Set the variables from `.env.example`.
3. Railway uses `nixpacks.toml` + `railway.json` for the build.
4. Attach the `media-chief.com` domain after the first deploy.

## Structure

- `src/app/` — App Router routes
- `src/components/` — React components
- `src/data/` — packages, newspapers, testimonials
- `src/lib/` — utilities (email, mdx, validators)
- `content/blog/` — MDX articles
- `public/` — static assets
