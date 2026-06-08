#include "config.h"
#include "profile_overrides.h"
#include "gen2_i2c_mux.h"

#ifdef MBG_GEN2_ENABLED

#include <Wire.h>

namespace {
String boolString(bool value) {
  return value ? "true" : "false";
}

String hexAddressValue(uint8_t address) {
  String response = "0x";
  if (address < 0x10) {
    response += "0";
  }
  response += String(address, HEX);
  return response;
}

String hexAddressJson(uint8_t address) {
  return "\"" + hexAddressValue(address) + "\"";
}

bool i2cAddressResponds(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

String i2cAddressListJson() {
  String response = "[";
  bool hasAny = false;

  for (uint8_t address = 0x08; address <= 0x77; address++) {
    if (i2cAddressResponds(address)) {
      if (hasAny) {
        response += ",";
      }
      response += hexAddressJson(address);
      hasAny = true;
    }
  }

  response += "]";
  return response;
}

bool addressListContains(const String &addressListJson, uint8_t address) {
  return addressListJson.indexOf(hexAddressValue(address)) >= 0;
}

#if MBG_HAS_I2C_MUX
bool muxWrite(uint8_t mask) {
  Wire.beginTransmission(MBG_I2C_MUX_ADDRESS);
  Wire.write(mask);
  return Wire.endTransmission() == 0;
}

bool muxDisableAll() {
  return muxWrite(0x00);
}

bool muxSelectChannel(uint8_t channel) {
  if (channel > 7) {
    return false;
  }
  return muxWrite(1 << channel);
}

String expectedAddressListForChannel(uint8_t channel) {
  String response = "[";
#if MBG_HAS_ADS1115
  if (channel == MBG_ADS1115_MUX_CHANNEL) {
    response += hexAddressJson(MBG_ADS1115_ADDRESS);
  }
#endif
  response += "]";
  return response;
}

String expectedDeviceForChannel(uint8_t channel) {
#if MBG_HAS_ADS1115
  if (channel == MBG_ADS1115_MUX_CHANNEL) {
    return "ADS1115";
  }
#endif
  return "";
}
#endif
}

String gen2I2cMuxCapabilitiesJson() {
#if MBG_HAS_I2C_MUX
  String upstreamScan = i2cAddressListJson();
  bool muxDetected = i2cAddressResponds(MBG_I2C_MUX_ADDRESS);
  bool disableBeforeScanOk = false;
  bool channelSelectOk = false;
  bool disableAfterScanOk = false;
  String channelScan = "[]";
  bool upstreamHasExpectedAdsAddress = false;
  bool channelScanHasExpectedAdsAddress = false;
  bool ads1115Detected = false;
  String ads1115DetectionStatus = "disabled";
  String ads1115DetectionReason = "disabled";

  if (muxDetected) {
    disableBeforeScanOk = muxDisableAll();
    channelSelectOk = muxSelectChannel(MBG_ADS1115_MUX_CHANNEL);
    if (channelSelectOk) {
      channelScan = i2cAddressListJson();
    }
    disableAfterScanOk = muxDisableAll();
  }

#if MBG_HAS_ADS1115
  upstreamHasExpectedAdsAddress = addressListContains(upstreamScan, MBG_ADS1115_ADDRESS);
  channelScanHasExpectedAdsAddress = addressListContains(channelScan, MBG_ADS1115_ADDRESS);

  if (!muxDetected) {
    ads1115Detected = false;
    ads1115DetectionStatus = "mux_not_detected";
    ads1115DetectionReason = "mux_not_detected";
  } else if (!channelScanHasExpectedAdsAddress) {
    ads1115Detected = false;
    ads1115DetectionStatus = "not_detected";
    ads1115DetectionReason = "expected_address_not_seen_on_selected_channel_scan";
  } else if (!upstreamHasExpectedAdsAddress) {
    ads1115Detected = true;
    ads1115DetectionStatus = "confirmed";
    ads1115DetectionReason = "expected_address_seen_only_after_selected_channel_scan";
  } else {
    ads1115Detected = false;
    ads1115DetectionStatus = "ambiguous";
    ads1115DetectionReason = "expected_address_already_present_on_upstream_scan";
  }
#endif

  String response = "{";
  response += "\"enabled\":true,";
  response += "\"expected_address\":" + hexAddressJson(MBG_I2C_MUX_ADDRESS) + ",";
  response += "\"detected\":" + boolString(muxDetected) + ",";
  response += "\"detected_address\":";
  response += muxDetected ? hexAddressJson(MBG_I2C_MUX_ADDRESS) : String("null");
  response += ",";
  response += "\"address_pins\":{\"a0\":\"gnd\",\"a1\":\"gnd\",\"a2\":\"gnd\"},";
  response += "\"reset_handling\":\"rst_to_3v3_unless_onboard_pullup_documented\",";
  response += "\"voltage_boundary\":\"3.3V_only\",";
  response += "\"no_5v\":true,";
  response += "\"upstream_scan_before_channel_selection\":{\"addresses_found\":" + upstreamScan + "},";
  response += "\"channels\":[";
  response += "{";
  response += "\"channel\":" + String(MBG_ADS1115_MUX_CHANNEL) + ",";
  response += "\"expected_device\":\"" + expectedDeviceForChannel(MBG_ADS1115_MUX_CHANNEL) + "\",";
  response += "\"expected_addresses\":" + expectedAddressListForChannel(MBG_ADS1115_MUX_CHANNEL) + ",";
  response += "\"selected_for_scan\":" + boolString(channelSelectOk) + ",";
  response += "\"addresses_found\":" + channelScan + ",";
#if MBG_HAS_ADS1115
  response += "\"ads1115_expected_address\":" + hexAddressJson(MBG_ADS1115_ADDRESS) + ",";
  response += "\"ads1115_detected\":" + boolString(ads1115Detected) + ",";
  response += "\"ads1115_detection_status\":\"" + ads1115DetectionStatus + "\",";
  response += "\"ads1115_detection_reason\":\"" + ads1115DetectionReason + "\",";
  response += "\"upstream_expected_address_present\":" + boolString(upstreamHasExpectedAdsAddress) + ",";
  response += "\"selected_channel_expected_address_present\":" + boolString(channelScanHasExpectedAdsAddress) + ",";
#else
  response += "\"ads1115_detected\":false,";
  response += "\"ads1115_detection_status\":\"disabled\",";
  response += "\"ads1115_detection_reason\":\"disabled\",";
  response += "\"upstream_expected_address_present\":false,";
  response += "\"selected_channel_expected_address_present\":false,";
#endif
  response += "\"reason\":\"";
  response += muxDetected ? (channelSelectOk ? "scan_complete" : "channel_select_failed") : "mux_not_detected";
  response += "\"";
  response += "}";
  response += "],";
  response += "\"disable_before_scan_ok\":" + boolString(disableBeforeScanOk) + ",";
  response += "\"post_scan_all_channels_disabled\":" + boolString(disableAfterScanOk) + ",";
  response += "\"address_conflict_note\":\"upstream_0x48_may_be_direct_veml6030_when_present\"";
  response += "}";
  return response;
#else
  return "{\"enabled\":false}";
#endif
}

#endif
