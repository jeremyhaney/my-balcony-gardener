[CmdletBinding()]
param(
  [Parameter()]
  [string] $BaseUrl
)

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()

function Test-Contract {
  param([bool] $Condition, [string] $Message)
  if ($Condition) { Write-Host "[PASS] $Message" -ForegroundColor Green }
  else { Write-Host "[FAIL] $Message" -ForegroundColor Red; $failures.Add($Message) }
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  Write-Host '[PASS] Script parsed; live /measurements validation skipped because no BaseUrl was supplied.'
  Write-Host '[PASS] Script parsed; live /capabilities validation skipped because no BaseUrl was supplied.'
  Write-Host '[DEFERRED] /status validation belongs to a later approved slice.'
  exit 0
}

$uri = "$($BaseUrl.TrimEnd('/'))/measurements"
Write-Host "GET $uri"
$raw = (Invoke-WebRequest -UseBasicParsing -Method Get -Uri $uri).Content
try { $payload = $raw | ConvertFrom-Json }
catch { Write-Error "Response was not valid JSON: $($_.Exception.Message)"; exit 1 }

Test-Contract (-not [string]::IsNullOrWhiteSpace($payload.device_label)) 'top-level device_label is present'
Test-Contract (-not [string]::IsNullOrWhiteSpace($payload.device_id)) 'top-level device_id is present'
Test-Contract (-not [string]::IsNullOrWhiteSpace($payload.device_role)) 'top-level device_role is present'
Test-Contract (-not [string]::IsNullOrWhiteSpace($payload.measured_at)) 'top-level measured_at is present'

$records = @($payload.records)
$expected = @(
  @('bme280_air','BME280','air_temperature'),
  @('bme280_air','BME280','relative_humidity'),
  @('bme280_air','BME280','barometric_pressure'),
  @('ds18b20_temperature','DS18B20','soil temp'),
  @('sen0308_m01','sen0308','raw_adc'),
  @('sen0308_m02','sen0308','raw_adc'),
  @('sen0308_m03','sen0308','raw_adc'),
  @('sen0562_l01','sen0562','ambient_light'),
  @('sen0562_l02','sen0562','ambient_light'),
  @('sen0562_l03','sen0562','ambient_light'),
  @('sen0204_wl01','sen0204','reservoir_liquid_detected')
)
Test-Contract ($records.Count -eq 11) 'successful Balcony02 response contains exactly 11 records'
for ($index = 0; $index -lt [Math]::Min($records.Count, $expected.Count); $index++) {
  $actual = $records[$index]
  $wanted = $expected[$index]
  Test-Contract (
    $actual.sensor_key -eq $wanted[0] -and
    $actual.sensor_type -eq $wanted[1] -and
    $actual.measurement_name -eq $wanted[2]
  ) "record $($index + 1) has the approved identity and order"
}

foreach ($record in $records) {
  $names = @($record.PSObject.Properties.Name)
  Test-Contract ('device_id' -notin $names) "$($record.sensor_key) omits record-level device_id"
  Test-Contract ('measured_at' -notin $names) "$($record.sensor_key) omits record-level measured_at"
  Test-Contract ('details' -notin $names) "$($record.sensor_key) omits details"
  Test-Contract ('control_eligible' -notin $names) "$($record.sensor_key) omits control_eligible"
  Test-Contract (-not ('physical_sensor_id' -in $names -and $null -eq $record.physical_sensor_id)) "$($record.sensor_key) omits null physical_sensor_id"
  Test-Contract (-not [string]::IsNullOrWhiteSpace($record.reason)) "$($record.sensor_key) has a non-empty reason"
}

