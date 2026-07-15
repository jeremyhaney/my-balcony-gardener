#include "config.h"
#include "profile_overrides.h"
#include "gen2_sen0204.h"

#ifdef MBG_GEN2_ENABLED

namespace {
#if MBG_HAS_SEN0204
String sen0204DetailsJson(int rawState) {
  String details = "{";
  details += "\"physical_sensor_id\":\"WL01\",";
  details += "\"digital_provider\":\"esp32_gpio\",";
  details += "\"gpio\":" + String(MBG_SEN0204_PIN) + ",";
  details += "\"input_mode\":\"INPUT\",";
  details += "\"test_supply\":\"3.3V\",";
  details += "\"raw_digital_state\":" + String(rawState) + ",";
  details += "\"raw_state_label\":\"";
  details += rawState == HIGH ? "HIGH" : "LOW";
  details += "\",";
  details += "\"interpreted_state\":\"";
  details += rawState == HIGH ? "liquid_detected" : "liquid_not_detected";
  details += "\",";
  details += "\"active_state\":\"HIGH\",";
  details += "\"safe_state_candidate\":\"HIGH\",";
  details += "\"polarity_status\":\"physically_proven\",";
  details += "\"diagnostic_only\":false";
  details += "}";
  return details;
}
#endif
}

void gen2Sen0204Begin() {
#if MBG_HAS_SEN0204
  pinMode(MBG_SEN0204_PIN, INPUT);
  Serial.printf("Gen2 SEN0204 WL01 initialized on GPIO%d as INPUT\n", MBG_SEN0204_PIN);
#endif
}

int gen2Sen0204RawState() {
#if MBG_HAS_SEN0204
  return digitalRead(MBG_SEN0204_PIN);
#else
  return LOW;
#endif
}

bool gen2Sen0204LiquidDetected() {
  return gen2Sen0204RawState() == HIGH;
}

String gen2Sen0204CapabilityJson() {
#if MBG_HAS_SEN0204
  int rawState = digitalRead(MBG_SEN0204_PIN);
  String response = "{";
  response += "\"sensor_key\":\"sen0204_wl01\",";
  response += "\"sensor_type\":\"sen0204\",";
  response += "\"enabled\":true,";
  response += "\"present\":true,";
  response += "\"quality\":\"good\",";
  response += "\"reason\":\"read_ok\",";
  response += "\"control_eligible\":true,";
  response += "\"details\":" + sen0204DetailsJson(rawState);
  response += "}";
  return response;
#else
  return "";
#endif
}

String gen2Sen0204MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_SEN0204
  int rawState = digitalRead(MBG_SEN0204_PIN);
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"sen0204_wl01\",";
  response += "\"sensor_type\":\"sen0204\",";
  response += "\"measurement_name\":\"reservoir_liquid_state\",";
  response += "\"measurement_value\":" + String(rawState) + ",";
  response += "\"measurement_unit\":\"state\",";
  response += "\"valid\":true,";
  response += "\"quality\":\"good\",";
  response += "\"reason\":\"read_ok\",";
  response += "\"control_eligible\":true,";
  response += "\"details\":" + sen0204DetailsJson(rawState);
  response += "}";
  return response;
#else
  return "";
#endif
}

#endif
