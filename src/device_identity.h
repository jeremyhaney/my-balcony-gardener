#pragma once

// Device Identity Configuration
//
// MBG_DEVICE_ID may be supplied by PlatformIO build profiles.
// The fallback preserves the installed balcony unit UUID for Supabase history continuity.
//
// Device UUID is production/provisioning identity.
// Friendly names are separate user-facing labels and must not be used as telemetry identity.

#ifndef MBG_DEVICE_ID
#define MBG_DEVICE_ID "550e8400-e29b-41d4-a716-446655440000"
#endif

#ifndef MBG_DEVICE_ROLE
#define MBG_DEVICE_ROLE "controller"
#endif

#ifdef DEVICE_ID
#undef DEVICE_ID
#endif

#define DEVICE_ID MBG_DEVICE_ID

#ifdef DEVICE_ROLE
#undef DEVICE_ROLE
#endif

#define DEVICE_ROLE MBG_DEVICE_ROLE
