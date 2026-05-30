#include "config.h"
#include "profile_overrides.h"
#include "gen2_dht11.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_DHT11
#include <DHT.h>

namespace {
DHT gen2Dht11(DHTPIN, DHTTYPE);

String dhtDetailsJson() {
  String details = "{";
  details += "\"data_pin\":" + String(DHTPIN) + ",";
  details += "\"sensor_model\":\"DHT11\",";
  details += "\"temperature_unit\":\"F\"";
  details += "}";
  return details;
}

String dhtMeasurementJson(
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
  response += "\"sensor_key\":\"dht11_air\",";
  response += "\"sensor_type\":\"DHT11\",";
  response += "\"measurement_name\":\"" + name + "\",";
  response += "\"measurement_value\":";
  response += valid ? String(value, 2) : "null";
  response += ",";
  response += "\"measurement_unit\":\"" + unit + "\",";
  response += "\"valid\":" + String(valid ? "true" : "false") + ",";
  response += "\"quality\":\"" + quality + "\",";
  response += "\"reason\":\"" + reason + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + dhtDetailsJson();
  response += "}";
  return response;
}
}
#endif

void gen2Dht11Begin() {
#if MBG_HAS_DHT11
  gen2Dht11.begin();
  Serial.println("Gen2 DHT11 enabled");
#endif
}

String gen2Dht11CapabilityJson() {
#if MBG_HAS_DHT11
  String response = "{";
  response += "\"sensor_key\":\"dht11_air\",";
  response += "\"sensor_type\":\"DHT11\",";
  response += "\"enabled\":true,";
  response += "\"present\":true,";
  response += "\"quality\":\"diagnostic\",";
  response += "\"reason\":\"configured\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + dhtDetailsJson();
  response += "}";
  return response;
#else
  return "{\"sensor_key\":\"dht11_air\",\"sensor_type\":\"DHT11\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Dht11MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_DHT11
  float humidity = gen2Dht11.readHumidity();
  float tempC = gen2Dht11.readTemperature();
  bool humidityValid = !isnan(humidity);
  bool tempValid = !isnan(tempC);
  float tempF = (tempC * 1.8) + 32;

  String response = "[";
  response += dhtMeasurementJson(deviceId, measuredAt, "air_temperature", "F", tempF, tempValid, tempValid ? "diagnostic" : "failed", tempValid ? "read_ok" : "read_failed");
  response += ",";
  response += dhtMeasurementJson(deviceId, measuredAt, "relative_humidity", "%", humidity, humidityValid, humidityValid ? "diagnostic" : "failed", humidityValid ? "read_ok" : "read_failed");
  response += "]";
  return response;
#else
  return "[]";
#endif
}

#endif
