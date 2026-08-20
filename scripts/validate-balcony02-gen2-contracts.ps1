[CmdletBinding()]
param(
  [Parameter()]
  [string] $BaseUrl,
  [Parameter()]
  [switch] $StatusOnly,
  [Parameter()]
  [string] $ExpectedDeviceLabel = 'Balcony02',
  [Parameter()]
  [string] $ExpectedDeviceId = '7e5bd328-ad68-4389-a71a-fa5cd01b3813',
  [Parameter()]
  [string] $ExpectedDeviceRole = 'controller',
  [Parameter()]
  [string] $ExpectedBuildProfile = 'balcony02-gen2',
  [Parameter()]
  [string] $ExpectedFirmwareVersion = 'phase8b4-gen2-status-contract'
)

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()

function Test-Contract {
  param([bool] $Condition, [string] $Message)
  if ($Condition) { Write-Host "[PASS] $Message" -ForegroundColor Green }
  else { Write-Host "[FAIL] $Message" -ForegroundColor Red; $failures.Add($Message) }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$mainSource = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'src/main.cpp')
$measurementsSource = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'src/gen2_measurements.cpp')
$profileSource = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'src/profile_overrides.h')
$platformioSource = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'platformio.ini')

$registeredRoutes = @(
  [regex]::Matches($mainSource, 'server\.on\("([^"]+)"') |
    ForEach-Object { $_.Groups[1].Value }
)
Test-Contract (
  ($registeredRoutes -join '|') -ceq '/|/status|/capabilities|/measurements'
) 'source registers exactly the approved Balcony02 HTTP routes in order'
Test-Contract ($mainSource.Contains('server.onNotFound(handleNotFound);')) 'source retains the Gen2 not-found handler'

$retiredMainPatterns = @(
  '/logs','/water-now','sendDataToSupabase','sensor_logs','readDhtWithFallback',
  'readSoilMoisture','soilRawAdc','SOIL_PIN','MBG_HAS_SOIL_MOISTURE',
  'MBG_HTTP_WATERING_ENDPOINT_ENABLED','MBG_GEN2_ENABLE_LEGACY_LOGS',
  '#ifndef MBG_GEN2_ENABLED'
)
foreach ($pattern in $retiredMainPatterns) {
  Test-Contract (-not $mainSource.Contains($pattern)) "firmware source omits retired token $pattern"
}

$retiredProfilePatterns = @(
  'MBG_HAS_DHT11','MBG_HAS_VEML6030','MBG_HAS_SOIL_MOISTURE',
  'MBG_WATERING_SIMULATION_AVAILABLE','MBG_HTTP_WATERING_ENDPOINT_ENABLED',
  'MBG_CAPABILITIES_INCLUDE_DHT11_ALIAS','MBG_GEN2_ENABLE_LEGACY_LOGS'
)
foreach ($pattern in $retiredProfilePatterns) {
  Test-Contract (
    -not $profileSource.Contains($pattern) -and -not $platformioSource.Contains($pattern)
  ) "profile/configuration omits retired flag $pattern"
}

$retiredModulePaths = @(
  'src/gen2_dht11.cpp','src/gen2_dht11.h',
  'src/gen2_soil_moisture.cpp','src/gen2_soil_moisture.h',
  'src/gen2_veml6030.cpp','src/gen2_veml6030.h',
  'src/gen2_i2c_mux.cpp','src/gen2_i2c_mux.h',
  'lib/DHT_sensor_library'
)
foreach ($relativePath in $retiredModulePaths) {
  Test-Contract (-not (Test-Path -LiteralPath (Join-Path $repoRoot $relativePath))) "retired module is absent: $relativePath"
}

Test-Contract (
  $measurementsSource.Contains('return balcony02StaticCapabilitiesJson(deviceId, reportedAt);') -and
  -not $measurementsSource.Contains('i2cScanJson') -and
  -not $measurementsSource.Contains('String(MBG_BUILD_PROFILE) ==')
) '/capabilities source returns only the approved static Balcony02 manifest'

