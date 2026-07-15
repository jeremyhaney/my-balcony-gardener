#ifndef GEN2_SEN0204_H
#define GEN2_SEN0204_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Sen0204Begin();
int gen2Sen0204RawState();
bool gen2Sen0204LiquidDetected();
String gen2Sen0204CapabilityJson();
String gen2Sen0204MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