Test-Contract (-not ($records.sensor_key -contains 'sen0308_m04')) 'SEN0308 M04 emits no measurement'
foreach ($key in @('bme280_air','ds18b20_temperature')) {
  foreach ($record in @($records | Where-Object sensor_key -eq $key)) {
    Test-Contract ('physical_sensor_id' -notin @($record.PSObject.Properties.Name)) "$key omits physical_sensor_id"
  }
}
$physicalIds = @{
  sen0308_m01='SEN0308-M01'; sen0308_m02='SEN0308-M02'; sen0308_m03='SEN0308-M03'
  sen0562_l01='SEN0562-L01'; sen0562_l02='SEN0562-L02'; sen0562_l03='SEN0562-L03'
  sen0204_wl01='WL01'
}
foreach ($key in $physicalIds.Keys) {
  $record = $records | Where-Object sensor_key -eq $key | Select-Object -First 1
  Test-Contract ($record.physical_sensor_id -eq $physicalIds[$key]) "$key has physical identity $($physicalIds[$key])"
}
$reservoir = $records | Where-Object sensor_key -eq 'sen0204_wl01' | Select-Object -First 1
Test-Contract ($reservoir.measurement_name -eq 'reservoir_liquid_detected') 'SEN0204 uses reservoir_liquid_detected'
Test-Contract ($reservoir.measurement_unit -eq 'state') 'SEN0204 uses state unit'

# Phase 8B.3 validates capabilities independently of measurements so contract
# stability is checked across two distinct device requests.
$capabilitiesUri = "$($BaseUrl.TrimEnd('/'))/capabilities"
Write-Host "GET $capabilitiesUri (request 1)"
$capabilitiesRaw1 = (Invoke-WebRequest -UseBasicParsing -Method Get -Uri $capabilitiesUri).Content
Write-Host "GET $capabilitiesUri (request 2)"
$capabilitiesRaw2 = (Invoke-WebRequest -UseBasicParsing -Method Get -Uri $capabilitiesUri).Content
try {
  $capabilities1 = $capabilitiesRaw1 | ConvertFrom-Json
  $capabilities2 = $capabilitiesRaw2 | ConvertFrom-Json
  Test-Contract $true 'both /capabilities responses parse as JSON'
}
catch { Write-Error "/capabilities response was not valid JSON: $($_.Exception.Message)"; exit 1 }

$expectedTopLevelOrder = @(
  'device_label','device_id','device_role','firmware_version','build_profile','reported_at',
  'can_water','control_authority','pinout','control_configuration','i2c','modules'
)
Test-Contract (
  (@($capabilities1.PSObject.Properties.Name) -join '|') -ceq ($expectedTopLevelOrder -join '|')
) '/capabilities has the exact approved top-level property order'

# Identity and provenance are fixed for the compiled Balcony02 profile except
# reported_at, which is generated for each endpoint snapshot.
Test-Contract ($capabilities1.device_label -ceq 'Balcony02') 'device_label is Balcony02'
Test-Contract ($capabilities1.device_id -ceq '7e5bd328-ad68-4389-a71a-fa5cd01b3813') 'device_id is the approved Balcony02 UUID'
Test-Contract ($capabilities1.device_role -ceq 'controller') 'device_role is controller'
Test-Contract ($capabilities1.firmware_version -ceq 'phase8b-balcony02-proveout') 'firmware_version preserves the Balcony02 provenance value'
Test-Contract ($capabilities1.build_profile -ceq 'balcony02-gen2') 'build_profile is balcony02-gen2'
Test-Contract (-not [string]::IsNullOrWhiteSpace($capabilities1.reported_at)) 'reported_at is present'
Test-Contract ($capabilities1.can_water -ceq $true) 'can_water is true when both compile-time watering gates are true'
Test-Contract ($capabilities1.control_authority -ceq 'local_firmware') 'control_authority is local_firmware'

