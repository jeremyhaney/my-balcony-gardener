#ifndef PROFILE_OVERRIDES_H
#define PROFILE_OVERRIDES_H

#if !defined(MBG_GEN2_ENABLED) || MBG_GEN2_ENABLED != 1
#error "Only an explicitly provisioned Gen2 firmware profile is supported"
#endif

// Every supported profile must declare its complete current hardware contract.
// No generic identity, disabled-module, pin, or behavior defaults are accepted.
#ifndef MBG_RELAY_PIN
#error "MBG_RELAY_PIN must be defined by the supported firmware profile"
#endif
#ifndef MBG_PUMP_CONTROL_AVAILABLE
#error "MBG_PUMP_CONTROL_AVAILABLE must be defined by the supported firmware profile"
#endif
#ifndef MBG_DEVICE_CAN_WATER
#error "MBG_DEVICE_CAN_WATER must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHYSICAL_BUTTON_ENABLED
#error "MBG_PHYSICAL_BUTTON_ENABLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHYSICAL_BUTTON_PIN
#error "MBG_PHYSICAL_BUTTON_PIN must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHYSICAL_BUTTON_ACTIVE_LOW
#error "MBG_PHYSICAL_BUTTON_ACTIVE_LOW must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHYSICAL_BUTTON_DEBOUNCE_MS
#error "MBG_PHYSICAL_BUTTON_DEBOUNCE_MS must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHYSICAL_BUTTON_MAX_HOLD_MS
#error "MBG_PHYSICAL_BUTTON_MAX_HOLD_MS must be defined by the supported firmware profile"
#endif
#ifndef MBG_HAS_BME280
#error "MBG_HAS_BME280 must be defined by the supported firmware profile"
#endif
#ifndef MBG_BME280_USE_I2C_MUX
#error "MBG_BME280_USE_I2C_MUX must be defined by the supported firmware profile"
#endif
#ifndef MBG_BME280_MUX_CHANNEL
#error "MBG_BME280_MUX_CHANNEL must be defined by the supported firmware profile"
#endif
#ifndef MBG_HAS_DS18B20
#error "MBG_HAS_DS18B20 must be defined by the supported firmware profile"
#endif
#ifndef MBG_DS18B20_PIN
#error "MBG_DS18B20_PIN must be defined by the supported firmware profile"
#endif
#ifndef MBG_HAS_SEN0204
#error "MBG_HAS_SEN0204 must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0204_PIN
#error "MBG_SEN0204_PIN must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0204_PUMP_INTERLOCK_ENABLED
#error "MBG_SEN0204_PUMP_INTERLOCK_ENABLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_HAS_I2C_MUX
#error "MBG_HAS_I2C_MUX must be defined by the supported firmware profile"
#endif
#ifndef MBG_I2C_MUX_ADDRESS
#error "MBG_I2C_MUX_ADDRESS must be defined by the supported firmware profile"
#endif
#ifndef MBG_HAS_ADS1115
#error "MBG_HAS_ADS1115 must be defined by the supported firmware profile"
#endif
#ifndef MBG_ADS1115_MUX_CHANNEL
#error "MBG_ADS1115_MUX_CHANNEL must be defined by the supported firmware profile"
#endif
#ifndef MBG_ADS1115_ADDRESS
#error "MBG_ADS1115_ADDRESS must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A0_INSTALLED
#error "MBG_SEN0308_A0_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A1_INSTALLED
#error "MBG_SEN0308_A1_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A2_INSTALLED
#error "MBG_SEN0308_A2_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A3_INSTALLED
#error "MBG_SEN0308_A3_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A0_PHYSICAL_SENSOR_ID
#error "MBG_SEN0308_A0_PHYSICAL_SENSOR_ID must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A1_PHYSICAL_SENSOR_ID
#error "MBG_SEN0308_A1_PHYSICAL_SENSOR_ID must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A2_PHYSICAL_SENSOR_ID
#error "MBG_SEN0308_A2_PHYSICAL_SENSOR_ID must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0308_A3_PHYSICAL_SENSOR_ID
#error "MBG_SEN0308_A3_PHYSICAL_SENSOR_ID must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHASE7N1_3V3_ONLY
#error "MBG_PHASE7N1_3V3_ONLY must be defined by the supported firmware profile"
#endif
#ifndef MBG_HAS_SEN0562
#error "MBG_HAS_SEN0562 must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_ADDRESS
#error "MBG_SEN0562_ADDRESS must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_L01_INSTALLED
#error "MBG_SEN0562_L01_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_L02_INSTALLED
#error "MBG_SEN0562_L02_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_L03_INSTALLED
#error "MBG_SEN0562_L03_INSTALLED must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_L01_MUX_CHANNEL
#error "MBG_SEN0562_L01_MUX_CHANNEL must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_L02_MUX_CHANNEL
#error "MBG_SEN0562_L02_MUX_CHANNEL must be defined by the supported firmware profile"
#endif
#ifndef MBG_SEN0562_L03_MUX_CHANNEL
#error "MBG_SEN0562_L03_MUX_CHANNEL must be defined by the supported firmware profile"
#endif
#ifndef MBG_PHASE7N4A_CONTROLLED_3V3_SEN0562_PROOF
#error "MBG_PHASE7N4A_CONTROLLED_3V3_SEN0562_PROOF must be defined by the supported firmware profile"
#endif
#ifndef MBG_I2C_SDA_PIN
#error "MBG_I2C_SDA_PIN must be defined by the supported firmware profile"
#endif
#ifndef MBG_I2C_SCL_PIN
#error "MBG_I2C_SCL_PIN must be defined by the supported firmware profile"
#endif

