#ifndef GEN2_DS18B20_H
#define GEN2_DS18B20_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Ds18b20Begin();
String gen2Ds18b20CapabilityJson();
String gen2Ds18b20MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
