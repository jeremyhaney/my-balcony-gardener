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

static_assert(
  mbg_firmware_profile::stringsEqual(MBG_BUILD_PROFILE, "balcony02-gen2"),
  "Unsupported build profile: add an explicit current Gen2 profile and static contract before building"
);

#endif
