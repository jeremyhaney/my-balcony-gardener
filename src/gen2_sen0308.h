#ifndef GEN2_SEN0308_H
#define GEN2_SEN0308_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

String gen2Sen0308CapabilityJson();
String gen2Sen0308MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
