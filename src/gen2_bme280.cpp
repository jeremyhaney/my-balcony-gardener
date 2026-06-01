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

String bmeDetailsJson() {
  String details = "{";
  details += "\"bus\":\"i2c\",";
  details += "\"sda_pin\":" + String(MBG_I2C_SDA_PIN) + ",";
  details += "\"scl_pin\":" + String(MBG_I2C_SCL_PIN) + ",";
  details += "\"address\":";
  if (bme280Address == 0) {
    details += "null";
  } else {
    details += "\"0x";
    details += String(bme280Address, HEX);
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
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"bme280_air\",";
  response += "\"sensor_type\":\"BME280\",";
  response += "\"measurement_name\":\"" + name + "\",";
  response += "\"measurement_value\":";
  response += valid ? String(value, 2) : "null";
  response += ",";
  response += "\"measurement_unit\":\"" + unit + "\",";
  response += "\"valid\":" + String(valid ? "true" : "false") + ",";
  response += "\"quality\":\"" + quality + "\",";
  response += "\"reason\":\"" + reason + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + bmeDetailsJson();
  response += "}";
  return response;
}
}
#endif

void gen2Bme280Begin() {
#if MBG_HAS_BME280
  bme280Present = bme280.begin(0x76, &Wire);
  bme280Address = bme280Present ? 0x76 : 0;

  if (!bme280Present) {
    bme280Present = bme280.begin(0x77, &Wire);
    bme280Address = bme280Present ? 0x77 : 0;
  }

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
    String response = "[";
    response += bmeMeasurementJson(deviceId, measuredAt, "air_temperature", "F", 0, false, "missing", "not_detected");
    response += ",";
    response += bmeMeasurementJson(deviceId, measuredAt, "relative_humidity", "%", 0, false, "missing", "not_detected");
    response += ",";
    response += bmeMeasurementJson(deviceId, measuredAt, "barometric_pressure", "hPa", 0, false, "missing", "not_detected");
    response += "]";
    return response;
  }

  float tempF = (bme280.readTemperature() * 1.8) + 32;
  float humidity = bme280.readHumidity();
  float pressureHpa = bme280.readPressure() / 100.0F;
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

bool gen2Bme280ReadLegacyAir(float &temperatureF, float &humidity) {
#if MBG_HAS_BME280
  if (!bme280Present) {
    gen2Bme280Begin();
  }

  if (!bme280Present) {
    return false;
  }

  float tempF = (bme280.readTemperature() * 1.8) + 32;
  float relativeHumidity = bme280.readHumidity();

  if (isnan(tempF) || isnan(relativeHumidity)) {
    return false;
  }

  temperatureF = tempF;
  humidity = relativeHumidity;
  return true;
#else
  (void)temperatureF;
  (void)humidity;
  return false;
#endif
}

#endif
