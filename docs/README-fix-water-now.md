# Fix: Water Now Button (`fix-water-now` Branch)

## Objective
Ensure the “Water Now” button successfully triggers watering behavior from the **deployed web app**, just as it does when running locally.

---

## Problem Summary
- ✅ Works locally (via `localhost:5173`)
- ❌ Does **not** work when deployed (Cloudflare Pages frontend + Supabase backend)
- the error pop-up on the website reads "⚠️ Unable to reach ESP32."
- The button click **does not activate** the relay on the ESP32 through Supabase

---

## Suspected Causes
- Incorrect Supabase endpoint or fetch URL in the deployed version
- CORS configuration issues
- Missing or misconfigured headers (e.g., `Content-Type`, `apikey`, `Authorization`)
- Cloudflare edge cache interfering with request
- Function routing issues or 404s on production

---

## Known Stack
- Frontend: React + Vite (served from Cloudflare Pages)
- Backend: Supabase (using REST or RLS policies)
- Device: ESP32 sends logs and expects trigger commands via Supabase function or table update

---

## Approach Plan
1. Confirm frontend request structure (method, headers, body)
2. Reproduce the issue using browser dev tools (Network tab)
3. Check for 403, 404, or CORS errors
4. Log responses or errors in the browser console
5. Confirm correct Supabase role, policy, and function access

---

## Tasks
- [ ] Trace the button click handler to the Supabase request
- [ ] Verify headers and environment variables are correct
- [ ] Confirm the deployed app uses the correct Supabase URL and keys
- [ ] Use try/catch with detailed logging to surface errors
- [ ] Recommend architectural fixes if applicable
