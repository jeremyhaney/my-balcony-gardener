#include "config.h"
#include "profile_overrides.h"
#include "gen2_sen0308.h"

#ifdef MBG_GEN2_ENABLED

#include "gen2_ads1115.h"

namespace {
String boolString(bool value) {
  return value ? "true" : "false";
}

#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
struct Sen0308SensorConfig {
  const char *sensorKey;
  const char *physicalSensorId;
  uint8_t adsChannel;
  const char *providerChannel;
  bool installed;
};

const Sen0308SensorConfig SEN0308_SENSORS[] = {
  {"sen0308_m01", MBG_SEN0308_A0_PHYSICAL_SENSOR_ID, 0, "A0", MBG_SEN0308_A0_INSTALLED},
  {"sen0308_m02", MBG_SEN0308_A1_PHYSICAL_SENSOR_ID, 1, "A1", MBG_SEN0308_A1_INSTALLED},
  {"sen0308_m03", MBG_SEN0308_A2_PHYSICAL_SENSOR_ID, 2, "A2", MBG_SEN0308_A2_INSTALLED},
  {"sen0308_m04", MBG_SEN0308_A3_PHYSICAL_SENSOR_ID, 3, "A3", MBG_SEN0308_A3_INSTALLED}
};
const size_t SEN0308_SENSOR_COUNT = sizeof(SEN0308_SENSORS) / sizeof(SEN0308_SENSORS[0]);

bool sen0308NotDetected(const Gen2Ads1115Read &read) {
  return !read.muxDetected || (!read.upstreamExpectedAddressPresent && !read.selectedChannelExpectedAddressPresent);
}

String sen0308Quality(const Gen2Ads1115Read &read) {
  if (read.readOk) {
    return "diagnostic";
  }
  return sen0308NotDetected(read) ? "missing" : "failed";
}

String sen0308Reason(const Gen2Ads1115Read &read) {
  if (read.readOk) {
    return "read_ok";
  }
  return sen0308NotDetected(read) ? "not_detected" : "read_failed";
}

String sen0308DetailsJson(const Gen2Ads1115Read *read, const Sen0308SensorConfig &sensor) {
  String details = "{";
  details += "\"physical_sensor_id\":";
  details += sensor.installed ? "\"" + String(sensor.physicalSensorId) + "\"" : "null";
  details += ",";
  details += "\"analog_provider\":\"ads1115\",";
  details += "\"provider_channel\":\"" + String(sensor.providerChannel) + "\",";
  details += "\"profile_installed\":" + boolString(sensor.installed) + ",";
  details += "\"mux_address\":" + gen2Ads1115HexAddressJson(MBG_I2C_MUX_ADDRESS) + ",";
  details += "\"mux_channel\":" + String(MBG_ADS1115_MUX_CHANNEL) + ",";
  details += "\"ads1115_address\":" + gen2Ads1115HexAddressJson(MBG_ADS1115_ADDRESS) + ",";
  details += "\"electrical_boundary\":\"3.3V_only\",";
  details += "\"no_5v\":true";
  if (read != nullptr) {
    details += ",";
    details += "\"mux_detected\":" + boolString(read->muxDetected) + ",";
    details += "\"disable_before_read_ok\":" + boolString(read->disableBeforeReadOk) + ",";
    details += "\"channel_select_ok\":" + boolString(read->channelSelectOk) + ",";
    details += "\"post_read_all_channels_disabled\":" + boolString(read->disableAfterReadOk) + ",";
    details += "\"upstream_expected_address_present\":" + boolString(read->upstreamExpectedAddressPresent) + ",";
    details += "\"selected_channel_expected_address_present\":" + boolString(read->selectedChannelExpectedAddressPresent);
    if (String(read->failureDetail).length() > 0) {
      details += ",\"read_failure_detail\":\"";
      details += read->failureDetail;
      details += "\"";
    }
  }
  details += "}";
  return details;
}

String sen0308CapabilityJson(const Sen0308SensorConfig &sensor, const Gen2Ads1115Read &read) {
  String response = "{";
  response += "\"sensor_key\":\"" + String(sensor.sensorKey) + "\",";
  response += "\"sensor_type\":\"sen0308\",";
  response += "\"enabled\":true,";
  response += "\"present\":" + boolString(read.readOk) + ",";
  response += "\"quality\":\"" + sen0308Quality(read) + "\",";
  response += "\"reason\":\"" + sen0308Reason(read) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0308DetailsJson(&read, sensor);
  response += "}";
  return response;
}

String sen0308NotInstalledCapabilityJson(const Sen0308SensorConfig &sensor) {
  String response = "{";
  response += "\"sensor_key\":\"" + String(sensor.sensorKey) + "\",";
  response += "\"sensor_type\":\"sen0308\",";
  response += "\"enabled\":false,";
  response += "\"present\":false,";
  response += "\"quality\":\"not_installed\",";
  response += "\"reason\":\"profile_not_installed\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0308DetailsJson(nullptr, sensor);
  response += "}";
  return response;
}

String sen0308MeasurementJson(const String &deviceId, const String &measuredAt, const Sen0308SensorConfig &sensor, const Gen2Ads1115Read &read) {
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"" + String(sensor.sensorKey) + "\",";
  response += "\"sensor_type\":\"sen0308\",";
  response += "\"measurement_name\":\"raw_adc\",";
  response += "\"measurement_value\":";
  response += read.readOk ? String(read.rawAdc) : String("null");
  response += ",";
  response += "\"measurement_unit\":\"count\",";
  response += "\"valid\":" + boolString(read.readOk) + ",";
  response += "\"quality\":\"" + sen0308Quality(read) + "\",";
  response += "\"reason\":\"" + sen0308Reason(read) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0308DetailsJson(&read, sensor);
  response += "}";
  return response;
}

String sen0308NotInstalledMeasurementJson(const String &deviceId, const String &measuredAt, const Sen0308SensorConfig &sensor) {
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"" + String(sensor.sensorKey) + "\",";
  response += "\"sensor_type\":\"sen0308\",";
  response += "\"measurement_name\":\"raw_adc\",";
  response += "\"measurement_value\":null,";
  response += "\"measurement_unit\":\"count\",";
  response += "\"valid\":false,";
  response += "\"quality\":\"not_installed\",";
  response += "\"reason\":\"profile_not_installed\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0308DetailsJson(nullptr, sensor);
  response += "}";
  return response;
}
#endif
}

