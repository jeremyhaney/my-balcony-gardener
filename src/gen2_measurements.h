#ifndef GEN2_MEASUREMENTS_H
#define GEN2_MEASUREMENTS_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Begin();
String gen2CapabilitiesJson(const String &deviceId);
String gen2MeasurementRecordsJson(const String &deviceId, const String &measuredAt);
String gen2MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
