#ifndef GEN2_VEML6030_H
#define GEN2_VEML6030_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Veml6030Begin();
String gen2Veml6030CapabilityJson();
String gen2Veml6030MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
