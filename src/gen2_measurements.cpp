#include "config.h"
#include "profile_overrides.h"
#include "gen2_measurements.h"

#ifdef MBG_GEN2_ENABLED

#include <Wire.h>
#include "gen2_bme280.h"
#include "gen2_ds18b20.h"
#include "gen2_soil_moisture.h"
#include "gen2_veml6030.h"

namespace {
String boolString(bool value) {
  return value ? "true" : "false";
}

String hexAddress(uint8_t address) {
  String response = "\"0x";
  if (address < 0x10) {
    response += "0";
  }
  response += String(address, HEX);
  response += "\"";
  return response;
}

String i2cScanJson() {
  String response = "{\"addresses_found\":[";
  bool hasAny = false;

  for (uint8_t address = 0x08; address <= 0x77; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      if (hasAny) {
        response += ",";
      }
      response += hexAddress(address);
      hasAny = true;
    }
  }

  response += "]}";
  return response;
}
}

void gen2Begin() {
  Wire.begin(MBG_I2C_SDA_PIN, MBG_I2C_SCL_PIN);

  gen2Bme280Begin();
  gen2Ds18b20Begin();
  gen2Veml6030Begin();
}

String gen2CapabilitiesJson(const String &deviceId) {
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"gen2_enabled\":true,";
  response += "\"relay_test_output_pin\":" + String(RELAY_PIN) + ",";
  response += "\"control_authority\":\"local_firmware\",";
  response += "\"supabase_command_control\":false,";
  response += "\"i2c\":{\"sda_pin\":" + String(MBG_I2C_SDA_PIN) + ",\"scl_pin\":" + String(MBG_I2C_SCL_PIN) + "},";
  response += "\"i2c_scan\":" + i2cScanJson() + ",";
  response += "\"legacy_dht11_enabled\":" + boolString(MBG_HAS_DHT11 != 0) + ",";
  response += "\"modules\":[";
  response += gen2Bme280CapabilityJson();
  response += ",";
  response += gen2Ds18b20CapabilityJson();
  response += ",";
  response += gen2Veml6030CapabilityJson();
  response += ",";
  response += gen2SoilMoistureCapabilityJson();
  response += "]";
  response += "}";
  return response;
}

String gen2MeasurementRecordsJson(const String &deviceId, const String &measuredAt) {
  String bme = gen2Bme280MeasurementsJson(deviceId, measuredAt);
  String ds18b20 = gen2Ds18b20MeasurementsJson(deviceId, measuredAt);
  String veml6030 = gen2Veml6030MeasurementsJson(deviceId, measuredAt);
  String soil = gen2SoilMoistureMeasurementsJson(deviceId, measuredAt);

  String response = "[";

  bool hasAny = false;
  if (bme.length() > 2) {
    response += bme.substring(1, bme.length() - 1);
    hasAny = true;
  }
  if (ds18b20.length() > 0) {
    if (hasAny) {
      response += ",";
    }
    response += ds18b20;
    hasAny = true;
  }
  if (veml6030.length() > 0) {
    if (hasAny) {
      response += ",";
    }
    response += veml6030;
    hasAny = true;
  }
  if (soil.length() > 2) {
    if (hasAny) {
      response += ",";
    }
    response += soil.substring(1, soil.length() - 1);
  }

  response += "]";
  return response;
}

String gen2MeasurementsJson(const String &deviceId, const String &measuredAt) {
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"records\":";
  response += gen2MeasurementRecordsJson(deviceId, measuredAt);
  response += "}";
  return response;
}

#endif
