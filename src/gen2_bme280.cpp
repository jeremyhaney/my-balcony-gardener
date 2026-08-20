#include "config.h"
#include "profile_overrides.h"
#include "gen2_bme280.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_BME280
#include <Adafruit_BME280.h>
#include <Wire.h>

namespace {
Adafruit_BME280 bme280;
bool bme280Present = false;
uint8_t bme280Address = 0;
bool bme280MuxDetected = false;
const char *bme280FailureDetail = "";

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

bool prepareBmeReadPath() {
  bme280FailureDetail = "";
#if MBG_BME280_USE_I2C_MUX
  if (MBG_BME280_MUX_CHANNEL > 7) {
    bme280FailureDetail = "mux_channel_out_of_range";
    return false;
  }

  bme280MuxDetected = i2cAddressResponds(MBG_I2C_MUX_ADDRESS);
  if (!bme280MuxDetected) {
    bme280FailureDetail = "mux_not_detected";
    return false;
  }

  if (!muxDisableAll()) {
    bme280FailureDetail = "mux_disable_before_select_failed";
    return false;
  }

  if (!muxSelectChannel(MBG_BME280_MUX_CHANNEL)) {
    bme280FailureDetail = "channel_select_failed";
    muxDisableAll();
    return false;
  }
#endif
  return true;
}

void finishBmeReadPath() {
#if MBG_BME280_USE_I2C_MUX
  muxDisableAll();
#endif
}

String bmeDetailsJson() {
  String details = "{";
  details += "\"bus\":\"i2c\",";
  details += "\"i2c_topology\":\"";
  details += (MBG_BME280_USE_I2C_MUX ? "muxed_i2c" : "direct_i2c");
  details += "\",";
  details += "\"sda_pin\":" + String(MBG_I2C_SDA_PIN) + ",";
  details += "\"scl_pin\":" + String(MBG_I2C_SCL_PIN) + ",";
#if MBG_BME280_USE_I2C_MUX
  details += "\"mux_address\":" + hexAddressJson(MBG_I2C_MUX_ADDRESS) + ",";
  details += "\"mux_channel\":" + String(MBG_BME280_MUX_CHANNEL) + ",";
  details += "\"mux_detected\":" + String(bme280MuxDetected ? "true" : "false") + ",";
#endif
  details += "\"address\":";
  if (bme280Address == 0) {
    details += "null";
  } else {
    details += hexAddressJson(bme280Address);
  }
  if (String(bme280FailureDetail).length() > 0) {
    details += ",\"failure_detail\":\"";
    details += bme280FailureDetail;
    details += "\"";
  }
  details += "}";
  return details;
}

String bmeMeasurementJson(
  const String &deviceId,
  const String &measuredAt,
  const String &name,
  const String &unit,
  float value,
  bool valid,
  const String &quality,
  const String &reason
) {
  (void)deviceId;
  (void)measuredAt;
  String response = "{";
  response += "\"sensor_key\":\"bme280_air\",";
  response += "\"sensor_type\":\"BME280\",";
  response += "\"measurement_name\":\"" + name + "\",";
  response += "\"measurement_value\":";
  response += valid ? String(value, 2) : "null";
  response += ",";
  response += "\"measurement_unit\":\"" + unit + "\",";
  response += "\"valid\":" + String(valid ? "true" : "false") + ",";
  response += "\"quality\":\"" + quality + "\",";
  response += "\"reason\":\"" + reason + "\"";
  response += "}";
  return response;
}
}
#endif

void gen2Bme280Begin() {
#if MBG_HAS_BME280
  bme280Present = false;
  bme280Address = 0;

  if (!prepareBmeReadPath()) {
    Serial.print("Gen2 BME280 missing: ");
    Serial.println(bme280FailureDetail);
    return;
  }

  bme280Present = bme280.begin(0x76, &Wire);
  bme280Address = bme280Present ? 0x76 : 0;

  if (!bme280Present) {
    bme280Present = bme280.begin(0x77, &Wire);
    bme280Address = bme280Present ? 0x77 : 0;
  }

  if (!bme280Present) {
    bme280FailureDetail = MBG_BME280_USE_I2C_MUX ? "sensor_not_detected_on_selected_channel" : "sensor_not_detected";
  }

  finishBmeReadPath();
  Serial.println(bme280Present ? "Gen2 BME280 detected" : "Gen2 BME280 missing");
#endif
}

String gen2Bme280CapabilityJson() {
#if MBG_HAS_BME280
  String response = "{";
  response += "\"sensor_key\":\"bme280_air\",";
  response += "\"sensor_type\":\"BME280\",";
  response += "\"enabled\":true,";
  response += "\"present\":" + String(bme280Present ? "true" : "false") + ",";
  response += "\"quality\":\"" + String(bme280Present ? "good" : "missing") + "\",";
  response += "\"reason\":\"" + String(bme280Present ? "detected" : "not_detected") + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + bmeDetailsJson();
  response += "}";
  return response;
#else
  return "{\"sensor_key\":\"bme280_air\",\"sensor_type\":\"BME280\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Bme280MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_BME280
  if (!bme280Present) {
    gen2Bme280Begin();
  }

  if (!bme280Present) {
    String reason = String(bme280FailureDetail).length() > 0 ? String(bme280FailureDetail) : String("not_detected");
    String response = "[";
    response += bmeMeasurementJson(deviceId, measuredAt, "air_temperature", "F", 0, false, "missing", reason);
    response += ",";
    response += bmeMeasurementJson(deviceId, measuredAt, "relative_humidity", "%", 0, false, "missing", reason);
    response += ",";
    response += bmeMeasurementJson(deviceId, measuredAt, "barometric_pressure", "hPa", 0, false, "missing", reason);
    response += "]";
    return response;
  }

  if (!prepareBmeReadPath()) {
    String reason = String(bme280FailureDetail).length() > 0 ? String(bme280FailureDetail) : String("read_path_unavailable");
    String response = "[";
    response += bmeMeasurementJson(deviceId, measuredAt, "air_temperature", "F", 0, false, "failed", reason);
    response += ",";
    response += bmeMeasurementJson(deviceId, measuredAt, "relative_humidity", "%", 0, false, "failed", reason);
    response += ",";
    response += bmeMeasurementJson(deviceId, measuredAt, "barometric_pressure", "hPa", 0, false, "failed", reason);
    response += "]";
    return response;
  }

  float tempF = (bme280.readTemperature() * 1.8) + 32;
  float humidity = bme280.readHumidity();
  float pressureHpa = bme280.readPressure() / 100.0F;
  finishBmeReadPath();
  bool tempValid = !isnan(tempF);
  bool humidityValid = !isnan(humidity);
  bool pressureValid = !isnan(pressureHpa);

  String response = "[";
  response += bmeMeasurementJson(deviceId, measuredAt, "air_temperature", "F", tempF, tempValid, tempValid ? "good" : "failed", tempValid ? "read_ok" : "read_failed");
  response += ",";
  response += bmeMeasurementJson(deviceId, measuredAt, "relative_humidity", "%", humidity, humidityValid, humidityValid ? "good" : "failed", humidityValid ? "read_ok" : "read_failed");
  response += ",";
  response += bmeMeasurementJson(deviceId, measuredAt, "barometric_pressure", "hPa", pressureHpa, pressureValid, pressureValid ? "good" : "failed", pressureValid ? "read_ok" : "read_failed");
  response += "]";
  return response;
#else
  return "[]";
#endif
}

#endif
