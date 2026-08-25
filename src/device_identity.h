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

namespace mbg_device_profile {
constexpr bool stringsEqual(const char* left, const char* right) {
  return *left == *right && (*left == '\0' || stringsEqual(left + 1, right + 1));
}
}

#if MBG_PROFILE_BALCONY02
static_assert(mbg_device_profile::stringsEqual(MBG_DEVICE_LABEL, "Balcony02"), "Unsupported Balcony02 device label");
static_assert(mbg_device_profile::stringsEqual(MBG_DEVICE_ID, "7e5bd328-ad68-4389-a71a-fa5cd01b3813"), "Unsupported Balcony02 device UUID");
static_assert(mbg_device_profile::stringsEqual(MBG_DEVICE_ROLE, "controller"), "Unsupported Balcony02 device role");
#elif MBG_PROFILE_PROTOTYPE02
static_assert(mbg_device_profile::stringsEqual(MBG_DEVICE_LABEL, "Prototype02"), "Unsupported Prototype02 device label");
static_assert(mbg_device_profile::stringsEqual(MBG_DEVICE_ID, "a5c59d97-5687-483c-8773-86c9e6a84aea"), "Unsupported Prototype02 device UUID");
static_assert(mbg_device_profile::stringsEqual(MBG_DEVICE_ROLE, "bench"), "Unsupported Prototype02 device role");
#else
#error "Unsupported firmware profile selector"
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
