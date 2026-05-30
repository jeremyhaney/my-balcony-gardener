#include "config.h"
#include "profile_overrides.h"
#include "gen2_soil_moisture.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_SOIL_MOISTURE
namespace {
String soilDetailsJson(int rawAdc) {
  String details = "{";
  details += "\"analog_pin\":" + String(SOIL_PIN) + ",";
  details += "\"mapping\":\"map(rawAdc,3680,1230,0,100)\",";
  details += "\"calibrated\":false,";
  details += "\"raw_adc\":";
  if (rawAdc >= 0) {
    details += String(rawAdc);
  } else {
    details += "null";
  }
  details += "}";
  return details;
}

String soilMeasurementJson(
  const String &deviceId,
  const String &measuredAt,
  const String &name,
  const String &unit,
  int rawAdc,
  float value
) {
  bool controlEligible = name == "moisture_index" && MBG_DEVICE_CAN_WATER && MBG_PUMP_CONTROL_AVAILABLE;
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"soil_moisture_analog\",";
  response += "\"sensor_type\":\"analog_soil_moisture\",";
  response += "\"measurement_name\":\"" + name + "\",";
  response += "\"measurement_value\":";
  response += name == "raw_adc" ? String(rawAdc) : String(value, 1);
  response += ",";
  response += "\"measurement_unit\":\"" + unit + "\",";
  response += "\"valid\":true,";
  response += "\"quality\":\"diagnostic\",";
  response += "\"reason\":\"uncalibrated_legacy_mapping\",";
  response += "\"control_eligible\":" + String(controlEligible ? "true" : "false") + ",";
  response += "\"details\":" + soilDetailsJson(rawAdc);
  response += "}";
  return response;
}
}
#endif

String gen2SoilMoistureCapabilityJson() {
#if MBG_HAS_SOIL_MOISTURE
  String response = "{";
  response += "\"sensor_key\":\"soil_moisture_analog\",";
  response += "\"sensor_type\":\"analog_soil_moisture\",";
  response += "\"enabled\":true,";
  response += "\"present\":true,";
  response += "\"quality\":\"diagnostic\",";
  response += "\"reason\":\"uncalibrated_legacy_mapping\",";
  response += "\"control_eligible\":" + String((MBG_DEVICE_CAN_WATER && MBG_PUMP_CONTROL_AVAILABLE) ? "true" : "false") + ",";
  response += "\"details\":" + soilDetailsJson(-1);
  response += "}";
  return response;
#else
  return "{\"sensor_key\":\"soil_moisture_analog\",\"sensor_type\":\"analog_soil_moisture\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2SoilMoistureMeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_SOIL_MOISTURE
  int rawAdc = analogRead(SOIL_PIN);
  float moistureIndex = map(rawAdc, 3680, 1230, 0, 100);
  moistureIndex = constrain(moistureIndex, 0, 100);

  String response = "[";
  response += soilMeasurementJson(deviceId, measuredAt, "moisture_index", "index", rawAdc, moistureIndex);
  response += ",";
  response += soilMeasurementJson(deviceId, measuredAt, "raw_adc", "adc_count", rawAdc, rawAdc);
  response += "]";
  return response;
#else
  return "[]";
#endif
}

#endif
