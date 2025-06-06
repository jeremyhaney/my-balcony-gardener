# My Balcony Gardener - Refactored

Smart irrigation system for balcony gardening using ESP32 and Supabase.

## Architecture Overview

- **ESP32 Firmware**: Reads sensors, controls water pump, posts to Supabase
- **Supabase Backend**: Stores sensor logs with RLS
- **React Dashboard**: Visualizes data, triggers manual watering
- **Deployment**: Frontend on Cloudflare Pages, ESP32 on local network

## Quick Start

### 1. Configure ESP32 Firmware

Edit `src/config.h`:
```c
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
```

### 2. Build and Upload Firmware

```bash
# Using PlatformIO
pio run -t upload
```

### 3. Configure Frontend

Copy and edit the environment file:
```bash
cd mbg_dashboard
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials and ESP32 IP
```

### 4. Run Frontend Development Server

```bash
cd mbg_dashboard
npm install
npm run dev
```

### 5. Build for Production

```bash
cd mbg_dashboard
npm run build
# Deploy dist/ folder to Cloudflare Pages
```

## API Endpoints

- `GET /` - Health check
- `GET /logs` - Get current sensor readings
- `POST /water-now` - Trigger manual watering

## Supabase Schema

Table: `sensor_logs`
- `device_id` (uuid)
- `temperature` (float)
- `humidity` (float)
- `moisture` (int)
- `watering` (boolean)
- `lastWateredTime` (text)
- `lastWateringDuration` (int)
- `timestamp` (timestamptz)

## Hardware

- ESP32 DOIT DevKit V1
- DHT11 Temperature/Humidity Sensor
- Capacitive Soil Moisture Sensor
- 5V Relay Module
- 12V Water Pump

## Version

v1.0.0_refactored - Follows PRD modular architecture