String gen2Sen0308CapabilityJson() {
#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
  String response = "";
  for (size_t i = 0; i < SEN0308_SENSOR_COUNT; i++) {
    if (i > 0) {
      response += ",";
    }
    if (SEN0308_SENSORS[i].installed) {
      Gen2Ads1115Read read = gen2Ads1115ReadChannel(SEN0308_SENSORS[i].adsChannel);
      response += sen0308CapabilityJson(SEN0308_SENSORS[i], read);
    } else {
      response += sen0308NotInstalledCapabilityJson(SEN0308_SENSORS[i]);
    }
  }
  return response;
#else
  return "{\"sensor_key\":\"sen0308_m01\",\"sensor_type\":\"sen0308\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Sen0308MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
  String response = "";
  for (size_t i = 0; i < SEN0308_SENSOR_COUNT; i++) {
    if (i > 0) {
      response += ",";
    }
    if (SEN0308_SENSORS[i].installed) {
      Gen2Ads1115Read read = gen2Ads1115ReadChannel(SEN0308_SENSORS[i].adsChannel);
      response += sen0308MeasurementJson(deviceId, measuredAt, SEN0308_SENSORS[i], read);
    } else {
      response += sen0308NotInstalledMeasurementJson(deviceId, measuredAt, SEN0308_SENSORS[i]);
    }
  }
  return response;
#else
  return "";
#endif
}

#endif
