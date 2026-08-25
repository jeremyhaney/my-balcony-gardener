#include "config.h"
#include "profile_overrides.h"
#include "device_identity.h"
#include "firmware_identity.h"
#include "gen2_measurements.h"

#include <Wire.h>
#include "gen2_bme280.h"
#include "gen2_ds18b20.h"
#include "gen2_sen0308.h"
#include "gen2_sen0204.h"
#include "gen2_sen0562.h"

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
  response += "{\"sensor_key\":\"sen0562_l01\",\"sensor_type\":\"SEN0562\",\"installed\":" + boolString(MBG_SEN0562_L01_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0562_L01_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L01_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0562_l02\",\"sensor_type\":\"SEN0562\",\"installed\":" + boolString(MBG_SEN0562_L02_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0562_L02_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L02_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0562_l03\",\"sensor_type\":\"SEN0562\",\"installed\":" + boolString(MBG_SEN0562_L03_INSTALLED != 0) + ",\"physical_sensor_id\":\"" + String(MBG_SEN0562_L03_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L03_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0204_wl01\",\"sensor_type\":\"SEN0204\",\"installed\":" + boolString(MBG_HAS_SEN0204 != 0) + ",\"physical_sensor_id\":\"WL01\",\"connection\":{\"gpio\":" + String(MBG_SEN0204_PIN) + "},\"control_role\":\"watering_interlock\"}";
  response += "]}";
  return response;
}

// Prototype02 intentionally advertises a complete watering controller while
// identifying its output as relay-only simulation evidence. Only physically
// installed sensors are included in this profile's static inventory.
String prototype02StaticCapabilitiesJson(const String &deviceId, const String &reportedAt) {
  String response = "{";
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  response += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  response += "\"reported_at\":\"" + reportedAt + "\",";
  response += "\"can_water\":" + boolString(MBG_WATERING_OUTPUT_AVAILABLE && MBG_DEVICE_CAN_WATER) + ",";
  response += "\"control_authority\":\"local_firmware\",";
  response += "\"watering_output\":{";
  response += "\"kind\":\"relay_simulation\",";
  response += "\"relay_gpio\":" + String(RELAY_PIN) + ",";
  response += "\"active_state\":\"HIGH\",";
  response += "\"pump_present\":false,";
  response += "\"physical_water_delivery\":false,";
  response += "\"visible_feedback\":true,";
  response += "\"audible_feedback\":true";
  response += "},";

  response += "\"pinout\":{";
  response += "\"watering_relay\":" + String(RELAY_PIN) + ",";
  response += "\"physical_button\":" + String(MBG_PHYSICAL_BUTTON_PIN) + ",";
  response += "\"reservoir_level\":" + String(MBG_SEN0204_PIN) + ",";
  response += "\"soil_temperature\":" + String(MBG_DS18B20_PIN) + ",";
  response += "\"i2c_sda\":" + String(MBG_I2C_SDA_PIN) + ",";
  response += "\"i2c_scl\":" + String(MBG_I2C_SCL_PIN);
  response += "},";

  response += "\"control_configuration\":{";
  response += "\"watering_relay_active_state\":\"HIGH\",";
  response += "\"physical_button_active_state\":\"LOW\",";
  response += "\"reservoir_liquid_detected_state\":\"HIGH\"";
  response += "},";

  response += "\"i2c\":{";
  response += "\"mux_address\":" + hexAddress(MBG_I2C_MUX_ADDRESS) + ",";
  response += "\"ads1115_address\":" + hexAddress(MBG_ADS1115_ADDRESS) + ",";
  response += "\"ads1115_mux_channel\":" + String(MBG_ADS1115_MUX_CHANNEL);
  response += "},";

  response += "\"modules\":[";
  response += "{\"sensor_key\":\"bme280_air\",\"sensor_type\":\"BME280\",\"installed\":true,\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_BME280_MUX_CHANNEL) + ",\"address\":\"0x76\"}},";
  response += "{\"sensor_key\":\"ds18b20_temperature\",\"sensor_type\":\"DS18B20\",\"installed\":true,\"physical_sensor_id\":\"" + String(MBG_DS18B20_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"bus\":\"onewire\"}},";
  response += "{\"sensor_key\":\"sen0308_m01\",\"sensor_type\":\"SEN0308\",\"installed\":true,\"physical_sensor_id\":\"" + String(MBG_SEN0308_A0_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"provider\":\"ads1115\",\"channel\":\"A0\"}},";
  response += "{\"sensor_key\":\"sen0562_l01\",\"sensor_type\":\"SEN0562\",\"installed\":true,\"physical_sensor_id\":\"" + String(MBG_SEN0562_L01_PHYSICAL_SENSOR_ID) + "\",\"connection\":{\"bus\":\"i2c_mux\",\"mux_channel\":" + String(MBG_SEN0562_L01_MUX_CHANNEL) + ",\"address\":" + hexAddress(MBG_SEN0562_ADDRESS) + "}},";
  response += "{\"sensor_key\":\"sen0204_wl01\",\"sensor_type\":\"SEN0204\",\"installed\":true,\"physical_sensor_id\":\"WL01\",\"connection\":{\"gpio\":" + String(MBG_SEN0204_PIN) + "},\"control_role\":\"watering_interlock\"}";
  response += "]}";
  return response;
}
}

void gen2Begin() {
#if MBG_HAS_I2C_MODULES
  Wire.begin(MBG_I2C_SDA_PIN, MBG_I2C_SCL_PIN);
#endif

  gen2Bme280Begin();
  gen2Ds18b20Begin();
  gen2Sen0204Begin();
  gen2Sen0562Begin();
}

String gen2CapabilitiesJson(const String &deviceId, const String &reportedAt) {
#if MBG_PROFILE_BALCONY02
  return balcony02StaticCapabilitiesJson(deviceId, reportedAt);
#elif MBG_PROFILE_PROTOTYPE02
  return prototype02StaticCapabilitiesJson(deviceId, reportedAt);
#endif
}

String gen2MeasurementRecordsJson(const String &deviceId, const String &measuredAt) {
  String bme = gen2Bme280MeasurementsJson(deviceId, measuredAt);
  String ds18b20 = gen2Ds18b20MeasurementsJson(deviceId, measuredAt);
  String sen0308 = gen2Sen0308MeasurementsJson(deviceId, measuredAt);
  String sen0562 = gen2Sen0562MeasurementsJson(deviceId, measuredAt);
  String sen0204 = gen2Sen0204MeasurementsJson(deviceId, measuredAt);

  String response = "[";

  bool hasAny = false;
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
