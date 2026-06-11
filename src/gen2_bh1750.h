#ifndef GEN2_BH1750_H
#define GEN2_BH1750_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

struct Gen2Bh1750Read {
  bool muxDetected = false;
  bool disableBeforeReadOk = false;
  bool channelSelectOk = false;
  bool disableAfterReadOk = false;
  bool upstreamExpectedAddressPresent = false;
  bool selectedChannelExpectedAddressPresent = false;
  bool readOk = false;
  uint16_t raw = 0;
  float lux = 0.0F;
  const char *failureDetail = "";
};

Gen2Bh1750Read gen2Bh1750ReadMuxed(uint8_t muxChannel, uint8_t sensorAddress);
String gen2Bh1750HexAddressJson(uint8_t address);

#endif

#endif
