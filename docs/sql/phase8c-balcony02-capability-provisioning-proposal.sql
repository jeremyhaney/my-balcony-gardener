-- PROPOSAL ONLY — NOT EXECUTED
-- Separate Balcony02 positive commissioned-capability provisioning proposal.
-- Requires the Phase 8C contract migration and separate execution approval.
-- Contains no M04, LUX04, Prototype01, Balcony01, or Scout01 rows.
-- Jeremy accepted 2026-08-12T17:03:41Z as the administrative commissioning-
-- effective instant representing final successful verification of the complete
-- installed complement. This deliberate provisioning decision is not automatic
-- inference from telemetry. Separate SQL-execution approval remains required.

begin;

insert into public.device_capabilities (
  device_id, logical_sensor_key, logical_channel, sensor_family,
  expected_measurement_names, physical_sensor_id, friendly_name,
  location_label, effective_from, provisioning_note
)
values
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'bme280_air', 'AIR', 'BME280',
   array['air_temperature','relative_humidity','barometric_pressure'], null,
   'Balcony Air Conditions', 'Near controller, house side',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'ds18b20_temperature', 'ST', 'DS18B20',
   array['soil temp'], 'ST04', 'Basket 3 Soil Temperature', 'Basket 3',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0308_m01', 'M01', 'SEN0308',
   array['raw_adc'], 'M1', 'Basket 1 Soil Moisture', 'Basket 1',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0308_m02', 'M02', 'SEN0308',
   array['raw_adc'], 'M4', 'Basket 3 Soil Moisture', 'Basket 3',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0308_m03', 'M03', 'SEN0308',
   array['raw_adc'], 'M3', 'Basket 6 Soil Moisture', 'Basket 6',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0562_l01', 'L01', 'SEN0562',
   array['ambient_light'], 'L02', 'Basket 1 Sunlight', 'Basket 1',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0562_l02', 'L02', 'SEN0562',
   array['ambient_light'], 'L03', 'Basket 3 Sunlight', 'Basket 3',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0562_l03', 'L03', 'SEN0562',
   array['ambient_light'], 'L01', 'Basket 6 Sunlight', 'Basket 6',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant'),
  ('7e5bd328-ad68-4389-a71a-fa5cd01b3813', 'sen0204_wl01', 'WL01', 'SEN0204',
   array['reservoir_liquid_detected'], null, 'Reservoir Water Available', 'Reservoir',
   '2026-08-12T17:03:41Z', 'Jeremy-accepted administrative commissioning-effective instant');

commit;
