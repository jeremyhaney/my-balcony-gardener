#ifndef PROFILE_OVERRIDES_H
#define PROFILE_OVERRIDES_H

#ifdef MBG_RELAY_PIN
#undef RELAY_PIN
#define RELAY_PIN MBG_RELAY_PIN
#endif

#ifdef MBG_GEN2_ENABLED
#ifndef MBG_HAS_DHT11
#define MBG_HAS_DHT11 0
#endif

#ifndef MBG_HAS_BME280
#define MBG_HAS_BME280 0
#endif

#ifndef MBG_HAS_DS18B20
#define MBG_HAS_DS18B20 0
#endif

#ifndef MBG_HAS_VEML6030
#define MBG_HAS_VEML6030 0
#endif

#ifndef MBG_HAS_SOIL_MOISTURE
#define MBG_HAS_SOIL_MOISTURE 0
#endif

#ifndef MBG_I2C_SDA_PIN
#define MBG_I2C_SDA_PIN 21
#endif

#ifndef MBG_I2C_SCL_PIN
#define MBG_I2C_SCL_PIN 22
#endif

#if MBG_HAS_DS18B20 && !defined(MBG_DS18B20_PIN)
#error "MBG_HAS_DS18B20 requires MBG_DS18B20_PIN"
#endif

#if MBG_HAS_DHT11 && ((DHTPIN == MBG_I2C_SDA_PIN) || (DHTPIN == MBG_I2C_SCL_PIN))
#error "Gen2 DHT11 pin conflicts with configured I2C pins"
#endif

#endif

#endif
