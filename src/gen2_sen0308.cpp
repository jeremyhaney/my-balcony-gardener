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
bool sen0308M01NotDetected(const Gen2Ads1115Read &read) {
  return !read.muxDetected || (!read.upstreamExpectedAddressPresent && !read.selectedChannelExpectedAddressPresent);
}

String sen0308M01Quality(const Gen2Ads1115Read &read) {
  if (read.readOk) {
    return "diagnostic";
  }
  return sen0308M01NotDetected(read) ? "missing" : "failed";
}

String sen0308M01Reason(const Gen2Ads1115Read &read) {
  if (read.readOk) {
    return "read_ok";
  }
  return sen0308M01NotDetected(read) ? "not_detected" : "read_failed";
}

String sen0308M01DetailsJson(const Gen2Ads1115Read &read) {
  String details = "{";
  details += "\"physical_sensor_id\":\"SEN0308-M01\",";
  details += "\"analog_provider\":\"ads1115\",";
  details += "\"provider_channel\":\"A0\",";
  details += "\"mux_address\":" + gen2Ads1115HexAddressJson(MBG_I2C_MUX_ADDRESS) + ",";
  details += "\"mux_channel\":" + String(MBG_ADS1115_MUX_CHANNEL) + ",";
  details += "\"ads1115_address\":" + gen2Ads1115HexAddressJson(MBG_ADS1115_ADDRESS) + ",";
  details += "\"electrical_boundary\":\"3.3V_only\",";
  details += "\"no_5v\":true,";
  details += "\"mux_detected\":" + boolString(read.muxDetected) + ",";
  details += "\"disable_before_read_ok\":" + boolString(read.disableBeforeReadOk) + ",";
  details += "\"channel_select_ok\":" + boolString(read.channelSelectOk) + ",";
  details += "\"post_read_all_channels_disabled\":" + boolString(read.disableAfterReadOk) + ",";
  details += "\"upstream_expected_address_present\":" + boolString(read.upstreamExpectedAddressPresent) + ",";
  details += "\"selected_channel_expected_address_present\":" + boolString(read.selectedChannelExpectedAddressPresent);
  if (String(read.failureDetail).length() > 0) {
    details += ",\"read_failure_detail\":\"";
    details += read.failureDetail;
    details += "\"";
  }
  details += "}";
  return details;
}
#endif
}

String gen2Sen0308CapabilityJson() {
#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
  Gen2Ads1115Read read = gen2Ads1115ReadA0();

  String response = "{";
  response += "\"sensor_key\":\"sen0308_m01\",";
  response += "\"sensor_type\":\"sen0308\",";
  response += "\"enabled\":true,";
  response += "\"present\":" + boolString(read.readOk) + ",";
  response += "\"quality\":\"" + sen0308M01Quality(read) + "\",";
  response += "\"reason\":\"" + sen0308M01Reason(read) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0308M01DetailsJson(read);
  response += "}";
  return response;
#else
  return "{\"sensor_key\":\"sen0308_m01\",\"sensor_type\":\"sen0308\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Sen0308MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_ADS1115 && MBG_HAS_I2C_MUX
  Gen2Ads1115Read read = gen2Ads1115ReadA0();

  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"sen0308_m01\",";
  response += "\"sensor_type\":\"sen0308\",";
  response += "\"measurement_name\":\"raw_adc\",";
  response += "\"measurement_value\":";
  response += read.readOk ? String(read.rawAdc) : String("null");
  response += ",";
  response += "\"measurement_unit\":\"count\",";
  response += "\"valid\":" + boolString(read.readOk) + ",";
  response += "\"quality\":\"" + sen0308M01Quality(read) + "\",";
  response += "\"reason\":\"" + sen0308M01Reason(read) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0308M01DetailsJson(read);
  response += "}";
  return response;
#else
  return "";
#endif
}

#endif