#ifdef RELAY_PIN
#undef RELAY_PIN
#endif
#define RELAY_PIN MBG_RELAY_PIN

#define MBG_HAS_I2C_MODULES (MBG_HAS_BME280 || MBG_HAS_I2C_MUX || MBG_HAS_ADS1115 || MBG_HAS_SEN0562)

// The single supported static contract must be provisioned completely and
// exactly. A future numbered device must add its own explicit profile, UUID,
// static manifest, and validation before this guard is intentionally extended.
#if !MBG_PUMP_CONTROL_AVAILABLE || !MBG_DEVICE_CAN_WATER || !MBG_PHYSICAL_BUTTON_ENABLED || !MBG_SEN0204_PUMP_INTERLOCK_ENABLED
#error "The Balcony02 profile requires pump, watering, physical-button, and reservoir-interlock support"
#endif
#if !MBG_HAS_BME280 || !MBG_HAS_DS18B20 || !MBG_HAS_SEN0204 || !MBG_HAS_I2C_MUX || !MBG_HAS_ADS1115 || !MBG_HAS_SEN0562
#error "The Balcony02 profile is missing a required installed Gen2 module"
#endif
#if !MBG_BME280_USE_I2C_MUX || !MBG_PHASE7N1_3V3_ONLY || !MBG_PHASE7N4A_CONTROLLED_3V3_SEN0562_PROOF
#error "The Balcony02 profile is missing a required topology/electrical proof flag"
#endif
#if !MBG_SEN0308_A0_INSTALLED || !MBG_SEN0308_A1_INSTALLED || !MBG_SEN0308_A2_INSTALLED || MBG_SEN0308_A3_INSTALLED
#error "The Balcony02 SEN0308 installed-channel contract must be A0/A1/A2 on and A3 off"
#endif
#if !MBG_SEN0562_L01_INSTALLED || !MBG_SEN0562_L02_INSTALLED || !MBG_SEN0562_L03_INSTALLED
#error "The Balcony02 SEN0562 L01/L02/L03 contract requires all three modules"
#endif

#if MBG_BME280_MUX_CHANNEL > 7 || MBG_ADS1115_MUX_CHANNEL > 7 || MBG_SEN0562_L01_MUX_CHANNEL > 7 || MBG_SEN0562_L02_MUX_CHANNEL > 7 || MBG_SEN0562_L03_MUX_CHANNEL > 7
#error "All configured I2C mux channels must be 0..7"
#endif
#if MBG_SEN0562_L01_MUX_CHANNEL == MBG_ADS1115_MUX_CHANNEL || MBG_SEN0562_L02_MUX_CHANNEL == MBG_ADS1115_MUX_CHANNEL || MBG_SEN0562_L03_MUX_CHANNEL == MBG_ADS1115_MUX_CHANNEL
#error "SEN0562 modules must not share the ADS1115 mux channel"
#endif
#if MBG_SEN0562_L01_MUX_CHANNEL == MBG_SEN0562_L02_MUX_CHANNEL || MBG_SEN0562_L01_MUX_CHANNEL == MBG_SEN0562_L03_MUX_CHANNEL || MBG_SEN0562_L02_MUX_CHANNEL == MBG_SEN0562_L03_MUX_CHANNEL
#error "SEN0562-L01/L02/L03 mux channels must be distinct"
#endif
#if MBG_BME280_MUX_CHANNEL == MBG_ADS1115_MUX_CHANNEL
#error "BME280 must not share the ADS1115 mux channel"
#endif
#if MBG_BME280_MUX_CHANNEL == MBG_SEN0562_L01_MUX_CHANNEL || MBG_BME280_MUX_CHANNEL == MBG_SEN0562_L02_MUX_CHANNEL || MBG_BME280_MUX_CHANNEL == MBG_SEN0562_L03_MUX_CHANNEL
#error "BME280 must not share a SEN0562 mux channel"
#endif

#if MBG_SEN0204_PIN < 0 || MBG_SEN0204_PIN > 39 || (MBG_SEN0204_PIN >= 6 && MBG_SEN0204_PIN <= 11)
#error "MBG_SEN0204_PIN must be a usable ESP32 GPIO"
#endif
#if MBG_SEN0204_PIN == RELAY_PIN || MBG_SEN0204_PIN == MBG_PHYSICAL_BUTTON_PIN || MBG_SEN0204_PIN == MBG_DS18B20_PIN
#error "MBG_SEN0204_PIN conflicts with another configured discrete pin"
#endif
#if MBG_SEN0204_PIN == MBG_I2C_SDA_PIN || MBG_SEN0204_PIN == MBG_I2C_SCL_PIN
#error "MBG_SEN0204_PIN conflicts with configured I2C pins"
#endif

#endif
