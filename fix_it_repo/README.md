# Fix It

**Upload your iOS app. Find App Store problems before Apple does.**

Fix It is an App Store preflight tool for iOS developers. Upload an IPA or ZIP, run deterministic guideline checks, and get actionable findings, remediations, and a submission readiness report.

It is a structured inspection engine — not a chat interface.

---

## What it does

1. Upload an iOS app (IPA / ZIP)
2. Extract a normalized app profile (bundle ID, Info.plist, permissions, entitlements, frameworks, metadata)
3. Run a deterministic rule engine mapped to App Store Review Guidelines
4. Optionally enrich findings with AI explanations and code/config patches
5. Track finding status, re-run audits, and compare diffs
6. Export a final readiness report (Markdown or PDF)

---

## Features

- **Dashboard** — Manage apps, risk levels, and open issues
- **Rule engine** — 20+ checks mapped to Apple guidelines (privacy, payments, metadata, Sign in with Apple, and more)
- **Findings & fixes** — Evidence, verification steps, Swift / Info.plist patches, status tracking
- **Audit diff** — Compare runs: resolved, remaining, and new issues
- **Rejection Solver** — Paste Resolution Center text for explanations and reviewer reply drafts
- **Metadata checker** — Character limits and Guideline 2.3 checks
- **Screenshot validator** — Dimension checks for common iPhone / iPad sizes
- **Submission report** — Readiness score, checklist, and export
- **Legal pages** — Privacy, Terms, DPA, Cookies, Refunds

---

## Tech stack

| Layer | Stack |
|--------|--------|
| UI | React 19, TypeScript, Vite 6, Tailwind CSS 4, Lucide, Motion |
| API | Express (mounted at `/api` during Vite dev) |
| Auth & data | Firebase Auth + Firestore (with local persistence for audits) |
| Parsing | JSZip + in-app extraction (`src/engine`) |
| AI | Google Gemini (`@google/genai`) via `GEMINI_API_KEY` |

---

## Quick start

**Requirements:** Node.js 18+ and npm

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env` and fill in what you need:

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | For AI features | Rejection analysis, finding explanations, reviewer drafts |
| `PORT` | No | Server port (default `3000`) |
| `NODE_ENV` | No | `development` / `production` |
| `VITE_SITE_URL` | For production | Public site URL |
| `VITE_SUPPORT_EMAIL` | For production | Support contact |
| `VITE_LEGAL_EFFECTIVE_DATE` | For production | Legal pages effective date (`YYYY-MM-DD`) |
| `VITE_ANALYTICS_ENDPOINT` | No | Optional consent-gated analytics |
| `VITE_ERROR_REPORTING_ENDPOINT` | No | Optional error reporting |

Firebase is configured in `src/services/firebaseConfig.ts` / `firebase-applet-config.json`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + API on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run clean` | Remove `dist` and `server.js` |

---

## Project structure

```
fix-it/
├── server.ts                 # Express API
├── vite.config.ts            # Vite + Tailwind + /api bridge
├── firestore.rules           # Firestore security rules
├── public/                   # Static assets, robots, sitemap
└── src/
    ├── App.tsx               # Authenticated app shell
    ├── main.tsx              # Entry + legal routes
    ├── components/           # Landing, dashboard, audit UI, tools
    ├── config/site.ts        # Public site config
    ├── engine/               # Extractor, rules, evaluator
    ├── server/               # Gemini service helpers
    ├── services/             # Auth, Firebase, store, API client
    └── types/                # Shared TypeScript types
```

---

## Privacy notes

- Uploads are processed for inspection; binaries are not exposed via public upload URLs
- Developer artifacts are not used to train models
- See `/privacy`, `/terms`, `/dpa`, `/cookies`, and `/refunds` for full policies

---

## Disclaimer

Fix It provides automated preflight risk assessments based on publicly available Apple App Store Review Guidelines. It is **not affiliated with Apple Inc.** and does not guarantee App Review approval or overturn review decisions.
