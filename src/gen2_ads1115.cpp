#include "config.h"
#include "profile_overrides.h"
#include "gen2_ads1115.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
#include <Wire.h>

namespace {
const uint8_t ADS1115_POINTER_CONVERSION = 0x00;
const uint8_t ADS1115_POINTER_CONFIG = 0x01;
const uint16_t ADS1115_CONFIG_A0_SINGLE_SHOT = 0xC383;

String hexAddressValue(uint8_t address) {
  String response = "0x";
  if (address < 0x10) {
    response += "0";
  }
  response += String(address, HEX);
  return response;
}

bool i2cAddressResponds(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

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

bool writeAds1115Register(uint8_t reg, uint16_t value) {
  Wire.beginTransmission(MBG_ADS1115_ADDRESS);
  Wire.write(reg);
  Wire.write((value >> 8) & 0xFF);
  Wire.write(value & 0xFF);
  return Wire.endTransmission() == 0;
}

bool readAds1115Conversion(int16_t &rawAdc) {
  Wire.beginTransmission(MBG_ADS1115_ADDRESS);
  Wire.write(ADS1115_POINTER_CONVERSION);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  if (Wire.requestFrom(static_cast<uint8_t>(MBG_ADS1115_ADDRESS), static_cast<uint8_t>(2)) != 2) {
    return false;
  }

  uint8_t high = Wire.read();
  uint8_t low = Wire.read();
  rawAdc = static_cast<int16_t>((high << 8) | low);
  return true;
}

bool readAds1115A0SingleShot(int16_t &rawAdc) {
  if (!writeAds1115Register(ADS1115_POINTER_CONFIG, ADS1115_CONFIG_A0_SINGLE_SHOT)) {
    return false;
  }

  delay(10);
  return readAds1115Conversion(rawAdc);
}
}
#endif

String gen2Ads1115HexAddressJson(uint8_t address) {
#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
  return "\"" + hexAddressValue(address) + "\"";
#else
  String response = "0x";
  if (address < 0x10) {
    response += "0";
  }
  response += String(address, HEX);
  return "\"" + response + "\"";
#endif
}

Gen2Ads1115Read gen2Ads1115ReadA0() {
  Gen2Ads1115Read result;
#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
  result.muxDetected = i2cAddressResponds(MBG_I2C_MUX_ADDRESS);
  if (!result.muxDetected) {
    result.failureDetail = "mux_not_detected";
    return result;
  }

  result.disableBeforeReadOk = muxDisableAll();
  result.upstreamExpectedAddressPresent = i2cAddressResponds(MBG_ADS1115_ADDRESS);
  if (result.upstreamExpectedAddressPresent) {
    result.failureDetail = "upstream_address_conflict";
    result.disableAfterReadOk = muxDisableAll();
    return result;
  }

  result.channelSelectOk = muxSelectChannel(MBG_ADS1115_MUX_CHANNEL);
  if (!result.channelSelectOk) {
    result.failureDetail = "channel_select_failed";
    result.disableAfterReadOk = muxDisableAll();
    return result;
  }

  result.selectedChannelExpectedAddressPresent = i2cAddressResponds(MBG_ADS1115_ADDRESS);
  if (!result.selectedChannelExpectedAddressPresent) {
    result.failureDetail = "ads1115_not_detected_on_selected_channel";
    result.disableAfterReadOk = muxDisableAll();
    return result;
  }

  result.readOk = readAds1115A0SingleShot(result.rawAdc);
  result.failureDetail = result.readOk ? "" : "ads1115_conversion_read_failed";
  result.disableAfterReadOk = muxDisableAll();
#endif
  return result;
}

#endif
