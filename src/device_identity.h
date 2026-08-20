#pragma once

// Device Identity Configuration
//
// Device identity must be supplied by an explicit PlatformIO device environment.
//
// Device UUID is production/provisioning identity.
// Friendly names are separate user-facing labels and must not be used as telemetry identity.

#ifndef MBG_DEVICE_ID
#error "MBG_DEVICE_ID must be defined by an explicit firmware device profile"
#endif

#ifndef MBG_DEVICE_ROLE
#error "MBG_DEVICE_ROLE must be defined by an explicit firmware device profile"
#endif

#ifndef MBG_DEVICE_LABEL
#error "MBG_DEVICE_LABEL must be defined by an explicit firmware device profile"
#endif

#ifdef DEVICE_ID
#undef DEVICE_ID
#endif

#define DEVICE_ID MBG_DEVICE_ID

#ifdef DEVICE_ROLE
#undef DEVICE_ROLE
#endif

#define DEVICE_ROLE MBG_DEVICE_ROLE

#ifdef DEVICE_LABEL
#undef DEVICE_LABEL
#endif

#define DEVICE_LABEL MBG_DEVICE_LABEL
