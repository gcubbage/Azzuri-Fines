# ⚽ Azzuri Fines

A simple, mobile-friendly fines tracker for a soccer team. Assign fines to
players each round, track who owes what (including partial payments), and export
everything to CSV.

Built with **Next.js (App Router)** + **Supabase (Postgres)**, deployed on
**Vercel**.

## Features

- **Assign page** — enter a round name (e.g. "Round 3"), tap players to add fines
  from the fixed 2025 PSC fines list, then save the whole batch at once. The same
  fine can be added multiple times per player.
- **Summary page** — fines grouped per player and per round with date stamps;
  running totals of owed / paid / remaining; record full or partial payments;
  one-tap CSV export.
- **Players page** — add, rename, and remove players.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Vercel](https://vercel.com) account (free tier is fine)
- Node.js 18+ for local development

## 1. Set up the database (Supabase)

1. Create a new Supabase project.
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Open another query, paste [`supabase/seed.sql`](supabase/seed.sql), and run it.
   This loads the 31 fines from the 2025 sheet. (Re-running it is safe — it
   reloads the list.)
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run locally

```bash
cp .env.local.example .env.local   # then paste in your Supabase URL + anon key
npm install
npm run dev
```

Open http://localhost:3000 (best viewed at a phone width). Add a few players on
the **Players** page, then start assigning fines.

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo (it auto-detects Next.js).
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your Supabase values.
4. Deploy. Your live URL works on any phone — no install needed.

## Security note (open access)

This app is intentionally **open**: there is no login, and the Supabase Row Level
Security policies allow the anon key full read/write. Anyone with the link (and
the link is hard to guess) can view and edit fines. That keeps setup dead simple
for a team. If you later want to lock it down, add Supabase Auth and tighten the
`anon_all` policies in `supabase/schema.sql`.

## CSV format

Export produces one row per fine
(`Player, Round, Fine, Description, Amount, Date`), followed by a per-player
balance summary (`Total Owed, Total Paid, Remaining`) and a grand total — ready
to open in Excel or Google Sheets.

## Data model

| Table        | Purpose                                                        |
| ------------ | ------------------------------------------------------------- |
| `players`    | The squad.                                                    |
| `fine_types` | The fixed 2025 fines list (name, description, amount).         |
| `fines`      | Each assigned fine (player, round, snapshotted amount, date).  |
| `payments`   | Each payment toward a player's balance (amount, note, date).   |

Balances are computed on the fly: `remaining = sum(fines) − sum(payments)`.