# Compact JSON comparison checks property order, property set, value types, and
# values for each exact nested object without accepting extra fields.
$expectedPinout = '{"pump_relay":25,"physical_button":32,"reservoir_level":26,"soil_temperature":27,"i2c_sda":21,"i2c_scl":22}' | ConvertFrom-Json
$expectedControlConfiguration = '{"pump_relay_active_state":"HIGH","physical_button_active_state":"LOW","reservoir_liquid_detected_state":"HIGH"}' | ConvertFrom-Json
$expectedI2c = '{"mux_address":"0x70","ads1115_address":"0x48","ads1115_mux_channel":0}' | ConvertFrom-Json
Test-Contract (($capabilities1.pinout | ConvertTo-Json -Compress) -ceq ($expectedPinout | ConvertTo-Json -Compress)) 'pinout has the exact approved fields, order, and values'
Test-Contract (($capabilities1.control_configuration | ConvertTo-Json -Compress) -ceq ($expectedControlConfiguration | ConvertTo-Json -Compress)) 'control_configuration has the exact approved fields, order, and values'
Test-Contract (($capabilities1.i2c | ConvertTo-Json -Compress) -ceq ($expectedI2c | ConvertTo-Json -Compress)) 'i2c has the exact approved fields, order, and values'

$expectedModulesJson = @'
[
  {"sensor_key":"bme280_air","sensor_type":"BME280","installed":true,"connection":{"bus":"i2c_mux","mux_channel":4,"address":"0x76"}},
  {"sensor_key":"ds18b20_temperature","sensor_type":"DS18B20","installed":true,"connection":{"bus":"onewire"}},
  {"sensor_key":"sen0308_m01","sensor_type":"SEN0308","installed":true,"physical_sensor_id":"SEN0308-M01","connection":{"provider":"ads1115","channel":"A0"}},
  {"sensor_key":"sen0308_m02","sensor_type":"SEN0308","installed":true,"physical_sensor_id":"SEN0308-M02","connection":{"provider":"ads1115","channel":"A1"}},
  {"sensor_key":"sen0308_m03","sensor_type":"SEN0308","installed":true,"physical_sensor_id":"SEN0308-M03","connection":{"provider":"ads1115","channel":"A2"}},
  {"sensor_key":"sen0308_m04","sensor_type":"SEN0308","installed":false,"physical_sensor_id":"SEN0308-M04","connection":{"provider":"ads1115","channel":"A3"}},
  {"sensor_key":"sen0562_l01","sensor_type":"SEN0562","installed":true,"physical_sensor_id":"SEN0562-L01","connection":{"bus":"i2c_mux","mux_channel":1,"address":"0x23"}},
  {"sensor_key":"sen0562_l02","sensor_type":"SEN0562","installed":true,"physical_sensor_id":"SEN0562-L02","connection":{"bus":"i2c_mux","mux_channel":2,"address":"0x23"}},
  {"sensor_key":"sen0562_l03","sensor_type":"SEN0562","installed":true,"physical_sensor_id":"SEN0562-L03","connection":{"bus":"i2c_mux","mux_channel":3,"address":"0x23"}},
  {"sensor_key":"sen0204_wl01","sensor_type":"SEN0204","installed":true,"physical_sensor_id":"WL01","connection":{"gpio":26},"control_role":"watering_interlock"}
]
'@
# Windows PowerShell may preserve a top-level JSON array as one nested pipeline
# object. Assign first, then pipe the parsed array to flatten its ten elements.
$capabilityModules = @($capabilities1.modules)
$expectedModulesParsed = $expectedModulesJson | ConvertFrom-Json
$expectedModules = @($expectedModulesParsed | ForEach-Object { $_ })
$capabilityModules = @($capabilities1.modules)
Test-Contract ($capabilityModules.Count -eq 10) '/capabilities contains exactly ten modules'
Test-Contract (($capabilityModules.sensor_key -join '|') -ceq ($expectedModules.sensor_key -join '|')) 'modules have the exact approved order'
for ($index = 0; $index -lt [Math]::Min($capabilityModules.Count, $expectedModules.Count); $index++) {
  $actualModuleJson = $capabilityModules[$index] | ConvertTo-Json -Depth 5 -Compress
  $expectedModuleJson = $expectedModules[$index] | ConvertTo-Json -Depth 5 -Compress
  Test-Contract ($actualModuleJson -ceq $expectedModuleJson) "$($expectedModules[$index].sensor_key) has the exact approved fields and values"
}

