#ifndef GEN2_SOIL_MOISTURE_H
#define GEN2_SOIL_MOISTURE_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

String gen2SoilMoistureCapabilityJson();
String gen2SoilMoistureMeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
