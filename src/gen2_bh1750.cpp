#include "config.h"
#include "profile_overrides.h"
#include "gen2_bh1750.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
#include <Wire.h>

namespace {
const uint8_t BH1750_POWER_ON = 0x01;
const uint8_t BH1750_RESET = 0x07;
const uint8_t BH1750_ONE_TIME_HIGH_RES_MODE = 0x20;
const unsigned long BH1750_HIGH_RES_MEASUREMENT_DELAY_MS = 180;

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

bool writeBh1750Command(uint8_t sensorAddress, uint8_t command) {
  Wire.beginTransmission(sensorAddress);
  Wire.write(command);
  return Wire.endTransmission() == 0;
}

bool readBh1750Raw(uint8_t sensorAddress, uint16_t &raw) {
  if (Wire.requestFrom(sensorAddress, static_cast<uint8_t>(2)) != 2) {
    return false;
  }

  uint8_t high = Wire.read();
  uint8_t low = Wire.read();
  raw = static_cast<uint16_t>((high << 8) | low);
  return true;
}

bool readBh1750Lux(uint8_t sensorAddress, uint16_t &raw, float &lux) {
  if (!writeBh1750Command(sensorAddress, BH1750_POWER_ON)) {
    return false;
  }

  writeBh1750Command(sensorAddress, BH1750_RESET);

  if (!writeBh1750Command(sensorAddress, BH1750_ONE_TIME_HIGH_RES_MODE)) {
    return false;
  }

  delay(BH1750_HIGH_RES_MEASUREMENT_DELAY_MS);

  if (!readBh1750Raw(sensorAddress, raw)) {
    return false;
  }

  lux = static_cast<float>(raw) / 1.2F;
  return true;
}
}
#endif

String gen2Bh1750HexAddressJson(uint8_t address) {
#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
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

Gen2Bh1750Read gen2Bh1750ReadMuxed(uint8_t muxChannel, uint8_t sensorAddress) {
  Gen2Bh1750Read result;
#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
  if (muxChannel > 7) {
    result.failureDetail = "mux_channel_out_of_range";
    return result;
  }

  result.muxDetected = i2cAddressResponds(MBG_I2C_MUX_ADDRESS);
  if (!result.muxDetected) {
    result.failureDetail = "mux_not_detected";
    return result;
  }

  result.disableBeforeReadOk = muxDisableAll();
  result.upstreamExpectedAddressPresent = i2cAddressResponds(sensorAddress);
  if (result.upstreamExpectedAddressPresent) {
    result.failureDetail = "upstream_address_conflict";
    result.disableAfterReadOk = muxDisableAll();
    return result;
  }

  result.channelSelectOk = muxSelectChannel(muxChannel);
  if (!result.channelSelectOk) {
    result.failureDetail = "channel_select_failed";
    result.disableAfterReadOk = muxDisableAll();
    return result;
  }

  result.selectedChannelExpectedAddressPresent = i2cAddressResponds(sensorAddress);
  if (!result.selectedChannelExpectedAddressPresent) {
    result.failureDetail = "sensor_not_detected_on_selected_channel";
    result.disableAfterReadOk = muxDisableAll();
    return result;
  }

  result.readOk = readBh1750Lux(sensorAddress, result.raw, result.lux);
  result.failureDetail = result.readOk ? "" : "bh1750_lux_read_failed";
  result.disableAfterReadOk = muxDisableAll();
#endif
  return result;
}

#endif
