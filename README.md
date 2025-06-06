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

## Data Structure

### JSON Payload Format

Example of the data structure sent to Supabase and used by the frontend:

```json
{
  "device_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-06-06T18:16:12-04:00",
  "data": {
    "temperature": 80.6,
    "humidity": 53.0,
    "moisture": 73,
    "watering": false,
    "lastWateredTime": "2025-06-06T18:10:00-04:00",
    "lastWateringDuration": 5
  }
}
```

### Field Descriptions

- **device_id**: Unique identifier for the ESP32 device (UUID v4)
- **timestamp**: ISO 8601 timestamp when the reading was taken
- **data.temperature**: Current temperature in Fahrenheit (float, 1 decimal place)
- **data.humidity**: Current relative humidity percentage (float, 1 decimal place)
- **data.moisture**: Soil moisture percentage (integer, 0-100%)
- **data.watering**: Boolean indicating if the system is currently watering
- **data.lastWateredTime**: ISO 8601 timestamp of the last watering event, or "N/A"
- **data.lastWateringDuration**: Duration of the last watering event in seconds

### Supabase Schema

Table: `sensor_logs`
- `id` (uuid, primary key) - Auto-generated UUID
- `device_id` (text) - References the ESP32 device
- `data` (jsonb) - Contains all sensor readings and state
- `timestamp` (timestamptz) - When the record was created (auto-set by Supabase)

### Local API Endpoint

The ESP32's `/logs` endpoint returns the same data structure, making it compatible with both local development and Supabase integration.

## Hardware

- ESP32 DOIT DevKit V1
- DHT11 Temperature/Humidity Sensor
- Capacitive Soil Moisture Sensor
- 5V Relay Module
- 12V Water Pump

## Version

v1.0.0_refactored - Follows PRD modular architecture
