# Recomp OS

A mobile-first, offline personal fitness PWA. React 19, TypeScript, Vite, Motion, Lucide, Recharts, IndexedDB and Workbox. No backend, account, telemetry, calorie counting, or cloud sync. The exercise library starts **completely empty**.

## Run

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

```sh
npm test                 # core model and backup validation
npm run build            # TypeScript + production PWA
npm run preview          # production preview, including service worker
npx playwright install chromium
npm run test:e2e         # desktop and iPhone-sized browser workflows
```

The development server does not install a service worker. Use the production preview to test installation and offline use. Tests use isolated browser contexts and never touch your personal app data.

## Daily use

- Start with the Dashboard. Select any day, previous/next week, or Today. Log total phone/watch steps, standing minutes, water, and your checklist.
- Create exercises with an immediate working weight, units, load meaning (including **per dumbbell**), sets, reps, equipment, and notes. Search, sort, filter, edit, delete, and inspect history in Exercise Library.
- In Workouts, select a day and add exercises from your library. The same exercise can be assigned to different days. Adjust prescribed weights, sets/reps, and ordering independently.
- Start a session to copy the template into an independent dated workout. Enter each set’s actual weight/reps, mark sets complete, and keep warm-ups separate. Cardio tracks distance, unit, duration, incline, and speed. Complete the session for a summary and strength history. Only checked working sets in finished sessions count toward strength history.
- Previous sessions remain accessible by selecting their day, or in Progress. Historical edits are explicit and never update library working weights or templates. Editing a library item likewise does not silently overwrite existing templates.
- Habits includes meal notes, simple protein checklists, optional approximate grams, sleep, office movement, and weekly history. Numeric goals automatically complete; checkboxes can manually override them. Changing a numeric value clears its override. Settings controls targets, enablement, optional status, and applicable days. Optional/disabled habits are excluded from consistency. Workout streaks skip rest days.
- Progress contains daily weights, weekly averages, measurements, actual strength charts/records, a 12-week overview, and private local photos with before/after comparison. The starting weight stays unconfirmed until an entry is saved. One measurement per kind/unit/date is kept; saving again replaces that entry.
- Photos are JPEG, PNG, or WebP, up to 12 MB each. They stay on this device and are included in backup exports. Photo date uses the selected calendar date. Exported backups contain sensitive photos: store them privately.

The default plan starts November 16, 2026; change it in Settings. Monday–Friday uses the modified Arnold split, Saturday is optional, and Sunday is rest. No exercises are prescribed automatically. Incline walking progresses gradually; Wednesday cardio stays easy/optional. The app never adds cardio steps to manual daily step totals. A flexible protein goal and hydration goal can be customized without calorie tracking.

## Persistence, privacy, and backups

`src/model.ts` separates reusable exercises, workout templates, session snapshots, per-set logs, daily habit values/overrides, body measurements, photos, and settings. `src/db.ts` uses a versioned IndexedDB database (`recomp-os`, version 1). The upgrade callback is the extension point for future migrations. Writes are serialized; failures are shown with an export action rather than silently discarded. App refreshes, normal updates, and browser restarts retain the database. No authentication or synchronization is implemented.

Settings → **Export all data** downloads a versioned JSON backup with photos. **Import backup** validates nested records and settings, then asks for explicit replacement confirmation. Invalid data leaves the existing state untouched. Restore replaces the full dataset; it does not merge records. Browser storage can be cleared or evicted, so export regularly. Data is isolated by browser and origin, including local development versus a deployed site.

Fonts and assets are bundled locally. No app data or photos are sent to an external server. Service worker caching only includes static app assets; user data remains in IndexedDB. Updates do not clear the database. Close existing app tabs and reopen online to activate an available service-worker update.

## GitHub Pages (manual, not automatically deployed)

Relative asset paths, manifest scope/start URL, and the generated service worker support `/health/` or another repository subpath.

1. Merge the application branch into the default branch.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the source.
3. In **Actions**, select **Deploy GitHub Pages (manual)** → **Run workflow**.
4. Open the deployment URL reported by the workflow.

The deployment workflow has only `workflow_dispatch`: pushing code does **not** publish the app. The separate check workflow builds and tests changes. HTTPS is required for service workers (localhost is allowed for development). A public GitHub Pages deployment exposes the application source/assets, while each visitor’s fitness data remains local to their browser.

## Install on iPhone

1. Open the deployed HTTPS URL in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Launch from the new icon while online once; allow initial asset caching to complete.
4. Reopen normally or offline. There is no Apple Health integration in V1; enter total daily steps manually.

## Structure

- `src/App.tsx`: responsive screens, accessible dialogs, local logging workflows
- `src/style.css`: design tokens, dark/light themes, mobile navigation, reduced motion
- `src/model.ts`: types, defaults, date logic, history, streaks, validation
- `src/db.ts`: IndexedDB persistence boundary
- `public/`: bundled fonts and app icons
- `tests/model.test.ts`: core data invariants
- `tests/e2e/`: critical browser workflow on desktop and iPhone viewport
- `.github/workflows/`: checks and opt-in Pages deployment

There are no seeded performance records, demo exercises, or estimated starting weights presented as confirmed data.
