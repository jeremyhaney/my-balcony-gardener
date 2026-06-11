#include "config.h"
#include "profile_overrides.h"
#include "gen2_sen0562.h"

#ifdef MBG_GEN2_ENABLED

#include "gen2_bh1750.h"

namespace {
String boolString(bool value) {
  return value ? "true" : "false";
}

#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
struct Sen0562SensorConfig {
  const char *sensorKey;
  const char *physicalSensorId;
  uint8_t muxChannel;
  uint8_t sensorAddress;
};

const Sen0562SensorConfig SEN0562_L01 = {
  "sen0562_l01",
  "SEN0562-L01",
  MBG_SEN0562_L01_MUX_CHANNEL,
  MBG_SEN0562_ADDRESS
};

bool sen0562NotDetected(const Gen2Bh1750Read &read) {
  return !read.muxDetected || (!read.upstreamExpectedAddressPresent && !read.selectedChannelExpectedAddressPresent);
}

String sen0562Quality(const Gen2Bh1750Read &read) {
  if (read.readOk) {
    return "diagnostic";
  }
  return sen0562NotDetected(read) ? "missing" : "failed";
}

String sen0562Reason(const Gen2Bh1750Read &read) {
  if (read.readOk) {
    return "read_ok";
  }
  return sen0562NotDetected(read) ? "not_detected" : "read_failed";
}

String sen0562DetailsJson(const Gen2Bh1750Read &read, const Sen0562SensorConfig &sensor) {
  String details = "{";
  details += "\"physical_sensor_id\":\"" + String(sensor.physicalSensorId) + "\",";
  details += "\"digital_provider\":\"bh1750\",";
  details += "\"bus\":\"i2c\",";
  details += "\"mux_address\":" + gen2Bh1750HexAddressJson(MBG_I2C_MUX_ADDRESS) + ",";
  details += "\"mux_channel\":" + String(sensor.muxChannel) + ",";
  details += "\"sensor_address\":" + gen2Bh1750HexAddressJson(sensor.sensorAddress) + ",";
  details += "\"electrical_boundary\":\"3.3V_only\",";
  details += "\"no_5v\":true,";
  details += "\"module_supply_documented_by_vendor\":\"5V\",";
  details += "\"bench_proof_supply\":\"3.3V\",";
  details += "\"voltage_note\":\"controlled_3v3_functional_test\",";
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

String sen0562CapabilityJson(const Sen0562SensorConfig &sensor, const Gen2Bh1750Read &read) {
  String response = "{";
  response += "\"sensor_key\":\"" + String(sensor.sensorKey) + "\",";
  response += "\"sensor_type\":\"sen0562\",";
  response += "\"enabled\":true,";
  response += "\"present\":" + boolString(read.readOk) + ",";
  response += "\"quality\":\"" + sen0562Quality(read) + "\",";
  response += "\"reason\":\"" + sen0562Reason(read) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0562DetailsJson(read, sensor);
  response += "}";
  return response;
}

String sen0562MeasurementJson(const String &deviceId, const String &measuredAt, const Sen0562SensorConfig &sensor, const Gen2Bh1750Read &read) {
  String response = "{";
  response += "\"device_id\":\"" + deviceId + "\",";
  response += "\"measured_at\":\"" + measuredAt + "\",";
  response += "\"sensor_key\":\"" + String(sensor.sensorKey) + "\",";
  response += "\"sensor_type\":\"sen0562\",";
  response += "\"measurement_name\":\"ambient_light\",";
  response += "\"measurement_value\":";
  response += read.readOk ? String(read.lux, 2) : String("null");
  response += ",";
  response += "\"measurement_unit\":\"lux\",";
  response += "\"valid\":" + boolString(read.readOk) + ",";
  response += "\"quality\":\"" + sen0562Quality(read) + "\",";
  response += "\"reason\":\"" + sen0562Reason(read) + "\",";
  response += "\"control_eligible\":false,";
  response += "\"details\":" + sen0562DetailsJson(read, sensor);
  response += "}";
  return response;
}
#endif
}

void gen2Sen0562Begin() {
#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
  Gen2Bh1750Read read = gen2Bh1750ReadMuxed(SEN0562_L01.muxChannel, SEN0562_L01.sensorAddress);
  Serial.println(read.readOk ? "Gen2 SEN0562-L01 detected" : "Gen2 SEN0562-L01 missing");
#endif
}

String gen2Sen0562CapabilityJson() {
#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
  Gen2Bh1750Read read = gen2Bh1750ReadMuxed(SEN0562_L01.muxChannel, SEN0562_L01.sensorAddress);
  return sen0562CapabilityJson(SEN0562_L01, read);
#else
  return "{\"sensor_key\":\"sen0562_l01\",\"sensor_type\":\"sen0562\",\"enabled\":false,\"present\":false,\"quality\":\"disabled\",\"reason\":\"module_disabled\",\"control_eligible\":false,\"details\":{}}";
#endif
}

String gen2Sen0562MeasurementsJson(const String &deviceId, const String &measuredAt) {
#if MBG_HAS_SEN0562 && MBG_HAS_I2C_MUX
  Gen2Bh1750Read read = gen2Bh1750ReadMuxed(SEN0562_L01.muxChannel, SEN0562_L01.sensorAddress);
  return sen0562MeasurementJson(deviceId, measuredAt, SEN0562_L01, read);
#else
  return "";
#endif
}

#endif
