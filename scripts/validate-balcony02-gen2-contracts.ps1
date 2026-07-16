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
  Write-Host '[DEFERRED] /capabilities validation belongs to a later approved slice.'
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

Write-Host '[DEFERRED] /capabilities validation belongs to a later approved slice.'
Write-Host '[DEFERRED] /status validation belongs to a later approved slice.'
if ($failures.Count -gt 0) { Write-Error "$($failures.Count) contract assertion(s) failed."; exit 1 }
Write-Host 'All /measurements contract assertions passed.' -ForegroundColor Green