$recordSources = @(
  'gen2Bme280MeasurementsJson','gen2Ds18b20MeasurementsJson',
  'gen2Sen0308MeasurementsJson','gen2Sen0562MeasurementsJson','gen2Sen0204MeasurementsJson'
)
$recordsFunctionIndex = $measurementsSource.IndexOf('String gen2MeasurementRecordsJson')
$recordsFunctionSource = if ($recordsFunctionIndex -ge 0) {
  $measurementsSource.Substring($recordsFunctionIndex)
} else { '' }
$recordIndexes = @($recordSources | ForEach-Object { $recordsFunctionSource.IndexOf($_) })
$orderedRecordSources = $true
for ($index = 0; $index -lt $recordIndexes.Count; $index++) {
  if ($recordIndexes[$index] -lt 0 -or ($index -gt 0 -and $recordIndexes[$index] -le $recordIndexes[$index - 1])) {
    $orderedRecordSources = $false
  }
}
Test-Contract $orderedRecordSources '/measurements source retains the exact installed-module read order'

$loopFunctionIndex = $mainSource.IndexOf('void loop()')
$loopFunctionSource = if ($loopFunctionIndex -ge 0) { $mainSource.Substring($loopFunctionIndex) } else { '' }
Test-Contract (
  $loopFunctionSource.Contains('Pump shutoff has priority over client/server, network, and telemetry work.') -and
  $loopFunctionSource.IndexOf('if (isWatering)') -lt $loopFunctionSource.IndexOf('maintainWiFiConnection();') -and
  $loopFunctionSource.IndexOf('maintainWiFiConnection();') -lt $loopFunctionSource.IndexOf('sendGen2MeasurementsToSupabase();')
) 'pump shutoff remains ahead of network, HTTP, and telemetry work'
Test-Contract (
  $mainSource.Contains('if (!gen2Sen0204LiquidDetected())') -and
  $mainSource.Contains('reservoir_liquid_not_detected') -and
  $mainSource.Contains('reservoir_liquid_lost') -and
  $mainSource.Contains('physical_button_hold_timeout')
) 'physical-button reservoir and max-hold safety paths remain in source'
Test-Contract (
  $mainSource.Contains('automaticControlQualityGatesPass') -and
  $mainSource.Contains('maybeStartAutomaticWatering') -and
  $mainSource.Contains('AUTOMATIC_CONTROL_POST_WATERING_EXCLUSION_MS') -and
  $mainSource.Contains('WATERING_COOLDOWN_MS')
) 'generic local automatic-watering gates and start helper remain in source'
Test-Contract (
  $profileSource.Contains('Only an explicitly provisioned Gen2 firmware profile is supported') -and
  $profileSource.Contains('The Balcony02 profile is missing a required installed Gen2 module')
) 'compile-time guards reject unsupported or incomplete profiles'

if ($failures.Count -gt 0) { Write-Error "$($failures.Count) static contract assertion(s) failed."; exit 1 }

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  Write-Host '[PASS] Script parsed; live /measurements validation skipped because no BaseUrl was supplied.'
  Write-Host '[PASS] Script parsed; live /capabilities validation skipped because no BaseUrl was supplied.'
  Write-Host '[PASS] Script parsed; live /status validation skipped because no BaseUrl was supplied.'
  exit 0
}

if (-not $StatusOnly) {
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
Test-Contract ($capabilities1.device_label -ceq $ExpectedDeviceLabel) "device_label is $ExpectedDeviceLabel"
Test-Contract ($capabilities1.device_id -ceq $ExpectedDeviceId) 'device_id is the expected UUID'
Test-Contract ($capabilities1.device_role -ceq $ExpectedDeviceRole) "device_role is $ExpectedDeviceRole"
Test-Contract ($capabilities1.firmware_version -ceq $ExpectedFirmwareVersion) 'firmware_version is the expected Gen2 contract version'
Test-Contract ($capabilities1.build_profile -ceq $ExpectedBuildProfile) "build_profile is $ExpectedBuildProfile"
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
}

