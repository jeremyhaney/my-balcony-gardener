#ifndef GEN2_BME280_H
#define GEN2_BME280_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

void gen2Bme280Begin();
String gen2Bme280CapabilityJson();
String gen2Bme280MeasurementsJson(const String &deviceId, const String &measuredAt);

#endif

#endif
