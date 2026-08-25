#ifndef FIRMWARE_IDENTITY_H
#define FIRMWARE_IDENTITY_H

#ifndef MBG_FIRMWARE_VERSION
#error "MBG_FIRMWARE_VERSION must be defined by an explicit firmware device profile"
#endif

#ifndef MBG_BUILD_PROFILE
#error "MBG_BUILD_PROFILE must be defined by an explicit firmware device profile"
#endif

namespace mbg_firmware_profile {
constexpr bool stringsEqual(const char* left, const char* right) {
  return *left == *right && (*left == '\0' || stringsEqual(left + 1, right + 1));
}
}

#if MBG_PROFILE_BALCONY02
static_assert(mbg_firmware_profile::stringsEqual(MBG_BUILD_PROFILE, "balcony02-gen2"), "Unsupported Balcony02 build profile");
static_assert(mbg_firmware_profile::stringsEqual(MBG_FIRMWARE_VERSION, "phase8g2-local-button-programs-r3"), "Unsupported Balcony02 firmware version");
#elif MBG_PROFILE_PROTOTYPE02
static_assert(mbg_firmware_profile::stringsEqual(MBG_BUILD_PROFILE, "prototype02-gen2"), "Unsupported Prototype02 build profile");
static_assert(mbg_firmware_profile::stringsEqual(MBG_FIRMWARE_VERSION, "phase8g3-prototype02-gen2-r1"), "Unsupported Prototype02 firmware version");
#else
#error "Unsupported build profile selector"
#endif

#endif