$statusUri = "$($BaseUrl.TrimEnd('/'))/status"
Write-Host "GET $statusUri (request 1)"
$statusRaw1 = (Invoke-WebRequest -UseBasicParsing -Method Get -Uri $statusUri).Content
Write-Host "GET $statusUri (request 2)"
$statusRaw2 = (Invoke-WebRequest -UseBasicParsing -Method Get -Uri $statusUri).Content
try {
  $status1 = $statusRaw1 | ConvertFrom-Json
  $status2 = $statusRaw2 | ConvertFrom-Json
  Test-Contract $true 'both /status responses parse as JSON'
}
catch { Write-Error "/status response was not valid JSON: $($_.Exception.Message)"; exit 1 }

$expectedStatusTopLevelOrder = @(
  'device_label','device_id','device_role','firmware_version','build_profile','reported_at',
  'uptime_seconds','network','cloud_reporting','watering','system'
)
$expectedNetworkOrder = @(
  'wifi_connected','wifi_rssi','wifi_status_code','wifi_status_label','ip_address','mac_address',
  'last_wifi_disconnect_reason','last_wifi_disconnect_reason_label',
  'wifi_reconnect_attempts_since_boot','wifi_full_recovery_attempts_since_boot',
  'wifi_disconnects_since_boot','wifi_ip_acquisitions_since_boot',
  'last_wifi_disconnect_uptime_seconds','last_wifi_ip_acquired_uptime_seconds',
  'last_wifi_activity'
)
$expectedCloudOrder = @(
  'last_http_status','last_http_status_label','consecutive_failures','last_error_category',
  'last_successful_measurement_post_at','last_successful_measurement_post_uptime_seconds',
  'last_successful_status_post_at','last_successful_status_post_uptime_seconds'
)
$expectedWateringOrder = @(
  'currently_watering','active_trigger_source','last_watering_at',
  'last_watering_duration_seconds'
)
$expectedSystemOrder = @('free_heap_bytes','minimum_free_heap_bytes')

