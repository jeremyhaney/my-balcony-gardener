#include "config.h"
#include "profile_overrides.h"
#include "gen2_veml6030.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_VEML6030
#include <Wire.h>

namespace {
const uint8_t VEML6030_ADDRESS = 0x48;
bool veml6030Present = false;

bool writeVemlRegister(uint8_t reg, uint16_t value) {
  Wire.beginTransmission(VEML6030_ADDRESS);
  Wire.write(reg);
  Wire.write(value & 0xFF);
  Wire.write((value >> 8) & 0xFF);
  return Wire.endTransmission() == 0;
}

bool readVemlRegister(uint8_t reg, uint16_t &value) {
  Wire.beginTransmission(VEML6030_ADDRESS);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  if (Wire.requestFrom(VEML6030_ADDRESS, static_cast<uint8_t>(2)) != 2) {
    return false;
  }

  uint8_t low = Wire.read();
  uint8_t high = Wire.read();
  value = low | (high << 8);
  return true;
}

String vemlDetailsJson() {
  String details = "{";
  details += "\"bus\":\"i2c\",";
  details += "\"sda_pin\":" + String(MBG_I2C_SDA_PIN) + ",";
  details += "\"scl_pin\":" + String(MBG_I2C_SCL_PIN) + ",";
  details += "\"address\":\"0x48\",";
  details += "\"gain\":\"1x\",";
  details += "\"integration_time_ms\":100";
  details += "}";
  return details;
}
}
#endif

void gen2Veml6030Begin() {
#if MBG_HAS_VEML6030
  veml6030Present = writeVemlRegister(0x00, 0x0000);
  Serial.println(veml6030Present ? "Gen2 VEML6030 detected" : "Gen2 VEML6030 missing");
#endif
}

String gen2Veml6030CapabilityJson() {
#if MBG_HAS_VEML6030
  String response = "{";
  response += "\"sensor_key\":\"veml6030_light\",";
  response += "\"sensor_type\":\"VEML6030\",";
  response += "\"enabled\":true,";
  response += "\"present\":" + String(veml6030Present ? "true" : "false") + ",";
  response += "\"quality\":\"" + String(veml6030Present ? "good" : "missing") + "\",";
  response += "\"reason\":\"" + String(veml6030Present ? "detected" : "not_detected") + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + vemlDetailsJson();
  response += "}";
  return response;
#else
  return "{\"sensor_key\":\"veml6030_light\",\"sensor_type\":\"VEML6030\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Veml6030MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_VEML6030
  if (!veml6030Present) {
    gen2Veml6030Begin();
  }

  uint16_t raw = 0;
  bool valid = veml6030Present && readVemlRegister(0x04, raw);
  float lux = raw * 0.0576F;

  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"veml6030_light\",";
  response += "\"sensor_type\":\"VEML6030\",";
  response += "\"measurement_name\":\"ambient_light\",";
  response += "\"measurement_value\":";
  response += valid ? String(lux, 2) : "null";
  response += ",";
  response += "\"measurement_unit\":\"lux\",";
  response += "\"valid\":" + String(valid ? "true" : "false") + ",";
  response += "\"quality\":\"" + String(valid ? "good" : (veml6030Present ? "failed" : "missing")) + "\",";
  response += "\"reason\":\"" + String(valid ? "read_ok" : (veml6030Present ? "read_failed" : "not_detected")) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + vemlDetailsJson();
  response += "}";
  return response;
#else
  return "";
#endif
}

#endif
