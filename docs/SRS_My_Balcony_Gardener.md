# Software Requirements Specification (SRS): My Balcony Gardener

## 1. Introduction

**System Name:** My Balcony Gardener (MBG)**Purpose:** To define the functional and non-functional requirements of the MBG smart irrigation and logging system, using a locked-down architecture based on ESP32 and Supabase.**Stakeholders:** Jeremy (developer), potential future users/installers, Windsurf refactoring tool

## 2. System Overview

MBG is a balcony gardening automation system built around an ESP32 microcontroller that:

- Logs environmental data (temperature, humidity, moisture)
- Activates a pump via relay on manual command
- Sends logs directly to Supabase
- Displays real-time data on a React dashboard hosted externally

## 3. User Roles

### Developer

- Full code access: firmware, frontend, backend
- Controls deployment and versioning

### User (Installer + End User)

- Connects hardware and initiates setup (planned)
- Uses web UI to view live stats and trigger watering
- No current access to configuration (planned for future)

## 4. Use Cases

### A. Automatic Sensor Logging

- ESP32 reads sensors every X seconds and logs to Supabase

### B. Manual Water Now Trigger

- User clicks dashboard button
- ESP32 activates relay and logs event

### C. View Live Stats

- Dashboard fetches and renders `sensor_logs` from Supabase

### D. Initial Setup (Planned)

- Wi-Fi provisioning via captive portal or BLE

### B.1 Future Use Cases (Planned)

- Unit toggle (°C/°F)
- Configure watering duration via UI
- Configure moisture threshold for triggering auto-watering
- Notifications (email/SMS)

## 5. Interfaces

### A. Hardware

| Component       | Description              | Part Number      |
| --------------- | ------------------------ | ---------------- |
| ESP32 DevKit    | DOIT ESP32-DEVKIT-V1     | ESP32-DEVKIT-V1  |
| Temp/Humidity   | Digital sensor           | DHT11            |
| Moisture Sensor | Analog capacitive sensor | ____             |
| Relay           | Single-channel 5V relay  | SRD-05VDC-SL-C   |
| Pump            | 12V diaphragm            | Aquavita WT-2500 |
| Tubing          | 1/2” delivery tubing     | ____             |
| Power Supply    | 12V + USB 5V split       | ____             |

### B. API Endpoints (ESP32 Local)

| Endpoint   | Method | Description                       |
| ---------- | ------ | --------------------------------- |
| /logs      | GET    | Returns latest environmental data |
| /water-now | POST   | Activates relay and logs event    |

### C. Supabase `sensor_logs`

| Field                | Type        |
| -------------------- | ----------- |
| temperature          | float       |
| humidity             | float       |
| moisture             | int         |
| watering             | boolean     |
| lastWateredTime      | timestamptz |
| lastWateringDuration | int         |

### D. Frontend (React)

- Live graphs from Supabase
- “Water Now” button
- Responsive layout

### E. Planned UI Panels (Not Yet Implemented)

- Setup wizard
- Unit toggle
- Moisture calibration
- Notification preferences
- Configurable watering duration

## 6. Constraints & Dependencies

### A. Hardware

- Must use ESP32-DEVKIT-V1 + WT-2500 pump
- Relay logic must match ESP32 voltage

### B. Architecture

- Locked-down modular structure
- React dashboard is external to ESP32
- All data goes to Supabase; no local storage or proxying

### C. Development

- PlatformIO required (COM3, 115200 baud)
- Frontend built using Vite
- Hosted via Cloudflare Pages or Express

### D. Deployment

| Item             | Constraint                                          |
| ---------------- | --------------------------------------------------- |
| Supabase Keys    | Stored only in .env.local                           |
| Tunnel           | `cloudflared` required for dev                      |
| Firmware Upload  | Only via USB + PlatformIO                           |
| Folder Structure | `C:\AIProjects\esp32_projects\My Balcony Gardener\` |

### E. Security

- Supabase RLS enforced
- Local-only `/water-now` endpoint access
- No frontend write permissions

### F. UI/UX

- Graphs load in <1s
- No advanced settings currently

### G. Data Integrity (Planned)

- Filter nonsensical values (e.g. >100% moisture)
- Clamp or discard spike readings

## 7. Validation & Testing

### A. Manual Test Scenarios

- Sensor log check in Supabase
- Water Now button triggers relay
- Dashboard loads on mobile
- Supabase RLS blocks unauthorized writes

### B. Data Verification

- Values outside expected ranges filtered
- Dashboard does not crash on missing/null data

### C. Deployment Verification

- `vite build` generates assets
- `cloudflared` tunnel exposes dashboard
- Git tags like `v0.0.3` mark valid release states

## 8. Roadmap & Future Work

### Short-Term

- Moisture calibration UI
- Configurable watering duration
- Value clamping/data filtering
- Unit toggle (°C/°F)
- Watering lockout logic

### Mid-Term

- Provisioning UI / BLE / captive portal
- Email/SMS notifications
- Frontend config state
- Multi-zone pump support

### Long-Term

- AI-assisted watering prediction
- Native mobile app (React Native)
- Alexa/Google Home integration
- OTA firmware updates
- Cloud sync with offline buffer