foreach ($status in @($status1, $status2)) {
  Test-Contract (
    (@($status.PSObject.Properties.Name) -join '|') -ceq ($expectedStatusTopLevelOrder -join '|')
  ) '/status has the exact approved top-level property order'
  Test-Contract (
    (@($status.network.PSObject.Properties.Name) -join '|') -ceq ($expectedNetworkOrder -join '|')
  ) '/status network has the exact approved property order'
  Test-Contract (
    (@($status.cloud_reporting.PSObject.Properties.Name) -join '|') -ceq ($expectedCloudOrder -join '|')
  ) '/status cloud_reporting has the exact approved property order'
  Test-Contract (
    (@($status.watering.PSObject.Properties.Name) -join '|') -ceq ($expectedWateringOrder -join '|')
  ) '/status watering has the exact approved property order'
  Test-Contract (
    (@($status.system.PSObject.Properties.Name) -join '|') -ceq ($expectedSystemOrder -join '|')
  ) '/status system has the exact approved property order'

  Test-Contract ($status.device_label -ceq $ExpectedDeviceLabel) 'status device_label matches expected identity'
  Test-Contract ($status.device_id -ceq $ExpectedDeviceId) 'status device_id matches expected identity'
  Test-Contract ($status.device_role -ceq $ExpectedDeviceRole) 'status device_role matches expected identity'
  Test-Contract ($status.build_profile -ceq $ExpectedBuildProfile) 'status build_profile matches expected provenance'
  Test-Contract ($status.firmware_version -ceq $ExpectedFirmwareVersion) 'status firmware_version matches expected provenance'
  Test-Contract (-not [string]::IsNullOrWhiteSpace($status.reported_at)) 'status reported_at is present'
  Test-Contract ($status.uptime_seconds -ge 0) 'status uptime is nonnegative'

  $wifiLabels = @{
    255='no_shield'; 0='idle'; 1='no_ssid_available'; 2='scan_completed';
    3='connected'; 4='connection_failed'; 5='connection_lost'; 6='disconnected'
  }
  $expectedWifiLabel = if ($wifiLabels.ContainsKey([int]$status.network.wifi_status_code)) {
    $wifiLabels[[int]$status.network.wifi_status_code]
  } else { 'unknown' }
  Test-Contract ($status.network.wifi_status_label -ceq $expectedWifiLabel) 'Wi-Fi status code and label are consistent'
  if ($status.network.wifi_connected) {
    Test-Contract ($null -ne $status.network.wifi_rssi) 'connected Wi-Fi has RSSI evidence'
    Test-Contract (
      $null -eq $status.network.ip_address -or
      (-not [string]::IsNullOrWhiteSpace($status.network.ip_address) -and
        $status.network.ip_address -cne '0.0.0.0')
    ) 'connected Wi-Fi IP is null or a valid address'
  } else {
    Test-Contract ($null -eq $status.network.wifi_rssi) 'disconnected Wi-Fi has null RSSI'
    Test-Contract ($null -eq $status.network.ip_address) 'disconnected Wi-Fi has null IP address'
  }
  Test-Contract (
    ($null -eq $status.network.last_wifi_disconnect_reason -and
      $status.network.last_wifi_disconnect_reason_label -ceq 'not_recorded') -or
    ($null -ne $status.network.last_wifi_disconnect_reason -and
      $status.network.last_wifi_disconnect_reason_label -cne 'not_recorded')
  ) 'disconnect reason and label have consistent recorded-state semantics'

  foreach ($counterName in @(
    'wifi_reconnect_attempts_since_boot','wifi_full_recovery_attempts_since_boot',
    'wifi_disconnects_since_boot','wifi_ip_acquisitions_since_boot'
  )) {
    Test-Contract ($status.network.$counterName -ge 0) "$counterName is nonnegative"
  }
  foreach ($uptimeName in @(
    'last_wifi_disconnect_uptime_seconds','last_wifi_ip_acquired_uptime_seconds'
  )) {
    Test-Contract (
      $null -eq $status.network.$uptimeName -or $status.network.$uptimeName -ge 0
    ) "$uptimeName is null or nonnegative"
  }
  Test-Contract ($status.network.last_wifi_activity -cin @(
    'none','connected','ip_acquired','disconnected','disconnect_detected',
    'reconnect_requested','full_recovery_started'
  )) 'last_wifi_activity is an approved normalized value'

  $httpStatus = $status.cloud_reporting.last_http_status
  $expectedHttpLabel = if ($null -eq $httpStatus) { 'not_recorded' }
    elseif ($httpStatus -eq 0) { 'no_http_response' }
    elseif ($httpStatus -lt 0) { 'client_error' }
    else {
      $httpLabels = @{
        200='ok'; 201='created'; 204='no_content'; 400='bad_request'; 401='unauthorized';
        403='forbidden'; 404='not_found'; 409='conflict'; 429='too_many_requests';
        500='internal_server_error'; 502='bad_gateway'; 503='service_unavailable'
      }
      if ($httpLabels.ContainsKey([int]$httpStatus)) { $httpLabels[[int]$httpStatus] } else { 'unknown' }
    }
  Test-Contract ($status.cloud_reporting.last_http_status_label -ceq $expectedHttpLabel) 'HTTP status and label are consistent'
  Test-Contract ($status.cloud_reporting.consecutive_failures -ge 0) 'cloud failure count is nonnegative'
  Test-Contract (
    ($null -eq $status.cloud_reporting.last_successful_measurement_post_at) -eq
    ($null -eq $status.cloud_reporting.last_successful_measurement_post_uptime_seconds)
  ) 'measurement success timestamp and uptime evidence are paired'
  Test-Contract (
    ($null -eq $status.cloud_reporting.last_successful_status_post_at) -eq
    ($null -eq $status.cloud_reporting.last_successful_status_post_uptime_seconds)
  ) 'status success timestamp and uptime evidence are paired'
  foreach ($successUptimeName in @(
    'last_successful_measurement_post_uptime_seconds',
    'last_successful_status_post_uptime_seconds'
  )) {
    Test-Contract (
      $null -eq $status.cloud_reporting.$successUptimeName -or
      $status.cloud_reporting.$successUptimeName -ge 0
    ) "$successUptimeName is null or nonnegative"
  }

  if ($status.watering.currently_watering) {
    Test-Contract ($status.watering.active_trigger_source -cin @(
      'physical_button','automatic','manual_local','firmware_safety'
    )) 'active watering trigger is approved'
  } else {
    Test-Contract ($null -eq $status.watering.active_trigger_source) 'idle watering trigger is null'
  }
  Test-Contract (
    $null -eq $status.watering.last_watering_at -or
    -not [string]::IsNullOrWhiteSpace(
      [string]$status.watering.last_watering_at
    )
  ) 'last_watering_at is null or nonempty'
  Test-Contract (
    $null -eq $status.watering.last_watering_duration_seconds -or
    $status.watering.last_watering_duration_seconds -ge 0
  ) 'watering duration is null or nonnegative'
  Test-Contract ($status.system.free_heap_bytes -ge 0) 'free heap is nonnegative'
  Test-Contract ($status.system.minimum_free_heap_bytes -ge 0) 'minimum free heap is nonnegative'
}

