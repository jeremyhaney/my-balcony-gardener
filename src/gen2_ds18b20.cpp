#include "config.h"
#include "profile_overrides.h"
#include "gen2_ds18b20.h"

#ifdef MBG_GEN2_ENABLED

#if MBG_HAS_DS18B20
#include <DallasTemperature.h>
#include <OneWire.h>

namespace {
OneWire oneWire(MBG_DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);
int ds18b20DeviceCount = 0;

String dsDetailsJson() {
  String details = "{";
  details += "\"bus\":\"onewire\",";
  details += "\"data_pin\":" + String(MBG_DS18B20_PIN) + ",";
  details += "\"pullup\":\"4.7k_to_3.3v\",";
  details += "\"parasite_power\":false,";
  details += "\"device_count\":" + String(ds18b20DeviceCount);
  details += "}";
  return details;
}
}
#endif

void gen2Ds18b20Begin() {
#if MBG_HAS_DS18B20
  ds18b20.begin();
  ds18b20.setWaitForConversion(true);
  ds18b20DeviceCount = ds18b20.getDeviceCount();
  Serial.printf("Gen2 DS18B20 device count: %d\n", ds18b20DeviceCount);
#endif
}

String gen2Ds18b20CapabilityJson() {
#if MBG_HAS_DS18B20
  bool present = ds18b20DeviceCount > 0;
  String response = "{";
  response += "\"sensor_key\":\"ds18b20_temperature\",";
  response += "\"sensor_type\":\"DS18B20\",";
  response += "\"enabled\":true,";
  response += "\"present\":" + String(present ? "true" : "false") + ",";
  response += "\"quality\":\"" + String(present ? "good" : "missing") + "\",";
  response += "\"reason\":\"" + String(present ? "detected" : "not_detected") + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + dsDetailsJson();
  response += "}";
  return response;
#else
  return "{\"sensor_key\":\"ds18b20_temperature\",\"sensor_type\":\"DS18B20\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Ds18b20MeasurementsJson(const String &deviceId, const String &measuredAt) {
  (void)deviceId;
  (void)measuredAt;
#if MBG_HAS_DS18B20
  if (ds18b20DeviceCount <= 0) {
    gen2Ds18b20Begin();
  }

  bool present = ds18b20DeviceCount > 0;
  float tempC = 0;
  bool valid = false;

  if (present) {
    ds18b20.requestTemperatures();
    tempC = ds18b20.getTempCByIndex(0);
    valid = tempC != DEVICE_DISCONNECTED_C && !isnan(tempC);
  }

  float tempF = (tempC * 1.8) + 32;
  String response = "{";
  response += "\"sensor_key\":\"ds18b20_temperature\",";
  response += "\"sensor_type\":\"DS18B20\",";
  response += "\"measurement_name\":\"soil temp\",";
  response += "\"measurement_value\":";
  response += valid ? String(tempF, 2) : "null";
  response += ",";
  response += "\"measurement_unit\":\"F\",";
  response += "\"valid\":" + String(valid ? "true" : "false") + ",";
  response += "\"quality\":\"" + String(valid ? "good" : (present ? "failed" : "missing")) + "\",";
  response += "\"reason\":\"" + String(valid ? "read_ok" : (present ? "read_failed" : "not_detected")) + "\"";
  response += "}";
  return response;
#else
  return "";
#endif
}

#endif
