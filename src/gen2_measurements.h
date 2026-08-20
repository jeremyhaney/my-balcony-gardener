#ifndef GEN2_MEASUREMENTS_H
#define GEN2_MEASUREMENTS_H

#include <Arduino.h>

void gen2Begin();
String gen2CapabilitiesJson(const String &deviceId, const String &reportedAt);
String gen2MeasurementRecordsJson(const String &deviceId, const String &measuredAt);
String gen2MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif
