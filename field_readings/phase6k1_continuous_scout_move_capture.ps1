cd "C:\AIProjects\projects\my-balcony-gardener"

powercfg /change standby-timeout-ac 960
powercfg /change monitor-timeout-ac 30

$OutputFile = ".\field_readings\phase6k1_b3e1_vs_b6e2_continuous_scout_move_settling_$(Get-Date -Format yyyyMMdd_HHmmss).csv"
$MarkerFile = ".\field_readings\SCOUT_MOVED_TO_B6E2.marker"

if (Test-Path $MarkerFile) {
    Remove-Item $MarkerFile -Force
}

$MovePromptAfterMinutes = 10
$FastIntervalSeconds = 15
$PostMoveFastMinutes = 90
$PostMoveIntervalSeconds = 30
$LongTermIntervalSeconds = 300

$RunStart = Get-Date
$PlannedMovePromptTime = $RunStart.AddMinutes($MovePromptAfterMinutes)

$MovePrompted = $false
$MoveRecorded = $false
$MoveRecordedAt = $null
$AssumedMoveTime = $null

$Devices = @(
    [pscustomobject]@{
        device_name        = "installed-balcony-unit"
        ip                 = "10.0.0.200"
        device_id_expected = "550e8400-e29b-41d4-a716-446655440000"
        dht_sensor_id      = "DHT01"
        moisture_sensor_id = "SM01"
        role               = "controller"
    },
    [pscustomobject]@{
        device_name        = "balcony-scout-01"
        ip                 = "10.0.0.180"
        device_id_expected = "28f4e6e3-5979-4af4-9753-34e185d8e47e"
        dht_sensor_id      = "DHT02"
        moisture_sensor_id = "SM02"
        role               = "sensor-scout"
    }
)

function Add-RowToCsv {
    param([object]$Row)

    if (-not (Test-Path $OutputFile)) {
        $Row | Export-Csv -Path $OutputFile -NoTypeInformation
    }
    else {
        $Row | Export-Csv -Path $OutputFile -NoTypeInformation -Append
    }
}

function Write-EventMarker {
    param(
        [string]$PhaseLabel,
        [string]$MarkerText
    )

    $marker = [pscustomobject]@{
        row_type                 = "event_marker"
        sample_cycle             = ""
        observed_at_local        = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        seconds_since_start      = [math]::Round(((Get-Date) - $RunStart).TotalSeconds, 1)
        seconds_since_move       = ""
        test_name                = "phase6k1_b3e1_vs_b6e2_continuous_scout_move_settling"
        phase_label              = $PhaseLabel
        basket_id                = ""
        emitter_location         = ""
        placement_label          = $MarkerText
        sensor_position_label    = ""
        device_name              = "event_marker"
        ip                       = ""
        role                     = ""
        expected_device_id       = ""
        device_id                = ""
        device_id_match          = ""
        dht_sensor_id            = ""
        moisture_sensor_id       = ""
        device_timestamp         = ""
        temperature_f            = ""
        humidity_percent         = ""
        moisture_index           = ""
        soil_raw_adc             = ""
        watering                 = ""
        last_watered_time        = ""
        last_watering_duration   = ""
        note                     = $MarkerText
        error                    = ""
    }

    Add-RowToCsv -Row $marker
}

function Get-PhaseLabel {
    param([datetime]$Now)

    if ($Now -lt $PlannedMovePromptTime) {
        return "pre_move_b3e1_fast_baseline"
    }

    if ($MoveRecorded) {
        $MinutesAfterMove = ($Now - $MoveRecordedAt).TotalMinutes

        if ($MinutesAfterMove -lt 10) {
            return "post_move_b6e2_settling_0_to_10_min"
        }
        elseif ($MinutesAfterMove -lt 30) {
            return "post_move_b6e2_settling_10_to_30_min"
        }
        elseif ($MinutesAfterMove -lt 90) {
            return "post_move_b6e2_settling_30_to_90_min"
        }
        else {
            return "long_term_b3e1_vs_b6e2_monitoring"
        }
    }

    if ($AssumedMoveTime) {
        return "move_window_open_waiting_for_marker_file"
    }

    return "move_window_continuous_capture"
}

function Get-NextIntervalSeconds {
    param([datetime]$Now)

    if ($Now -lt $PlannedMovePromptTime) {
        return $FastIntervalSeconds
    }

    if ($MoveRecorded) {
        if (($Now - $MoveRecordedAt).TotalMinutes -lt $PostMoveFastMinutes) {
            return $PostMoveIntervalSeconds
        }
        return $LongTermIntervalSeconds
    }

    return $FastIntervalSeconds
}

function Capture-MbgDevice {
    param(
        [int]$SampleCycle,
        [string]$PhaseLabel,
        [object]$Device,
        [datetime]$Now
    )

    $IsScout = ($Device.moisture_sensor_id -eq "SM02")

    if ($IsScout -and $MoveRecorded) {
        $SensorPosition = "B6E2 scout moved location - marker file confirmed"
        $BasketId = "B6"
        $EmitterLocation = "B6E2"
    }
    elseif ($IsScout -and $AssumedMoveTime) {
        $SensorPosition = "Scout move window open - location may be moving or moved"
        $BasketId = "B6"
        $EmitterLocation = "B6E2"
    }
    elseif ($IsScout) {
        $SensorPosition = "B3E1 scout starting location before move"
        $BasketId = "B3"
        $EmitterLocation = "B3E1"
    }
    else {
        $SensorPosition = "B3E1 installed sensor location - not moved"
        $BasketId = "B3"
        $EmitterLocation = "B3E1"
    }

    $SecondsSinceMove = ""
    if ($MoveRecorded) {
        $SecondsSinceMove = [math]::Round(($Now - $MoveRecordedAt).TotalSeconds, 1)
    }

    try {
        $r = Invoke-RestMethod -Uri "http://$($Device.ip)/logs" -TimeoutSec 5

        return [pscustomobject]@{
            row_type                 = "data"
            sample_cycle             = $SampleCycle
            observed_at_local        = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            seconds_since_start      = [math]::Round(((Get-Date) - $RunStart).TotalSeconds, 1)
            seconds_since_move       = $SecondsSinceMove
            test_name                = "phase6k1_b3e1_vs_b6e2_continuous_scout_move_settling"
            phase_label              = $PhaseLabel
            basket_id                = $BasketId
            emitter_location         = $EmitterLocation
            placement_label          = "SM01 remains at B3E1; SM02 moves from B3E1 to B6E2 while capture continues"
            sensor_position_label    = $SensorPosition
            device_name              = $Device.device_name
            ip                       = $Device.ip
            role                     = $Device.role
            expected_device_id       = $Device.device_id_expected
            device_id                = $r.device_id
            device_id_match          = ($r.device_id -eq $Device.device_id_expected)
            dht_sensor_id            = $Device.dht_sensor_id
            moisture_sensor_id       = $Device.moisture_sensor_id
            device_timestamp         = $r.timestamp
            temperature_f            = $r.data.temperature
            humidity_percent         = $r.data.humidity
            moisture_index           = $r.data.moisture
            soil_raw_adc             = $r.data.soilRawAdc
            watering                 = $r.data.watering
            last_watered_time        = $r.data.lastWateredTime
            last_watering_duration   = $r.data.lastWateringDuration
            note                     = "Continuous no-watering capture; scout sensor move/settling experiment"
            error                    = ""
        }
    }
    catch {
        return [pscustomobject]@{
            row_type                 = "data"
            sample_cycle             = $SampleCycle
            observed_at_local        = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            seconds_since_start      = [math]::Round(((Get-Date) - $RunStart).TotalSeconds, 1)
            seconds_since_move       = $SecondsSinceMove
            test_name                = "phase6k1_b3e1_vs_b6e2_continuous_scout_move_settling"
            phase_label              = $PhaseLabel
            basket_id                = $BasketId
            emitter_location         = $EmitterLocation
            placement_label          = "SM01 remains at B3E1; SM02 moves from B3E1 to B6E2 while capture continues"
            sensor_position_label    = $SensorPosition
            device_name              = $Device.device_name
            ip                       = $Device.ip
            role                     = $Device.role
            expected_device_id       = $Device.device_id_expected
            device_id                = ""
            device_id_match          = ""
            dht_sensor_id            = $Device.dht_sensor_id
            moisture_sensor_id       = $Device.moisture_sensor_id
            device_timestamp         = ""
            temperature_f            = ""
            humidity_percent         = ""
            moisture_index           = ""
            soil_raw_adc             = ""
            watering                 = ""
            last_watered_time        = ""
            last_watering_duration   = ""
            note                     = "Continuous no-watering capture; scout sensor move/settling experiment"
            error                    = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "Phase 6K.1 continuous scout-move / settling capture" -ForegroundColor Cyan
Write-Host "Output file: $OutputFile"
Write-Host "Move alert happens after $MovePromptAfterMinutes minutes." -ForegroundColor Yellow
Write-Host ""
Write-Host "After moving SM02 to B6E2, run this in a SECOND PowerShell window:" -ForegroundColor Yellow
Write-Host "Set-Content -Path `"C:\AIProjects\projects\my-balcony-gardener\field_readings\SCOUT_MOVED_TO_B6E2.marker`" -Value (Get-Date).ToString(`"yyyy-MM-dd HH:mm:ss`")"
Write-Host ""

Write-EventMarker -PhaseLabel "experiment_start" -MarkerText "Experiment start: SM01 at B3E1; SM02 starts near B3E1 before planned move to B6E2."

$SampleCycle = 1
$NextSampleTime = Get-Date

while ($true) {
    $Now = Get-Date

    if ($Now -lt $NextSampleTime) {
        Start-Sleep -Seconds ([math]::Max(1, [int](($NextSampleTime - $Now).TotalSeconds)))
    }

    $Now = Get-Date

    if (-not $MovePrompted -and $Now -ge $PlannedMovePromptTime) {
        $MovePrompted = $true
        $AssumedMoveTime = $Now

        Write-Host ""
        Write-Host "MOVE WINDOW STARTED: move ONLY SM02 / scout sensor to B6E2 now." -ForegroundColor Yellow
        Write-Host "Do NOT move SM01 / installed balcony sensor at B3E1." -ForegroundColor Yellow
        try { [console]::beep(1000, 800) } catch {}

        Write-EventMarker -PhaseLabel "move_window_started" -MarkerText "Move prompt issued: move SM02 scout sensor from B3E1 area to B6E2 while capture continues."
    }

    if (-not $MoveRecorded -and (Test-Path $MarkerFile)) {
        $MoveRecorded = $true

        try {
            $markerText = Get-Content $MarkerFile -ErrorAction Stop | Select-Object -First 1
            $MoveRecordedAt = [datetime]::Parse($markerText)
        }
        catch {
            $MoveRecordedAt = Get-Date
        }

        Write-Host ""
        Write-Host "SCOUT MOVE MARKER DETECTED at $($MoveRecordedAt.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Green

        Write-EventMarker -PhaseLabel "actual_scout_move_marker_detected" -MarkerText "Marker file detected. SM02 scout should now be installed at B6E2."
    }

    $PhaseLabel = Get-PhaseLabel -Now $Now

    foreach ($Device in $Devices) {
        $row = Capture-MbgDevice -SampleCycle $SampleCycle -PhaseLabel $PhaseLabel -Device $Device -Now $Now
        Add-RowToCsv -Row $row
    }

    Write-Host "Captured cycle $SampleCycle at $(Get-Date -Format 'HH:mm:ss') - $PhaseLabel"

    $SampleCycle++

    $Interval = Get-NextIntervalSeconds -Now $Now
    $NextSampleTime = $NextSampleTime.AddSeconds($Interval)
}