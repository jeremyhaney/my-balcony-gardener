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
#include "gen2_i2c_mux.h"
#include "gen2_sen0308.h"
#include "gen2_sen0204.h"
#include "gen2_sen0562.h"
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

#if defined(MBG_SEN0204_PIN) && defined(MBG_PHYSICAL_BUTTON_PIN)
// Builds the Balcony02 configured-hardware manifest without consulting runtime
// detection, measurement quality, GPIO state, or any sensor/provider read path.
// Property and module order are part of the approved Phase 8B.3 wire contract.
String balcony02StaticCapabilitiesJson(const String &deviceId, const String &reportedAt) {
  String response = "{";
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  response += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  response += "\"reported_at\":\"" + reportedAt + "\",";
  response += "\"can_water\":" + boolString(MBG_PUMP_CONTROL_AVAILABLE && MBG_DEVICE_CAN_WATER) + ",";
  response += "\"control_authority\":\"local_firmware\",";

  // Pin assignments use the existing profile constants so this manifest stays
  // coupled to the compiled Balcony02 hardware definition rather than literals.
  response += "\"pinout\":{";
  response += "\"pump_relay\":" + String(RELAY_PIN) + ",";
  response += "\"physical_button\":" + String(MBG_PHYSICAL_BUTTON_PIN) + ",";
  response += "\"reservoir_level\":" + String(MBG_SEN0204_PIN) + ",";
  response += "\"soil_temperature\":" + String(MBG_DS18B20_PIN) + ",";
  response += "\"i2c_sda\":" + String(MBG_I2C_SDA_PIN) + ",";
  response += "\"i2c_scl\":" + String(MBG_I2C_SCL_PIN);
  response += "},";

  // Active-state declarations describe configured electrical semantics only;
  // no GPIO is sampled while constructing this object.
  response += "\"control_configuration\":{";
  response += "\"pump_relay_active_state\":\"HIGH\",";
  response += "\"physical_button_active_state\":\"LOW\",";
  response += "\"reservoir_liquid_detected_state\":\"HIGH\"";
  response += "},";

  // Shared I2C topology is emitted from compile-time profile constants without
  // scanning the bus, selecting a mux channel, or probing either device.
  response += "\"i2c\":{";
  response += "\"mux_address\":" + hexAddress(MBG_I2C_MUX_ADDRESS) + ",";
  response += "\"ads1115_address\":" + hexAddress(MBG_ADS1115_ADDRESS) + ",";
  response += "\"ads1115_mux_channel\":" + String(MBG_ADS1115_MUX_CHANNEL);
  response += "},";

  // The inventory below is intentionally explicit and ordered. Installed state
  // is configured profile truth and is independent of current sensor detection.
  response += "\"modules\":[";
  response += "{\"sensor_key\":\"bme280_air\",\"sensor_type\":\"BME280\",\"installed\":" + boolString(MBG_HAS_BME280 != 0) + ",\"connection\":{";
  response += "\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_BME280_MUX_CHANNEL) + ",\"address\":\"0x76\"}},";
  response += "{\"sensor_key\":\"ds18b20_temperature\",\"sensor_type\":\"DS18B20\",\"installed\":" + boolString(MBG_HAS_DS18B20 != 0) + ",\"connection\":{\"bus\":\"onewire\"}},";
  response += "{\"sensor_key\":\"sen0308_m01\",\"sensor_type\":\"SEN0308\",\"installed\":" + boolString(MBG_SEN0308_A0_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0308_A0_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"provider\":\"ads1115\",\"channel\":\"A0\"}},";
  response += "{\"sensor_key\":\"sen0308_m02\",\"sensor_type\":\"SEN0308\",\"installed\":" + boolString(MBG_SEN0308_A1_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0308_A1_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"provider\":\"ads1115\",\"channel\":\"A1\"}},";
  response += "{\"sensor_key\":\"sen0308_m03\",\"sensor_type\":\"SEN0308\",\"installed\":" + boolString(MBG_SEN0308_A2_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0308_A2_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"provider\":\"ads1115\",\"channel\":\"A2\"}},";
  response += "{\"sensor_key\":\"sen0308_m04\",\"sensor_type\":\"SEN0308\",\"installed\":" + boolString(MBG_SEN0308_A3_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0308_A3_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"provider\":\"ads1115\",\"channel\":\"A3\"}},";
  response += "{\"sensor_key\":\"sen0562_l01\",\"sensor_type\":\"SEN0562\",\"installed\":" + boolString(MBG_SEN0562_L01_INSTALLED != 0) + ",\"physical_sensor_id\":\"SEN0562-L01\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L01_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0562_l02\",\"sensor_type\":\"SEN0562\",\"installed\":" + boolString(MBG_SEN0562_L02_INSTALLED != 0) + ",\"physical_sensor_id\":\"SEN0562-L02\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L02_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0562_l03\",\"sensor_type\":\"SEN0562\",\"installed\":" + boolString(MBG_SEN0562_L03_INSTALLED != 0) + ",\"physical_sensor_id\":\"SEN0562-L03\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L03_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0204_wl01\",\"sensor_type\":\"SEN0204\",\"installed\":" + boolString(MBG_HAS_SEN0204 != 0) + ",\"physical_sensor_id\":\"WL01\",\"connection\":{\"gpio\":" + String(MBG_SEN0204_PIN) + "},\"control_role\":\"watering_interlock\"}";
  response += "]}";
  return response;
}
#endif
}

void gen2Begin() {
#if MBG_HAS_I2C_MODULES
  Wire.begin(MBG_I2C_SDA_PIN, MBG_I2C_SCL_PIN);
#endif

  gen2Dht11Begin();
  gen2Bme280Begin();
  gen2Ds18b20Begin();
  gen2Veml6030Begin();
  gen2Sen0204Begin();
  gen2Sen0562Begin();
}

String gen2CapabilitiesJson(const String &deviceId, const String &reportedAt) {
#if defined(MBG_SEN0204_PIN) && defined(MBG_PHYSICAL_BUTTON_PIN)
  // Balcony02 uses the approved static contract; all other compiled profiles
  // continue through the existing capability aggregation path unchanged.
  if (String(MBG_BUILD_PROFILE) == "balcony02-gen2") {
    return balcony02StaticCapabilitiesJson(deviceId, reportedAt);
  }
#endif

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
  response += "\"local_http_watering_endpoint_available\":" + boolString(MBG_HTTP_WATERING_ENDPOINT_ENABLED != 0) + ",";
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
#if MBG_HAS_I2C_MUX
  response += "\"i2c_mux\":" + gen2I2cMuxCapabilitiesJson() + ",";
#endif
#if MBG_CAPABILITIES_INCLUDE_DHT11_ALIAS
  response += "\"legacy_dht11_enabled\":" + boolString(MBG_HAS_DHT11 != 0) + ",";
#endif
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
  response += ",";
  response += gen2Sen0308CapabilityJson();
  response += ",";
  response += gen2Sen0562CapabilityJson();
#if MBG_HAS_SEN0204
  response += ",";
  response += gen2Sen0204CapabilityJson();
#endif
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
  String sen0308 = gen2Sen0308MeasurementsJson(deviceId, measuredAt);
  String sen0562 = gen2Sen0562MeasurementsJson(deviceId, measuredAt);
  String sen0204 = gen2Sen0204MeasurementsJson(deviceId, measuredAt);

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
    hasAny = true;
  }
  if (sen0308.length() > 0) {
    if (hasAny) {
      response += ",";
    }
    response += sen0308;
    hasAny = true;
  }
  if (sen0562.length() > 0) {
    if (hasAny) {
      response += ",";
    }
    response += sen0562;
    hasAny = true;
  }
  if (sen0204.length() > 0) {
    if (hasAny) {
      response += ",";
    }
    response += sen0204;
    hasAny = true;
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
