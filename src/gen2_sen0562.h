#ifndef GEN2_SEN0562_H
#define GEN2_SEN0562_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Sen0562Begin();
String gen2Sen0562CapabilityJson();
String gen2Sen0562MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
