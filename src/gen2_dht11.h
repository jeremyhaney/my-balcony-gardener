#ifndef GEN2_DHT11_H
#define GEN2_DHT11_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Dht11Begin();
String gen2Dht11CapabilityJson();
String gen2Dht11MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
