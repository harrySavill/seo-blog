# CSV to SEO Blog Generator

Upload a company dataset (CSV) and get an SEO-optimised blog page with AI-written copy, computed statistics and a ranking table. Built with Nuxt for the Beauhurst technical assessment.

- **Live app:** https://seo-blog-murex-ten.vercel.app/
- **Sample dataset:** `/sample-fintech.csv` (the top 100 UK fintech companies). The upload page has a button that generates a blog from it.

## Tools used

| Tool | Purpose |
|---|---|
| Nuxt 4 (Vue, TypeScript) | Server-rendered pages and API routes |
| Papa Parse | CSV parsing |
| Google Gemini API (`@google/genai`) | Blog copy generation, with model fallback |
| Zod | Validating the LLM's JSON output |
| Supabase (Postgres) | Storing generated blogs |
| Vercel | Hosting |

## How it works

1. The user uploads a CSV on `/`, with an optional dataset name.
2. `POST /api/generate` validates it (size, row count, file type) and hashes it. If the same file was generated before, it returns the existing page without calling the AI.
3. The CSV is parsed, and `computeStats` works out each column's type (numeric, category, multi-value, text) and computes totals, medians, top-10 share and breakdowns. Nothing is hardcoded to a particular dataset.
4. Gemini receives only the computed statistics and a five-row sample, and returns structured JSON (title, meta description, intro, sections). The output is validated with Zod.
5. The blog is saved to Supabase and the user is redirected to `/blog/<slug>`.
6. `/blog/[slug]` is server-rendered from the stored record, so crawlers receive the full HTML, title and meta tags.

### Separation of concerns

| Layer | What it holds | Where |
|---|---|---|
| Dataset | Parsed rows and computed statistics | `server/utils/dataset.ts`, `server/utils/stats.ts` |
| AI content | Title, meta description, intro, sections | `server/utils/generate.ts` |
| Storage | One database record per blog | `server/utils/blogStore.ts` |
| Presentation | One template for every blog | `pages/blog/[slug].vue` |

The blog template renders whatever `{ content, stats, rows }` it receives, and swapping the storage backend only touches `blogStore.ts`.

## Run locally

**Requirements:** Node.js 22.22.3+ or 24.15+ (Nuxt 4.6 requires it), npm, a free [Google AI Studio](https://aistudio.google.com) API key and a free [Supabase](https://supabase.com) project.

1. Clone the repo and install dependencies:
   ```bash
   git clone http://github.com/harrySavill/seo-blog
   cd seo-blog
   npm install
   ```
2. In the Supabase SQL editor, create the table:
   ```sql
   create table blogs (
     slug text primary key,
     content_hash text unique not null,
     dataset_name text not null,
     content jsonb not null,
     stats jsonb not null,
     data_rows jsonb not null,
     created_at timestamptz not null default now()
   );
   alter table blogs enable row level security;
   ```
   Row Level Security with no policies means only the server, using the secret key, can access the table.
3. Copy `.env.example` to `.env` and fill in the values (see below).
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Configuration

| Variable | Required | Description |
|---|---|---|
| `NUXT_GEMINI_API_KEY` | Yes | Gemini API key |
| `NUXT_SUPABASE_URL` | Yes | Supabase project URL |
| `NUXT_GEMINI_MODEL` | No | Primary model (default `gemini-3.8-flash`) |
| `NUXT_GEMINI_FALLBACK_MODELS` | No | Comma-separated fallbacks tried in order on 429, 404 or 503 |

## Deployment

Deployed on Vercel from the `main` branch. Set the three required variables in the project settings, and use Node 24.

## Limits and known limitations

- Uploads are capped at 1 MB and 500 rows, and must be `.csv`.
- Column types are detected by heuristics (for example, a column is "numeric" if 90% of values parse as numbers), which can misclassify unusual data.
- The AI is given computed figures only, but its prose is not fact-checked automatically.
- The free Gemini tier has small daily quotas, so heavy use will hit them