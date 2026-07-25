# APB Seattle

A mostly static web application for Animal Project Buddies Seattle chapter, featuring a landing page, metrics tracking system, and Discord bot integration.

## Tech Stack

### Runtime & Server
- **[Next.js](https://nextjs.org/)** - React framework with API routes
- **[Vercel](https://vercel.com/)** - Deployment platform
- **TypeScript** - Type-safe JavaScript with strict mode enabled

### Backend & Database
- **[Nhost](https://nhost.io/)** - Backend-as-a-Service platform providing:
  - **PostgreSQL** - Primary database
  - **Hasura** - GraphQL API layer with real-time subscriptions
  - **Auth** - Authentication service
  - **Storage** - S3-compatible file storage (MinIO)
  - **Functions** - Serverless functions

### Frontend
- **HTML/CSS/JS** - Static landing page served from `public/`
- **Responsive design** - CSS Grid and Flexbox

### Integrations
- **Discord.js** - Bot for serving community statistics via slash commands

## Project Structure

```
are-seattle/
├── public/
│   ├── index.html          # Landing page
│   ├── styles.css          # Landing page styles
│   ├── impact-animation.js # Client-side animations
│   └── assets/             # Images and media
├── app/
│   ├── layout.tsx          # Next.js root layout
│   ├── page.tsx            # Redirects to index.html
│   └── api/
│       ├── health/route.ts # Health check endpoint
│       ├── impact/route.ts # Impact metrics endpoint
│       └── projects/route.ts # Projects endpoint
├── functions/              # Nhost serverless functions
├── nhost/
│   ├── nhost.toml          # Nhost configuration
│   ├── migrations/         # Database migrations
│   ├── metadata/           # Hasura metadata
│   └── seeds/              # Database seeds
└── docs/
    └── plans/              # Design documents
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- [Nhost CLI](https://docs.nhost.io/development/cli) for local development
- Docker (for running local Nhost stack)

### Installation

```bash
# Install dependencies
npm install
# or
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your Nhost credentials
```

### Local Development

```bash
# Start the Nhost local development stack
nhost up

# Run the Next.js dev server
npm run dev
# or
bun run dev
```

The server runs on `http://localhost:3000` by default.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NHOST_SUBDOMAIN` | Your Nhost project subdomain |
| `NHOST_REGION` | Nhost region (e.g., `us-west-2`) |
| `NHOST_GRAPHQL_SECRET` | Hasura admin secret |
| `DISCORD_TOKEN` | Discord bot token |
| `DISCORD_CLIENT_ID` | Discord application client ID |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Landing page (static HTML) |
| `GET /api/health` | Health check |
| `GET /api/impact` | Impact metrics |
| `GET /api/projects` | Projects list |

## Deployment

### Vercel

The app is deployed to **Vercel** with Next.js:

1. Connect your repo to Vercel
2. Set environment variables in Vercel Dashboard:
   - `NHOST_SUBDOMAIN`
   - `NHOST_REGION`
   - `NHOST_GRAPHQL_SECRET`
3. Deploy - Vercel auto-detects Next.js

### Nhost (Database)

The backend database is hosted on **Nhost**, providing managed PostgreSQL and Hasura GraphQL.

## Syncing projects from the Google Sheet

The **[APB projects sheet][projects-sheet]** is the source of truth for project metadata.
The landing page carousel and its detail modals render straight from it.

| What | Where |
|---|---|
| Sync logic | `lib/sync-projects.ts` |
| CLI | `scripts/sync-projects-from-sheet.ts` |
| HTTP endpoint | `app/api/projects/sync/route.ts` |
| Sheet menu (Apps Script) | `scripts/projects-sheet-apps-script.gs` |

The columns themselves are added by `1784950000000_add_project_sheet_columns` in the
`backend_migrations` submodule. **Nothing under `app/` or `lib/` may import from that
submodule** — it's private and this repo is public, so Vercel can't clone it during a
build and the import fails there while compiling fine locally.

### From the command line

```bash
bun run scripts/sync-projects-from-sheet.ts --dry-run   # print the diff, write nothing
bun run scripts/sync-projects-from-sheet.ts             # apply
```

Needs `NHOST_SUBDOMAIN`, `NHOST_REGION` and `NHOST_GRAPHQL_SECRET` (Bun auto-loads
`.env`). The sheet is read through its public CSV export, so no Google credentials are
involved — but link sharing has to stay on.

Sheet columns map to `projects` like this:

| Sheet | Column |
|---|---|
| Project | `project_name` (and, slugified, `project_handle`) |
| Main Category | `main_category` |
| Status | `status` |
| Owner | `owner` |
| Other Members Involved | `other_members` |
| Description of Project | `project_description` |
| Links or Website | `project_website` (first URL) |
| Impact | `impact` |
| Deprecated | `deprecated` |

Notes:

- **The sync never deletes.** `project_handle` is a foreign key target for
  `account_snapshots` / `project_snapshots`, so a project that vanishes from the sheet is
  reported as an orphan and left alone. To retire a project set **Deprecated = TRUE** in
  the sheet; `/api/projects` filters those out.
- **Handles are stable.** A few projects predate the sheet and their handle doesn't match
  the slug of their sheet name (`Chicken Nor Egg - Social Media` → `chicken-nor-egg`).
  Those live in `HANDLE_OVERRIDES`. Renaming a project in the sheet without adding an
  override creates a *second* row and orphans the original's snapshot history.
- Scheme-less cells get `https://` prepended, and only the first URL of a multi-link cell
  lands in `project_website`.
- `owner_email` isn't in the sheet and is never touched.

### From the sheet itself (Apps Script)

Non-technical editors can run the same sync from an **APB** menu in the sheet, which
calls `POST /api/projects/sync`.

The Apps Script deliberately holds only a scoped sync key, **never the Hasura admin
secret**: anyone who can edit the sheet can read its Script Properties, and the admin
secret would hand them the whole database. A leaked sync key only lets someone trigger a
sheet→database sync, which is idempotent.

Setup, once:

1. **Generate a key** — `openssl rand -hex 32`
2. Add it as `PROJECTS_SYNC_API_KEY` to `.env` and to the Vercel project's environment
   variables, then redeploy
3. Sheet → **Extensions → Apps Script** (it must be opened from the sheet, so the script
   is bound to it)
4. Paste `scripts/projects-sheet-apps-script.gs` over `Code.gs`, save. There is no
   "Deploy" step — `onOpen` menus just need a save and a reload
5. **Project Settings → Script Properties**:
   - `SYNC_URL` — `https://www.animalprojectbuddies.com/api/projects/sync`
   - `API_KEY` — the key from step 1
6. Reload the spreadsheet; an **APB** menu appears. The first run asks for authorisation

Use the **`www`** host in `SYNC_URL`. The bare domain 308-redirects, and `UrlFetchApp`
can drop the `x-api-key` header or downgrade the POST to a GET when following it — the
same trap documented in `scripts/ideas-sheet-apps-script.gs`.

The menu has **Preview sync** (reports, writes nothing) and **Sync projects to prod**.
Both show what was inserted, updated (and which fields), unchanged, and any projects in
the database missing from the sheet.

The `.gs` files here are copies for version control — nothing pushes them to the sheets,
so re-paste after editing.

[projects-sheet]: https://docs.google.com/spreadsheets/d/1b2R5Qdnx8CwC-TjFKZ-T0DfZij5hE2zoPNKeHlT17Ro/edit?gid=1901933999

## Customization

### Colors
Edit CSS variables in `public/styles.css` to change the color scheme:
```css
:root {
    --primary-color: #2d5a3d;  /* Main green */
    --accent-color: #f4a261;   /* Orange accent */
}
```

### Content
All landing page content is in `public/index.html`. Edit the text in each section to customize.

## License

Private - APB Seattle
