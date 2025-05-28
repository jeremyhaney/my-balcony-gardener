# My Balcony Gardener: Product Requirements Document (PRD)

**Purpose**
Ensure all development and refactoring efforts—across Windsurf and VS Code—conform to the locked-down architecture for MBG. Prevent reintroduction of deprecated files, stray logic, or violations of modularity, performance, or UI goals.

---

## I. Project Summary

**System Name:** My Balcony Gardener
**Core Device:** ESP32 (DOIT DevKit V1)
**Development Stack:**
- **Firmware:** Arduino via PlatformIO
- **Backend:** Supabase (RESTful API, RLS-enabled)
- **Frontend:** React (Vite), deployed via Cloudflare Pages
- **Live Tunnel:** Cloudflared for local development

---

## II. Architectural Requirements

### 1. Sensor and Device Responsibilities
- ESP32 logs `temperature`, `humidity`, `moisture`, `watering`, `lastWateredTime`, `lastWateringDuration`
- Logs sent as structured JSON to Supabase every 5 seconds
- Manual override ("Water Now") supported from web UI

### 2. Modularization (Strict Enforcement)
- `main.cpp` only handles ESP32 sensor reading, relay control, and HTTP endpoints
- `LiveStats.tsx` only handles Supabase data fetch and visualization
- All API URLs and table names are centralized in a config
- Separation of concerns: no business logic in frontend display code

### 3. Networking & Data Flow
- ESP32 sends data directly to Supabase (no proxy backend)
- Cloudflare tunnel supports local dev via static dashboard
- No embedded React dashboard on ESP32; React is hosted independently

### 4. RLS & Security (Supabase)
- Role-based access enforced on `sensor_logs` table
- Only authenticated writes allowed; public read-only views used for display
- No client writes from the dashboard

### 5. Visualization Goals
- Data plotted in real-time in browser using `Recharts`
- Last watering duration shown as persistent label
- Responsive layout for mobile access

---

## III. Windsurf Integration Checklist ✅

Use this for every refactor review.

| Goal                             | Description                                                                 |
|----------------------------------|-----------------------------------------------------------------------------|
| 🔁 Code Isolation                | Each component should be strictly single-purpose                           |
| 📁 Remove Legacy Files           | Eliminate unused `.js` or `.html` files from prior embedded dashboards     |
| 🧠 Smart Refactor Suggestion Vetting | Refactor suggestions must preserve local-only architecture and endpoint specs |
| ⚙️ Static Assets Only            | Only serve built assets from `vite build`                                  |
| 📊 Data Flow Validation          | Ensure no changes to `/logs`, `/water-now`, or Supabase schema             |
| 📦 Eliminate Duplicate State     | Data should not be stored redundantly across frontend or sketch code       |

---

## IV. VS Code Dev Checklist ✅

Use this daily for safe micro-updates.

| Rule                            | Description                                                                 |
|----------------------------------|-----------------------------------------------------------------------------|
| 🧪 All Changes in Git Branches   | Feature branches only; never develop on `main`                             |
| 🧼 Enforce Linting and Formatting | Prettier + ESLint enabled, auto-format on save                             |
| 🗂️ Folder Hygiene                | Never commit `dist`, `.pio`, or legacy web UI folders                      |
| 🔐 Supabase Secured              | Validate `.env` file contains only public keys on client                   |
| 📈 Logging Validation            | Log shape must match Supabase expectations (5 fields minimum)              |
| 💧 Water Trigger Isolation       | Ensure only `/water-now` triggers the relay logic                          |

---

## V. Codebase Hygiene & Cleanup Plan

1. **Delete legacy frontend files:**
   - `/public/index.html` (if unused)
   - Any `.js` files not imported by `main.tsx` or `App.tsx`
   - Old sketch references with embedded dashboards

2. **Enforce strict source layout**
   - `/src/components/LiveStats.tsx` — data visualization only
   - `/src/components/SensorLogViewer.tsx` — log inspection only
   - `/src/api/` folder — store API functions (fetchLogs, triggerWaterNow)

3. **Verify Supabase tables**
   - `sensor_logs`: Required fields — `temperature`, `humidity`, `moisture`, `watering`, `lastWateredTime`, `lastWateringDuration`
   - No legacy or staging tables should exist in production

---

## VI. Versioning & Deployment Rules

- **Tag Each Commit:** Use Git tags like `v1.2.5_fix-waternow-route`
- **Changelog Required:** Every commit touching architecture or logic must update `/CHANGELOG`
- **CI/CD Future-Ready:** When implemented, build must pass lint + test checks before deploy

---

## VII. Final Notes

This PRD replaces the use of the term “Option C.” This is now the official and locked-down architecture of My Balcony Gardener.

All tools—Windsurf, VS Code, PlatformIO—must conform to this single source of truth. All refactoring suggestions, manual updates, and integrations must cross-reference this document. No exceptions.