Test-Contract ($status2.uptime_seconds -ge $status1.uptime_seconds) 'status uptime is nondecreasing across requests'

$forbiddenStatusFields = @(
  'last_wifi_status_code','wifi_reconnect_attempt_count','wifi_begin_recovery_attempt_count',
  'wifi_disconnect_event_count','wifi_got_ip_event_count','last_wifi_disconnected_uptime_seconds',
  'last_wifi_reconnected_uptime_seconds','last_network_recovery_action',
  'last_supabase_http_status','consecutive_supabase_failures','last_supabase_error_category',
  'last_successful_telemetry_post_at','last_successful_telemetry_post_uptime_seconds',
  'last_successful_diagnostics_post_at','last_successful_diagnostics_post_uptime_seconds',
  'pump_control_available','device_can_water','lastWateredTime','lastWateringDuration',
  'hasLastGoodDht','free_heap','min_free_heap','ssid','details'
)
function Find-ForbiddenStatusField {
  param([object] $Value, [string] $Path = '$')
  $hits = [System.Collections.Generic.List[string]]::new()
  if ($null -eq $Value -or $Value -is [string] -or $Value -is [ValueType]) { return $hits }
  if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [pscustomobject]) {
    $index = 0
    foreach ($item in $Value) {
      foreach ($hit in @(Find-ForbiddenStatusField -Value $item -Path "$Path[$index]")) { $hits.Add($hit) }
      $index++
    }
    return $hits
  }
  foreach ($property in $Value.PSObject.Properties) {
    $propertyPath = "$Path.$($property.Name)"
    if ($property.Name -in $forbiddenStatusFields) { $hits.Add($propertyPath) }
    if ($property.Name -in @('ip_address','mac_address') -and $Path -cne '$.network') {
      $hits.Add($propertyPath)
    }
    foreach ($hit in @(Find-ForbiddenStatusField -Value $property.Value -Path $propertyPath)) { $hits.Add($hit) }
  }
  return $hits
}
$forbiddenStatusHits = @(Find-ForbiddenStatusField -Value $status1)
Test-Contract ($forbiddenStatusHits.Count -eq 0) "no forbidden status fields appear recursively$(if ($forbiddenStatusHits.Count) { ': ' + ($forbiddenStatusHits -join ', ') })"

if ($failures.Count -gt 0) { Write-Error "$($failures.Count) contract assertion(s) failed."; exit 1 }
Write-Host 'All requested Gen2 endpoint contract assertions passed.' -ForegroundColor Green
