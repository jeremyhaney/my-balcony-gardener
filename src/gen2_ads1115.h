#ifndef GEN2_ADS1115_H
#define GEN2_ADS1115_H

#include <Arduino.h>

#ifdef MBG_GEN2_ENABLED

struct Gen2Ads1115Read {
  bool muxDetected = false;
  bool disableBeforeReadOk = false;
  bool channelSelectOk = false;
  bool disableAfterReadOk = false;
  bool upstreamExpectedAddressPresent = false;
  bool selectedChannelExpectedAddressPresent = false;
  bool readOk = false;
  int16_t rawAdc = 0;
  const char *failureDetail = "";
};

Gen2Ads1115Read gen2Ads1115ReadChannel(uint8_t adsChannel);
Gen2Ads1115Read gen2Ads1115ReadA0();
String gen2Ads1115HexAddressJson(uint8_t address);

#endif

#endif