$m04Capability = $capabilityModules | Where-Object sensor_key -ceq 'sen0308_m04' | Select-Object -First 1
$l01Capability = $capabilityModules | Where-Object sensor_key -ceq 'sen0562_l01' | Select-Object -First 1
Test-Contract ($null -ne $m04Capability -and $m04Capability.installed -ceq $false) 'SEN0308 M04 is present and installed false'
Test-Contract ($null -ne $l01Capability -and $l01Capability.installed -ceq $true) 'SEN0562 L01 is present and installed true'
$modulesWithControlRole = @($capabilityModules | Where-Object { 'control_role' -in @($_.PSObject.Properties.Name) })
Test-Contract (
  $modulesWithControlRole.Count -eq 1 -and
  $modulesWithControlRole[0].sensor_key -ceq 'sen0204_wl01' -and
  $modulesWithControlRole[0].control_role -ceq 'watering_interlock'
) 'WL01 is the only module with control_role'

# Walk every object and array so forbidden live/detection fields cannot hide at
# any nesting depth in the cleaned response.
$forbiddenCapabilityFields = @(
  'enabled','present','quality','reason','control_eligible','details','measurement_value',
  'measurement_unit','valid','gen2_enabled','pump_control_available','device_can_water',
  'watering_simulation_available','local_http_watering_endpoint_available','relay_test_output_pin',
  'supabase_command_control','i2c_scan','i2c_mux'
)
function Find-ForbiddenCapabilityField {
  param([object] $Value, [string] $Path = '$')
  $hits = [System.Collections.Generic.List[string]]::new()
  if ($null -eq $Value -or $Value -is [string] -or $Value -is [ValueType]) { return $hits }
  if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [pscustomobject]) {
    $index = 0
    foreach ($item in $Value) {
      foreach ($hit in @(Find-ForbiddenCapabilityField -Value $item -Path "$Path[$index]")) { $hits.Add($hit) }
      $index++
    }
    return $hits
  }
  foreach ($property in $Value.PSObject.Properties) {
    $propertyPath = "$Path.$($property.Name)"
    if ($property.Name -in $forbiddenCapabilityFields) { $hits.Add($propertyPath) }
    foreach ($hit in @(Find-ForbiddenCapabilityField -Value $property.Value -Path $propertyPath)) { $hits.Add($hit) }
  }
  return $hits
}
$forbiddenHits = @(Find-ForbiddenCapabilityField -Value $capabilities1)
Test-Contract ($forbiddenHits.Count -eq 0) "no forbidden capability fields appear recursively$(if ($forbiddenHits.Count) { ': ' + ($forbiddenHits -join ', ') })"

# Only reported_at is normalized; byte-independent compact JSON comparison then
# proves every other ordered property and value is stable across requests.
$normalized1 = $capabilitiesRaw1 | ConvertFrom-Json
$normalized2 = $capabilitiesRaw2 | ConvertFrom-Json
$normalized1.reported_at = '<normalized>'
$normalized2.reported_at = '<normalized>'
Test-Contract (
  ($normalized1 | ConvertTo-Json -Depth 10 -Compress) -ceq ($normalized2 | ConvertTo-Json -Depth 10 -Compress)
) 'two /capabilities GET responses are identical after normalizing only reported_at'

Write-Host '[DEFERRED] /status validation belongs to a later approved slice.'
if ($failures.Count -gt 0) { Write-Error "$($failures.Count) contract assertion(s) failed."; exit 1 }
Write-Host 'All /measurements and /capabilities contract assertions passed.' -ForegroundColor Green
