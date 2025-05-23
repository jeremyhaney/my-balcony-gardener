# My Balcony Gardener Backend API

This Express API acts as a secure middleware between ESP32 devices and Supabase.

## Endpoints

- `POST /api/sensor` — Receives data from ESP32
- `GET /api/logs` — Gets recent log history
- `GET /api/latest` — Gets most recent sensor reading
- `POST /api/water-now` — Triggers watering (future)

## Run Locally

```bash
npm install
npm run dev
```
