#include "config.h"
#include "profile_overrides.h"
#include "device_identity.h"
#include "firmware_identity.h"
#include "gen2_measurements.h"

#ifdef MBG_GEN2_ENABLED

#include <Wire.h>
#include "gen2_bme280.h"
#include "gen2_dht11.h"
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
#if MBG_HAS_I2C_MODULES
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
#else
  return "{\"enabled\":false,\"addresses_found\":[]}";
#endif
}
}

void gen2Begin() {
#if MBG_HAS_I2C_MODULES
  Wire.begin(MBG_I2C_SDA_PIN, MBG_I2C_SCL_PIN);
#endif

  gen2Dht11Begin();
  gen2Bme280Begin();
  gen2Ds18b20Begin();
  gen2Veml6030Begin();
}

String gen2CapabilitiesJson(const String &deviceId, const String &reportedAt) {
  String response = "{";
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  response += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  response += "\"reported_at\":\"" + reportedAt + "\",";
  response += "\"gen2_enabled\":true,";
  response += "\"pump_control_available\":" + boolString(MBG_PUMP_CONTROL_AVAILABLE != 0) + ",";
  response += "\"device_can_water\":" + boolString(MBG_DEVICE_CAN_WATER != 0) + ",";
  response += "\"watering_simulation_available\":" + boolString(MBG_WATERING_SIMULATION_AVAILABLE != 0) + ",";
  response += "\"relay_test_output_pin\":";
  response += (MBG_PUMP_CONTROL_AVAILABLE ? String(RELAY_PIN) : String("null"));
  response += ",";
  response += "\"control_authority\":\"local_firmware\",";
  response += "\"supabase_command_control\":false,";
  response += "\"i2c\":{\"enabled\":" + boolString(MBG_HAS_I2C_MODULES != 0) + ",";
  response += "\"sda_pin\":";
  response += (MBG_HAS_I2C_MODULES ? String(MBG_I2C_SDA_PIN) : String("null"));
  response += ",\"scl_pin\":";
  response += (MBG_HAS_I2C_MODULES ? String(MBG_I2C_SCL_PIN) : String("null"));
  response += "},";
  response += "\"i2c_scan\":" + i2cScanJson() + ",";
  response += "\"legacy_dht11_enabled\":" + boolString(MBG_HAS_DHT11 != 0) + ",";
  response += "\"modules\":[";
  response += gen2Dht11CapabilityJson();
  response += ",";
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
  String dht11 = gen2Dht11MeasurementsJson(deviceId, measuredAt);
  String bme = gen2Bme280MeasurementsJson(deviceId, measuredAt);
  String ds18b20 = gen2Ds18b20MeasurementsJson(deviceId, measuredAt);
  String veml6030 = gen2Veml6030MeasurementsJson(deviceId, measuredAt);
  String soil = gen2SoilMoistureMeasurementsJson(deviceId, measuredAt);

  String response = "[";

  bool hasAny = false;
  if (dht11.length() > 2) {
    response += dht11.substring(1, dht11.length() - 1);
    hasAny = true;
  }
  if (bme.length() > 2) {
    if (hasAny) {
      response += ",";
    }
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
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  response += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"records\":";
  response += gen2MeasurementRecordsJson(deviceId, measuredAt);
  response += "}";
  return response;
}

#endif
