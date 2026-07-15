// My Balcony Gardener - ESP32 Firmware
// Version: v1.0.0_refactored
// Follows PRD architecture requirements

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DHT.h>
#include <cstring>
#include "time.h"
#include "config.h"
#include "profile_overrides.h"
#include "device_identity.h"
#include "firmware_identity.h"

#ifdef MBG_GEN2_ENABLED
#include "gen2_bme280.h"
#include "gen2_measurements.h"
#endif

// 15-minute post-watering cooldown/soak guard for automatic watering only.
// Guarded here because src/config.h contains local secrets and is intentionally ignored by Git.
#ifndef WATERING_COOLDOWN_MS
#define WATERING_COOLDOWN_MS 900000
#endif

#ifndef WIFI_RECONNECT_INTERVAL_MS
#define WIFI_RECONNECT_INTERVAL_MS 30000
#endif

#ifndef WIFI_BEGIN_RECOVERY_INTERVAL_MS
#define WIFI_BEGIN_RECOVERY_INTERVAL_MS 120000
#endif

#ifndef HEARTBEAT_INTERVAL_MS
#define HEARTBEAT_INTERVAL_MS 900000
#endif

#ifdef MBG_GEN2_ENABLED
// Phase 7D validation used a deliberate 15-second override for short prove-out.
// Committed default is 15 minutes; future short validation must opt in.
#ifndef GEN2_MEASUREMENT_POST_INTERVAL_MS
#define GEN2_MEASUREMENT_POST_INTERVAL_MS 900000
#endif
#endif

// Firmware-local Gen2 automatic-control quality gates.
// These are automatic watering guardrails only; Manual Water Now remains local/supervised.
const unsigned long AUTOMATIC_CONTROL_STARTUP_SETTLING_MS = 60000;
const unsigned long AUTOMATIC_CONTROL_LATEST_SAMPLE_FRESHNESS_MS = 5000;
const unsigned long AUTOMATIC_CONTROL_POST_WATERING_EXCLUSION_MS = 300000;
const int AUTOMATIC_CONTROL_STARTUP_QUALIFIED_SAMPLE_COUNT = 3;
const int AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT = 3;
const int AUTOMATIC_CONTROL_REQUIRED_LOW_SAMPLES = 2;

// Initialize hardware
DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

// State management
bool isWatering = false;
unsigned long wateringStartTime = 0;
unsigned long lastWateringEndTime = 0;
unsigned long lastLogTime = 0;
unsigned long lastWateringDuration = 0;
const char* activeWateringTriggerSource = "firmware_safety";
unsigned long lastWiFiReconnectAttemptTime = 0;
unsigned long lastWiFiBeginRecoveryAttemptTime = 0;
unsigned long wifiReconnectAttemptCount = 0;
unsigned long wifiBeginRecoveryAttemptCount = 0;
unsigned long wifiDisconnectEventCount = 0;
unsigned long wifiGotIpEventCount = 0;
unsigned long lastWiFiDisconnectedMillis = 0;
unsigned long lastWiFiReconnectedMillis = 0;
unsigned long lastWiFiDisconnectedUptimeSeconds = 0;
unsigned long lastWiFiReconnectedUptimeSeconds = 0;
int lastWiFiStatusCode = WL_IDLE_STATUS;
int lastWiFiDisconnectReason = -1;
bool hasWiFiDisconnectedSinceBoot = false;
String lastNetworkRecoveryAction = "none";
unsigned long lastHeartbeatPostTime = 0;
bool hasLastSupabaseHttpStatus = false;
int lastSupabaseHttpStatus = 0;
unsigned long consecutiveSupabaseFailures = 0;
String lastSupabaseErrorCategory = "none";
String lastSuccessfulTelemetryPostAt = "";
String lastSuccessfulDiagnosticsPostAt = "";
unsigned long lastSuccessfulTelemetryPostUptimeSeconds = 0;
unsigned long lastSuccessfulDiagnosticsPostUptimeSeconds = 0;
unsigned long automaticControlBootTime = 0;
unsigned long lastAutomaticControlSampleTime = 0;
float automaticControlMoistureSamples[AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT] = {0};
int automaticControlSampleIndex = 0;
int automaticControlSampleCount = 0;
int automaticControlQualifiedSampleCount = 0;
#ifdef MBG_GEN2_ENABLED
unsigned long lastGen2MeasurementPostTime = 0;
#endif
String lastWateredTime = "N/A";
bool hasLastGoodDht = false;
float lastGoodTempF = 0;
float lastGoodHumidity = 0;

#if MBG_PHYSICAL_BUTTON_ENABLED
const int PHYSICAL_BUTTON_EVENT_QUEUE_CAPACITY = 4;
struct QueuedWateringEvent {
  String eventAt;
  const char* eventType;
  const char* triggerSource;
  bool includeDuration;
  int durationSeconds;
  const char* reason;
};
QueuedWateringEvent physicalButtonEventQueue[PHYSICAL_BUTTON_EVENT_QUEUE_CAPACITY];
int physicalButtonEventHead = 0;
int physicalButtonEventTail = 0;
int physicalButtonEventCount = 0;
bool physicalButtonLastRawPressed = false;
bool physicalButtonDebouncedPressed = false;
unsigned long physicalButtonLastRawChangeTime = 0;
bool physicalButtonReleaseRequired = false;
#endif

// Function declarations
void handleWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info);
void recordSupabasePostSuccess(bool diagnosticsPost, int httpCode);
void recordSupabasePostFailure(int httpCode, const String &category);
String jsonStringOrNull(const String &value);
void connectToWiFi();
void maintainWiFiConnection();
void setupTime();
String getFormattedTime();
bool readDhtWithFallback(float &temperatureF, float &humidity);
void readSoilMoisture(float &moisture, int &soilRawAdc);
bool automaticControlQualityGatesPass(float moisture, unsigned long sampledAt, unsigned long decisionAt);
bool maybeStartAutomaticWatering(float moisture);
void sendDataToSupabase(float temperature, float humidity, int moisture, int soilRawAdc, bool watering);
void sendWateringEventToSupabase(
  const char* eventType,
  const char* triggerSource,
  bool includeDuration,
  int durationSeconds,
  const char* reason
);
void sendWateringEventToSupabaseAt(
  const String &eventAt,
  const char* eventType,
  const char* triggerSource,
  bool includeDuration,
  int durationSeconds,
  const char* reason
);
void sendDeviceHeartbeatToSupabase(String heartbeatReason);
#if MBG_PHYSICAL_BUTTON_ENABLED
bool physicalButtonReadPressed();
void queuePhysicalButtonWateringEvent(
  const char* eventType,
  const char* triggerSource,
  bool includeDuration,
  int durationSeconds,
  const char* reason
);
void flushOnePhysicalButtonWateringEvent();
void startPhysicalButtonWatering(unsigned long now);
void stopPhysicalButtonWatering(
  unsigned long now,
  const char* eventType,
  const char* triggerSource,
  const char* reason,
  bool requireRelease
);
void handlePhysicalButton(unsigned long now);
#endif
#ifdef MBG_GEN2_ENABLED
void sendGen2MeasurementsToSupabase();
#endif
void handleRoot();
void handleLogs();
void handleStatus();
#ifdef MBG_GEN2_ENABLED
void handleCapabilities();
void handleMeasurements();
void handleNotFound();
#endif
void handleWaterNow();

// Get formatted local time as a string
String getFormattedTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("⚠️ Failed to obtain time");
    return "TIME_ERROR";
  }
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

// Get formatted UTC time as an ISO-8601 string for Supabase/Postgres
String getUtcIsoTimestamp() {
  time_t now;
  time(&now);

  if (now < 100000) {
    Serial.println("⚠️ Failed to obtain UTC time");
    return "TIME_ERROR";
  }

  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

String jsonStringOrNull(const String &value) {
  if (value.length() == 0 || value == "TIME_ERROR") {
    return "null";
  }

  return "\"" + value + "\"";
}

String supabaseFailureCategoryForHttpCode(int httpCode) {
  if (httpCode == 401 || httpCode == 403) {
    return "auth_or_rls";
  }

  if (httpCode >= 500 && httpCode <= 599) {
    return "server_error";
  }

  if (httpCode > 0) {
    return "http_error";
  }

  if (httpCode == HTTPC_ERROR_READ_TIMEOUT || httpCode == HTTPC_ERROR_CONNECTION_LOST) {
    return "timeout";
  }

  if (httpCode < 0) {
    return "client_error";
  }

  return "unknown";
}

void recordSupabasePostSuccess(bool diagnosticsPost, int httpCode) {
  hasLastSupabaseHttpStatus = true;
  lastSupabaseHttpStatus = httpCode;
  consecutiveSupabaseFailures = 0;
  lastSupabaseErrorCategory = "none";

  String postedAt = getUtcIsoTimestamp();
  unsigned long uptimeSeconds = millis() / 1000;
  if (diagnosticsPost) {
    lastSuccessfulDiagnosticsPostAt = postedAt == "TIME_ERROR" ? "" : postedAt;
    lastSuccessfulDiagnosticsPostUptimeSeconds = uptimeSeconds;
  } else {
    lastSuccessfulTelemetryPostAt = postedAt == "TIME_ERROR" ? "" : postedAt;
    lastSuccessfulTelemetryPostUptimeSeconds = uptimeSeconds;
  }
}

void recordSupabasePostFailure(int httpCode, const String &category) {
  hasLastSupabaseHttpStatus = true;
  lastSupabaseHttpStatus = httpCode;
  consecutiveSupabaseFailures++;
  lastSupabaseErrorCategory = category.length() == 0 ? "unknown" : category;
}

void handleWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  lastWiFiStatusCode = (int)WiFi.status();

  switch (event) {
    case ARDUINO_EVENT_WIFI_STA_CONNECTED:
      lastNetworkRecoveryAction = "wifi_connected_event";
      break;
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      wifiGotIpEventCount++;
      lastWiFiReconnectedMillis = millis();
      lastWiFiReconnectedUptimeSeconds = millis() / 1000;
      lastNetworkRecoveryAction = "wifi_got_ip_event";
      break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      wifiDisconnectEventCount++;
      hasWiFiDisconnectedSinceBoot = true;
      lastWiFiDisconnectedMillis = millis();
      lastWiFiDisconnectedUptimeSeconds = millis() / 1000;
      lastWiFiDisconnectReason = info.wifi_sta_disconnected.reason;
      lastNetworkRecoveryAction = "wifi_disconnected_event";
      break;
    default:
      break;
  }
}

// Only DHT temperature/humidity may fall back to last-known-good values.
// Soil moisture stays fresh-only because it controls watering decisions.
bool readDhtWithFallback(float &temperatureF, float &humidity) {
#if defined(MBG_GEN2_ENABLED) && !MBG_HAS_DHT11
#if MBG_HAS_BME280
  if (gen2Bme280ReadLegacyAir(temperatureF, humidity)) {
    return true;
  }

  Serial.println("Gen2 DHT11 module disabled; BME280 legacy air read unavailable");
  return false;
#else
  Serial.println("Gen2 DHT11 module disabled; legacy DHT read skipped");
  return false;
#endif
#else
  float freshHumidity = dht.readHumidity();
  float tempC = dht.readTemperature();

  if (!isnan(freshHumidity) && !isnan(tempC)) {
    humidity = freshHumidity;
    temperatureF = (tempC * 1.8) + 32;
    lastGoodHumidity = humidity;
    lastGoodTempF = temperatureF;
    hasLastGoodDht = true;
    return true;
  }

  if (hasLastGoodDht) {
    temperatureF = lastGoodTempF;
    humidity = lastGoodHumidity;
    Serial.println("⚠️ DHT read failed; using cached temperature/humidity only");
    return true;
  }

  Serial.println("⚠️ Failed to read DHT sensor and no cached values are available");
  return false;
#endif
}

void readSoilMoisture(float &moisture, int &soilRawAdc) {
  soilRawAdc = analogRead(SOIL_PIN);
  moisture = map(soilRawAdc, 3680, 1230, 0, 100);
  moisture = constrain(moisture, 0, 100);
}

bool isQualifiedAutomaticControlSample(float moisture) {
  // Gate: automatic control samples must be in the mapped moisture-index range.
  // This is a basic structural check, not calibration or trend-believability validation.
  return moisture >= 0.0 && moisture <= 100.0;
}

void recordAutomaticControlSample(float moisture, unsigned long sampledAt) {
  if (!isQualifiedAutomaticControlSample(moisture)) {
    return;
  }

  automaticControlMoistureSamples[automaticControlSampleIndex] = moisture;
  automaticControlSampleIndex = (automaticControlSampleIndex + 1) % AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT;

  if (automaticControlSampleCount < AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT) {
    automaticControlSampleCount++;
  }

  automaticControlQualifiedSampleCount++;
  lastAutomaticControlSampleTime = sampledAt;
}

bool automaticControlStartupSettled(unsigned long now) {
  // Gate: block automatic watering during the initial boot/sensor settling period.
  return now - automaticControlBootTime >= AUTOMATIC_CONTROL_STARTUP_SETTLING_MS;
}

bool automaticControlHasStartupSamples() {
  // Gate: block automatic watering until enough qualified local control samples exist.
  return automaticControlQualifiedSampleCount >= AUTOMATIC_CONTROL_STARTUP_QUALIFIED_SAMPLE_COUNT;
}

bool automaticControlLatestSampleFresh(unsigned long sampledAt, unsigned long decisionAt) {
  // Gate: the latest local control sample must be fresh; older ring samples are history only.
  return decisionAt - sampledAt <= AUTOMATIC_CONTROL_LATEST_SAMPLE_FRESHNESS_MS;
}

bool automaticControlPostWateringExcluded(unsigned long now) {
  // Gate: immediate post-watering readings are not trusted for another automatic start.
  if (lastWateringEndTime == 0) {
    return false;
  }

  return now - lastWateringEndTime < AUTOMATIC_CONTROL_POST_WATERING_EXCLUSION_MS;
}

bool automaticControlRepeatedLowReadingsPass() {
  // Gate: one low mapped moisture reading is not enough; require 2 of the recent 3.
  if (automaticControlSampleCount < AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT) {
    return false;
  }

  int lowSampleCount = 0;
  for (int i = 0; i < AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT; i++) {
    if (automaticControlMoistureSamples[i] < MOISTURE_THRESHOLD) {
      lowSampleCount++;
    }
  }

  return lowSampleCount >= AUTOMATIC_CONTROL_REQUIRED_LOW_SAMPLES;
}

bool automaticControlQualityGatesPass(float moisture, unsigned long sampledAt, unsigned long decisionAt) {
  if (!isQualifiedAutomaticControlSample(moisture)) {
    Serial.println("Auto-watering blocked: moisture sample is not qualified for control");
    return false;
  }

  if (automaticControlPostWateringExcluded(decisionAt)) {
    Serial.println("Auto-watering blocked: post-watering trust window is active");
    return false;
  }

  if (!automaticControlLatestSampleFresh(sampledAt, decisionAt)) {
    Serial.println("Auto-watering blocked: latest local moisture sample is stale");
    return false;
  }

  recordAutomaticControlSample(moisture, sampledAt);

  if (!automaticControlStartupSettled(decisionAt)) {
    Serial.println("Auto-watering blocked: startup settling gate is active");
    return false;
  }

  if (!automaticControlHasStartupSamples()) {
    Serial.println("Auto-watering blocked: waiting for startup control samples");
    return false;
  }

  if (!automaticControlRepeatedLowReadingsPass()) {
    Serial.println("Auto-watering blocked: repeated-reading gate has not passed");
    return false;
  }

  return true;
}

bool maybeStartAutomaticWatering(float moisture) {
  if (!MBG_PUMP_CONTROL_AVAILABLE || !MBG_DEVICE_CAN_WATER) {
    return false;
  }

  unsigned long now = millis();

  // Cooldown prevents repeated automatic cycles before soil/sensor readings stabilize.
  if (!isWatering &&
      moisture < MOISTURE_THRESHOLD &&
      (lastWateringEndTime == 0 || now - lastWateringEndTime >= WATERING_COOLDOWN_MS)) {
    digitalWrite(RELAY_PIN, HIGH);
    isWatering = true;
    wateringStartTime = millis();
    activeWateringTriggerSource = "automatic";
    lastWateredTime = getFormattedTime();
    Serial.println("💧 Auto-watering triggered (low moisture)");
#ifdef MBG_GEN2_ENABLED
    sendWateringEventToSupabase(
      "watering_started",
      activeWateringTriggerSource,
      false,
      0,
      "automatic_watering_started"
    );
#endif
    return true;
  }

  return false;
}

#if MBG_PHYSICAL_BUTTON_ENABLED
bool physicalButtonReadPressed() {
  int level = digitalRead(MBG_PHYSICAL_BUTTON_PIN);
  return MBG_PHYSICAL_BUTTON_ACTIVE_LOW ? level == LOW : level == HIGH;
}

void queuePhysicalButtonWateringEvent(
  const char* eventType,
  const char* triggerSource,
  bool includeDuration,
  int durationSeconds,
  const char* reason
) {
  if (physicalButtonEventCount >= PHYSICAL_BUTTON_EVENT_QUEUE_CAPACITY) {
    Serial.println("Physical button watering event queue full; dropping event evidence");
    return;
  }

  QueuedWateringEvent &event = physicalButtonEventQueue[physicalButtonEventTail];
  event.eventAt = getUtcIsoTimestamp();
  event.eventType = eventType;
  event.triggerSource = triggerSource;
  event.includeDuration = includeDuration;
  event.durationSeconds = durationSeconds;
  event.reason = reason;

  physicalButtonEventTail = (physicalButtonEventTail + 1) % PHYSICAL_BUTTON_EVENT_QUEUE_CAPACITY;
  physicalButtonEventCount++;
}

void flushOnePhysicalButtonWateringEvent() {
  if (isWatering ||
      physicalButtonReleaseRequired ||
      physicalButtonDebouncedPressed ||
      physicalButtonEventCount == 0) {
    return;
  }

  QueuedWateringEvent &event = physicalButtonEventQueue[physicalButtonEventHead];
  sendWateringEventToSupabaseAt(
    event.eventAt,
    event.eventType,
    event.triggerSource,
    event.includeDuration,
    event.durationSeconds,
    event.reason
  );
  event.eventAt = "";

  physicalButtonEventHead = (physicalButtonEventHead + 1) % PHYSICAL_BUTTON_EVENT_QUEUE_CAPACITY;
  physicalButtonEventCount--;
}

void startPhysicalButtonWatering(unsigned long now) {
  digitalWrite(RELAY_PIN, HIGH);
  isWatering = true;
  wateringStartTime = now;
  activeWateringTriggerSource = "physical_button";
  lastWateredTime = getFormattedTime();
  Serial.println("Physical button watering started");

  queuePhysicalButtonWateringEvent(
    "watering_started",
    "physical_button",
    false,
    0,
    "physical_button_pressed"
  );
}

void stopPhysicalButtonWatering(
  unsigned long now,
  const char* eventType,
  const char* triggerSource,
  const char* reason,
  bool requireRelease
) {
  unsigned long wateringDuration = now - wateringStartTime;
  digitalWrite(RELAY_PIN, LOW);
  isWatering = false;
  lastWateringEndTime = now;
  lastWateringDuration = wateringDuration / 1000;

  queuePhysicalButtonWateringEvent(
    eventType,
    triggerSource,
    true,
    (int)lastWateringDuration,
    reason
  );

  activeWateringTriggerSource = "firmware_safety";
  physicalButtonReleaseRequired = requireRelease;
  Serial.printf("Physical button watering stopped. Duration: %lu seconds\n", lastWateringDuration);
}

void handlePhysicalButton(unsigned long now) {
  bool rawPressed = physicalButtonReadPressed();
  if (rawPressed != physicalButtonLastRawPressed) {
    physicalButtonLastRawPressed = rawPressed;
    physicalButtonLastRawChangeTime = now;
  }

  if (now - physicalButtonLastRawChangeTime >= MBG_PHYSICAL_BUTTON_DEBOUNCE_MS &&
      rawPressed != physicalButtonDebouncedPressed) {
    physicalButtonDebouncedPressed = rawPressed;

    if (physicalButtonDebouncedPressed) {
      if (!physicalButtonReleaseRequired &&
          !isWatering &&
          MBG_PUMP_CONTROL_AVAILABLE &&
          MBG_DEVICE_CAN_WATER) {
        startPhysicalButtonWatering(now);
      }
    } else {
      if (isWatering && strcmp(activeWateringTriggerSource, "physical_button") == 0) {
        stopPhysicalButtonWatering(
          now,
          "watering_completed",
          "physical_button",
          "physical_button_released",
          false
        );
      }
      if (physicalButtonReleaseRequired) {
        physicalButtonReleaseRequired = false;
        Serial.println("Physical button release observed; re-armed");
      }
    }
  }

  if (isWatering && strcmp(activeWateringTriggerSource, "physical_button") == 0) {
    unsigned long wateringDuration = now - wateringStartTime;
    if (wateringDuration >= MBG_PHYSICAL_BUTTON_MAX_HOLD_MS) {
      stopPhysicalButtonWatering(
        now,
        "watering_safety_cutoff",
        "firmware_safety",
        "physical_button_hold_timeout",
        true
      );
    }
  }
}
#endif

// Connect to Wi-Fi
void connectToWiFi() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.onEvent(handleWiFiEvent);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("📡 Connecting to Wi-Fi: ");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi connected!");
    Serial.print("🔗 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    lastWiFiReconnectAttemptTime = millis();
    Serial.println("\nWi-Fi unavailable; continuing in local-control/offline mode.");
  }
}

// Wi-Fi is best-effort and must not prevent local sensor reads or watering control.
void maintainWiFiConnection() {
  wl_status_t wifiStatus = WiFi.status();
  lastWiFiStatusCode = (int)wifiStatus;
  if (wifiStatus == WL_CONNECTED) {
    return;
  }

  unsigned long now = millis();
  if (!hasWiFiDisconnectedSinceBoot) {
    hasWiFiDisconnectedSinceBoot = true;
    lastWiFiDisconnectedMillis = now;
    lastWiFiDisconnectedUptimeSeconds = now / 1000;
    lastNetworkRecoveryAction = "wifi_not_connected_detected";
  }

  bool sustainedDisconnect =
    hasWiFiDisconnectedSinceBoot &&
    lastWiFiDisconnectedMillis > 0 &&
    now - lastWiFiDisconnectedMillis >= WIFI_BEGIN_RECOVERY_INTERVAL_MS;

  bool beginRecoveryDue =
    sustainedDisconnect &&
    now - lastWiFiBeginRecoveryAttemptTime >= WIFI_BEGIN_RECOVERY_INTERVAL_MS;

  if (beginRecoveryDue) {
    lastWiFiBeginRecoveryAttemptTime = now;
    wifiBeginRecoveryAttemptCount++;
    lastNetworkRecoveryAction = "wifi_disconnect_begin";
    Serial.println("Wi-Fi sustained disconnect; restarting station association without blocking local control.");
    WiFi.disconnect(false);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    return;
  }

  if (now - lastWiFiReconnectAttemptTime >= WIFI_RECONNECT_INTERVAL_MS) {
    lastWiFiReconnectAttemptTime = now;
    wifiReconnectAttemptCount++;
    lastNetworkRecoveryAction = "wifi_reconnect";
    Serial.println("Wi-Fi disconnected; requesting reconnect without blocking local control.");
    WiFi.reconnect();
  }
}

// Setup NTP time
void setupTime() {
  configTime(0, 0, NTP_SERVER1, NTP_SERVER2);
  setenv("TZ", TIMEZONE, 1);
  tzset();
}

// Send sensor data to Supabase
void sendDataToSupabase(float temperature, float humidity, int moisture, int soilRawAdc, bool watering) {
  if (WiFi.status() != WL_CONNECTED) {
    recordSupabasePostFailure(0, "wifi_unavailable");
    Serial.println("❌ WiFi not connected");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // TODO: Use setCACert() for production
  HTTPClient https;

  // Make sure the URL ends with /rest/v1/table_name
  String url = String(SUPABASE_URL);
  if (!url.endsWith("sensor_logs")) {
    if (url.endsWith("/")) {
      url += "rest/v1/sensor_logs";
    } else {
      url += "/rest/v1/sensor_logs";
    }
  }

  Serial.print("📤 Sending to Supabase URL: ");
  Serial.println(url);

  https.begin(client, url);
  // Protect local control responsiveness during telemetry posts.
  https.setTimeout(3000);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  // Build JSON payload - FIXED to nest values inside "data" object
  String postData = "{";
  postData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  postData += "\"timestamp\":\"" + getUtcIsoTimestamp() + "\",";
  postData += "\"data\":{"; // Nest all sensor data inside "data" object
  postData += "\"temperature\":" + String(temperature, 2) + ",";
  postData += "\"humidity\":" + String(humidity, 2) + ",";
  postData += "\"moisture\":" + String(moisture) + ",";
  postData += "\"soilRawAdc\":" + String(soilRawAdc) + ",";
  postData += "\"watering\":" + String(watering ? "true" : "false") + ",";
  postData += "\"lastWateredTime\":\"" + lastWateredTime + "\",";
  postData += "\"lastWateringDuration\":" + String(lastWateringDuration);
  postData += "}"; // Close data object
  postData += "}";

  Serial.println("📦 Payload: " + postData);

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      recordSupabasePostSuccess(false, httpCode);
      Serial.println("✅ Data sent to Supabase");
    } else {
      Serial.print("⚠️ Supabase response code: ");
      Serial.println(httpCode);
      recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
      String response = https.getString();
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.println("❌ POST failed");
    Serial.print("Error: ");
    recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
    Serial.println(https.errorToString(httpCode).c_str());
  }

  https.end();
}

// Send device-originated watering event evidence to Supabase.
void sendWateringEventToSupabase(
  const char* eventType,
  const char* triggerSource,
  bool includeDuration,
  int durationSeconds,
  const char* reason
) {
  String eventAt = getUtcIsoTimestamp();
  sendWateringEventToSupabaseAt(
    eventAt,
    eventType,
    triggerSource,
    includeDuration,
    durationSeconds,
    reason
  );
}

void sendWateringEventToSupabaseAt(
  const String &eventAt,
  const char* eventType,
  const char* triggerSource,
  bool includeDuration,
  int durationSeconds,
  const char* reason
) {
  if (WiFi.status() != WL_CONNECTED) {
    recordSupabasePostFailure(0, "wifi_unavailable");
    Serial.println("Watering event post skipped: WiFi not connected");
    return;
  }

  if (eventAt == "TIME_ERROR") {
    recordSupabasePostFailure(0, "time_unavailable");
    Serial.println("Watering event post skipped: UTC time unavailable");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // TODO: Use setCACert() for production
  HTTPClient https;

  String url = String(SUPABASE_URL);
  if (url.endsWith("watering_events")) {
    // Use configured watering event endpoint as-is.
  } else if (url.endsWith("sensor_logs")) {
    url = url.substring(0, url.length() - String("sensor_logs").length()) + "watering_events";
  } else if (url.endsWith("device_heartbeats")) {
    url = url.substring(0, url.length() - String("device_heartbeats").length()) + "watering_events";
  } else if (url.endsWith("sensor_measurement_batches")) {
    url = url.substring(0, url.length() - String("sensor_measurement_batches").length()) + "watering_events";
  } else if (url.endsWith("sensor_measurements")) {
    url = url.substring(0, url.length() - String("sensor_measurements").length()) + "watering_events";
  } else if (url.endsWith("/")) {
    url += "rest/v1/watering_events";
  } else {
    url += "/rest/v1/watering_events";
  }

  https.begin(client, url);
  // Keep watering evidence best-effort so local control remains responsive.
  https.setTimeout(3000);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  String postData = "{";
  postData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  postData += "\"event_at\":\"" + eventAt + "\",";
  postData += "\"event_type\":\"" + String(eventType) + "\",";
  postData += "\"trigger_source\":\"" + String(triggerSource) + "\",";
  postData += "\"duration_seconds\":";
  postData += includeDuration ? String(durationSeconds) : "null";
  postData += ",";
  postData += "\"reason\":\"" + String(reason) + "\",";
  postData += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  postData += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  postData += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  postData += "\"details\":{";
  postData += "\"phase\":\"7O.1\",";
  postData += "\"source\":\"firmware\",";
  postData += "\"uptime_seconds\":" + String(millis() / 1000);
  postData += "}";
  postData += "}";

  Serial.println("Posting watering event: " + String(eventType) + " / " + String(triggerSource));

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      recordSupabasePostSuccess(false, httpCode);
      Serial.println("Watering event sent to Supabase");
    } else {
      Serial.print("Watering event Supabase response code: ");
      Serial.println(httpCode);
      recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
      String response = https.getString();
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.println("Watering event POST failed");
    Serial.print("Error: ");
    recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
    Serial.println(https.errorToString(httpCode).c_str());
  }

  https.end();
}

// Send read-only device diagnostics heartbeat to Supabase
void sendDeviceHeartbeatToSupabase(String heartbeatReason) {
  bool wifiConnected = WiFi.status() == WL_CONNECTED;
  if (!wifiConnected) {
    recordSupabasePostFailure(0, "wifi_unavailable");
    Serial.println("Device heartbeat skipped: WiFi not connected");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // TODO: Use setCACert() for production
  HTTPClient https;

  String url = String(SUPABASE_URL);
  if (url.endsWith("device_heartbeats")) {
    // Use configured diagnostics endpoint as-is.
  } else if (url.endsWith("sensor_logs")) {
    url = url.substring(0, url.length() - String("sensor_logs").length()) + "device_heartbeats";
  } else if (url.endsWith("/")) {
    url += "rest/v1/device_heartbeats";
  } else {
    url += "/rest/v1/device_heartbeats";
  }

  Serial.print("Sending device heartbeat to Supabase URL: ");
  Serial.println(url);

  https.begin(client, url);
  // Protect local control responsiveness during diagnostics posts.
  https.setTimeout(3000);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  String postData = "{";
  postData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  postData += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  postData += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  postData += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  postData += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  postData += "\"heartbeat_reason\":\"" + heartbeatReason + "\",";
  postData += "\"uptime_seconds\":" + String(millis() / 1000) + ",";
  postData += "\"wifi_connected\":" + String(wifiConnected ? "true" : "false") + ",";
  postData += "\"wifi_rssi\":";
  postData += wifiConnected ? String(WiFi.RSSI()) : "null";
  postData += ",";
  postData += "\"wifi_reconnect_attempt_count\":" + String(wifiReconnectAttemptCount) + ",";
  postData += "\"last_supabase_http_status\":";
  postData += hasLastSupabaseHttpStatus ? String(lastSupabaseHttpStatus) : "null";
  postData += ",";
  postData += "\"consecutive_supabase_failures\":" + String(consecutiveSupabaseFailures) + ",";
  postData += "\"last_supabase_error_category\":\"" + lastSupabaseErrorCategory + "\",";
  postData += "\"last_successful_telemetry_post_at\":" + jsonStringOrNull(lastSuccessfulTelemetryPostAt) + ",";
  postData += "\"last_successful_diagnostics_post_at\":" + jsonStringOrNull(lastSuccessfulDiagnosticsPostAt) + ",";
  postData += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
  postData += "\"min_free_heap\":" + String(ESP.getMinFreeHeap()) + ",";
  postData += "\"currently_watering\":" + String(isWatering ? "true" : "false") + ",";
  postData += "\"last_watering_duration\":" + String(lastWateringDuration) + ",";
  postData += "\"pump_control_available\":" + String(MBG_PUMP_CONTROL_AVAILABLE ? "true" : "false") + ",";
  postData += "\"device_can_water\":" + String(MBG_DEVICE_CAN_WATER ? "true" : "false") + ",";
  postData += "\"details\":{";
  postData += "\"phase\":\"7K.5\",";
  postData += "\"source\":\"firmware\",";
  postData += "\"last_wifi_status_code\":" + String(lastWiFiStatusCode) + ",";
  postData += "\"last_wifi_disconnect_reason\":" + String(lastWiFiDisconnectReason) + ",";
  postData += "\"wifi_disconnect_event_count\":" + String(wifiDisconnectEventCount) + ",";
  postData += "\"wifi_got_ip_event_count\":" + String(wifiGotIpEventCount) + ",";
  postData += "\"wifi_begin_recovery_attempt_count\":" + String(wifiBeginRecoveryAttemptCount) + ",";
  postData += "\"last_wifi_disconnected_uptime_seconds\":" + String(lastWiFiDisconnectedUptimeSeconds) + ",";
  postData += "\"last_wifi_reconnected_uptime_seconds\":" + String(lastWiFiReconnectedUptimeSeconds) + ",";
  postData += "\"last_network_recovery_action\":\"" + lastNetworkRecoveryAction + "\"";
  postData += "}";
  postData += "}";

  Serial.println("Device heartbeat payload: " + postData);

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      recordSupabasePostSuccess(true, httpCode);
      Serial.println("Device heartbeat sent to Supabase");
    } else {
      Serial.print("Device heartbeat Supabase response code: ");
      Serial.println(httpCode);
      recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
      String response = https.getString();
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.println("Device heartbeat POST failed");
    Serial.print("Error: ");
    recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
    Serial.println(https.errorToString(httpCode).c_str());
  }

  https.end();
}

#ifdef MBG_GEN2_ENABLED
int countJsonArrayRecords(const String &jsonArray) {
  if (jsonArray == "[]") {
    return 0;
  }

  int count = 0;
  int depth = 0;
  bool inString = false;
  bool escaped = false;

  for (unsigned int i = 0; i < jsonArray.length(); i++) {
    char current = jsonArray.charAt(i);

    if (escaped) {
      escaped = false;
      continue;
    }

    if (current == '\\' && inString) {
      escaped = true;
      continue;
    }

    if (current == '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (current == '{') {
      if (depth == 0) {
        count++;
      }
      depth++;
    } else if (current == '}' && depth > 0) {
      depth--;
    }
  }

  return count;
}

// Send Gen2 modular measurement package to Supabase
void sendGen2MeasurementsToSupabase() {
  if (WiFi.status() != WL_CONNECTED) {
    recordSupabasePostFailure(0, "wifi_unavailable");
    Serial.println("Gen2 measurement batch post skipped: WiFi not connected");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // TODO: Use setCACert() for production
  HTTPClient https;

  String url = String(SUPABASE_URL);
  if (url.endsWith("sensor_measurement_batches")) {
    // Use configured measurement batch endpoint as-is.
  } else if (url.endsWith("sensor_logs")) {
    url = url.substring(0, url.length() - String("sensor_logs").length()) + "sensor_measurement_batches";
  } else if (url.endsWith("device_heartbeats")) {
    url = url.substring(0, url.length() - String("device_heartbeats").length()) + "sensor_measurement_batches";
  } else if (url.endsWith("sensor_measurements")) {
    url = url.substring(0, url.length() - String("sensor_measurements").length()) + "sensor_measurement_batches";
  } else if (url.endsWith("/")) {
    url += "rest/v1/sensor_measurement_batches";
  } else {
    url += "/rest/v1/sensor_measurement_batches";
  }

  Serial.print("Sending Gen2 measurement batch to Supabase URL: ");
  Serial.println(url);

  https.begin(client, url);
  // Protect local control responsiveness during measurement posts.
  https.setTimeout(3000);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  String measuredAt = getUtcIsoTimestamp();
  String records = gen2MeasurementRecordsJson(String(DEVICE_ID), measuredAt);
  int recordCount = countJsonArrayRecords(records);

  String postData = "{";
  postData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  postData += "\"measured_at\":\"" + measuredAt + "\",";
  postData += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  postData += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  postData += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  postData += "\"schema_version\":1,";
  postData += "\"record_count\":" + String(recordCount) + ",";
  postData += "\"records\":" + records + ",";
  postData += "\"source_endpoint\":\"/measurements\",";
  postData += "\"batch_details\":{";
  postData += "\"phase\":\"7E\",";
  postData += "\"source\":\"firmware\",";
  postData += "\"post_cadence_ms\":" + String(GEN2_MEASUREMENT_POST_INTERVAL_MS) + ",";
  postData += "\"device_label\":\"" + String(DEVICE_LABEL) + "\"";
  postData += "}";
  postData += "}";

  Serial.println("Gen2 measurement batch payload: " + postData);

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      recordSupabasePostSuccess(false, httpCode);
      Serial.println("Gen2 measurement batch sent to Supabase");
    } else {
      Serial.print("Gen2 measurement batch Supabase response code: ");
      Serial.println(httpCode);
      recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
      String response = https.getString();
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.println("Gen2 measurement batch POST failed");
    Serial.print("Error: ");
    recordSupabasePostFailure(httpCode, supabaseFailureCategoryForHttpCode(httpCode));
    Serial.println(https.errorToString(httpCode).c_str());
  }

  https.end();
}
#endif

// Root endpoint handler
void handleRoot() {
  server.send(200, "text/plain", String(DEVICE_LABEL) + " - My Balcony Gardener ESP32 - Alive!");
}

// Status endpoint handler - returns read-only device diagnostics without sensor reads
void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  wl_status_t wifiStatus = WiFi.status();
  bool wifiConnected = wifiStatus == WL_CONNECTED;
  lastWiFiStatusCode = (int)wifiStatus;

  String response = "{";
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  response += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  response += "\"reported_at\":\"" + getUtcIsoTimestamp() + "\",";
  response += "\"uptime_seconds\":" + String(millis() / 1000) + ",";
  response += "\"wifi_connected\":" + String(wifiConnected ? "true" : "false") + ",";
  response += "\"wifi_rssi\":";
  response += wifiConnected ? String(WiFi.RSSI()) : "null";
  response += ",";
  response += "\"wifi_status_code\":" + String((int)wifiStatus) + ",";
  response += "\"last_wifi_status_code\":" + String(lastWiFiStatusCode) + ",";
  response += "\"last_wifi_disconnect_reason\":" + String(lastWiFiDisconnectReason) + ",";
  response += "\"wifi_reconnect_attempt_count\":" + String(wifiReconnectAttemptCount) + ",";
  response += "\"wifi_begin_recovery_attempt_count\":" + String(wifiBeginRecoveryAttemptCount) + ",";
  response += "\"wifi_disconnect_event_count\":" + String(wifiDisconnectEventCount) + ",";
  response += "\"wifi_got_ip_event_count\":" + String(wifiGotIpEventCount) + ",";
  response += "\"last_wifi_disconnected_uptime_seconds\":" + String(lastWiFiDisconnectedUptimeSeconds) + ",";
  response += "\"last_wifi_reconnected_uptime_seconds\":" + String(lastWiFiReconnectedUptimeSeconds) + ",";
  response += "\"last_network_recovery_action\":\"" + lastNetworkRecoveryAction + "\",";
  response += "\"last_supabase_http_status\":";
  response += hasLastSupabaseHttpStatus ? String(lastSupabaseHttpStatus) : "null";
  response += ",";
  response += "\"consecutive_supabase_failures\":" + String(consecutiveSupabaseFailures) + ",";
  response += "\"last_supabase_error_category\":\"" + lastSupabaseErrorCategory + "\",";
  response += "\"last_successful_telemetry_post_uptime_seconds\":" + String(lastSuccessfulTelemetryPostUptimeSeconds) + ",";
  response += "\"last_successful_diagnostics_post_uptime_seconds\":" + String(lastSuccessfulDiagnosticsPostUptimeSeconds) + ",";
  response += "\"currently_watering\":" + String(isWatering ? "true" : "false") + ",";
  response += "\"pump_control_available\":" + String(MBG_PUMP_CONTROL_AVAILABLE ? "true" : "false") + ",";
  response += "\"device_can_water\":" + String(MBG_DEVICE_CAN_WATER ? "true" : "false") + ",";
  response += "\"lastWateredTime\":\"" + lastWateredTime + "\",";
  response += "\"lastWateringDuration\":" + String(lastWateringDuration) + ",";
  response += "\"hasLastGoodDht\":" + String(hasLastGoodDht ? "true" : "false") + ",";
  response += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
  response += "\"min_free_heap\":" + String(ESP.getMinFreeHeap()) + ",";
  response += "\"ip_address\":\"" + String(wifiConnected ? WiFi.localIP().toString() : "0.0.0.0") + "\",";
  response += "\"mac_address\":\"" + WiFi.macAddress() + "\"";
  response += "}";

  server.send(200, "application/json", response);
}

#ifdef MBG_GEN2_ENABLED
// Capabilities endpoint handler - returns local Gen2 module configuration and detection state
void handleCapabilities() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", gen2CapabilitiesJson(String(DEVICE_ID), getUtcIsoTimestamp()));
}

// Measurements endpoint handler - returns local Gen2 measurement-list records
void handleMeasurements() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", gen2MeasurementsJson(String(DEVICE_ID), getUtcIsoTimestamp()));
}

void handleNotFound() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  String method = "UNKNOWN";
  switch (server.method()) {
    case HTTP_GET:
      method = "GET";
      break;
    case HTTP_POST:
      method = "POST";
      break;
    case HTTP_PUT:
      method = "PUT";
      break;
    case HTTP_DELETE:
      method = "DELETE";
      break;
    default:
      break;
  }

  String uri = server.uri();
  Serial.println("Not found: " + method + " " + uri);
  server.send(404, "text/plain", "Not found: " + uri);
}
#endif

// Logs endpoint handler - returns latest sensor data
void handleLogs() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  float humidity = 0;
  float tempF = 0;
  if (!readDhtWithFallback(tempF, humidity)) {
    server.send(500, "application/json", "{\"error\":\"Sensor read error\"}");
    return;
  }

  int soilValue = 0;
  float moisture = 0;
  readSoilMoisture(moisture, soilValue);

  // Use the same format as we send to Supabase for consistency
  String response = "{";
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"timestamp\":\"" + getFormattedTime() + "\",";
  response += "\"data\":{";
  response += "\"temperature\":" + String(tempF, 1) + ",";
  response += "\"humidity\":" + String(humidity, 1) + ",";
  response += "\"moisture\":" + String(moisture, 1) + ",";
  response += "\"soilRawAdc\":" + String(soilValue) + ",";
  response += "\"watering\":" + String(isWatering ? "true" : "false") + ",";
  response += "\"lastWateredTime\":\"" + lastWateredTime + "\",";
  response += "\"lastWateringDuration\":" + String(lastWateringDuration);
  response += "}";
  response += "}";

  server.send(200, "application/json", response);
}

// Water-now endpoint handler
void handleWaterNow() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!MBG_PUMP_CONTROL_AVAILABLE || !MBG_DEVICE_CAN_WATER) {
    server.send(403, "text/plain", "Watering unavailable");
    return;
  }

  // Manual Water Now is intentionally not blocked by the automatic cooldown.
  if (!isWatering) {
    digitalWrite(RELAY_PIN, HIGH);
    isWatering = true;
    wateringStartTime = millis();
    activeWateringTriggerSource = "manual_local";
    lastWateredTime = getFormattedTime();
    Serial.println("💧 Manual watering triggered");
#ifdef MBG_GEN2_ENABLED
    sendWateringEventToSupabase(
      "watering_started",
      activeWateringTriggerSource,
      false,
      0,
      "manual_water_now_started"
    );
#endif
#ifndef MBG_GEN2_ENABLED
    // Phase 5D: log watering start immediately so short pump cycles are visible.
    float humidity = 0;
    float tempF = 0;
    if (readDhtWithFallback(tempF, humidity)) {
      int soilValue = 0;
      float moisture = 0;
      readSoilMoisture(moisture, soilValue);
      sendDataToSupabase(tempF, humidity, moisture, soilValue, true);
    }
#endif
    server.send(200, "text/plain", "Watering started");
  } else {
    server.send(409, "text/plain", "Already watering");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n🌱 My Balcony Gardener Starting...");
  automaticControlBootTime = millis();

  // Initialize hardware
#if !defined(MBG_GEN2_ENABLED) || MBG_HAS_DHT11
  dht.begin();
#endif
#ifdef MBG_GEN2_ENABLED
  gen2Begin();
#endif
  if (MBG_PUMP_CONTROL_AVAILABLE) {
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, LOW);
  }
#if MBG_PHYSICAL_BUTTON_ENABLED
  pinMode(MBG_PHYSICAL_BUTTON_PIN, INPUT_PULLUP);
  physicalButtonLastRawPressed = physicalButtonReadPressed();
  physicalButtonDebouncedPressed = physicalButtonLastRawPressed;
  physicalButtonLastRawChangeTime = millis();
  physicalButtonReleaseRequired = physicalButtonDebouncedPressed;
  Serial.printf(
    "Physical button enabled on GPIO%d, active-%s, debounce=%dms, max-hold=%dms\n",
    MBG_PHYSICAL_BUTTON_PIN,
    MBG_PHYSICAL_BUTTON_ACTIVE_LOW ? "low" : "high",
    MBG_PHYSICAL_BUTTON_DEBOUNCE_MS,
    MBG_PHYSICAL_BUTTON_MAX_HOLD_MS
  );
#endif

  // Connect to network and setup time
  connectToWiFi();
  setupTime();

  // Setup web server endpoints
  server.on("/", HTTP_GET, handleRoot);
#if !defined(MBG_GEN2_ENABLED) || MBG_GEN2_ENABLE_LEGACY_LOGS
  server.on("/logs", HTTP_GET, handleLogs);
#endif
  server.on("/status", HTTP_GET, handleStatus);
#ifdef MBG_GEN2_ENABLED
  server.on("/capabilities", HTTP_GET, handleCapabilities);
  server.on("/measurements", HTTP_GET, handleMeasurements);
  server.onNotFound(handleNotFound);
#endif
#if MBG_HTTP_WATERING_ENDPOINT_ENABLED
  server.on("/water-now", HTTP_POST, handleWaterNow);
#endif

  server.begin();
  Serial.println("🌐 Web server started");
}

void loop() {
  unsigned long now = millis();

#if MBG_PHYSICAL_BUTTON_ENABLED
  handlePhysicalButton(now);
#endif

  // Pump shutoff has priority over client/server, network, and telemetry work.
  if (isWatering) {
    unsigned long wateringDuration = now - wateringStartTime;

    if (strcmp(activeWateringTriggerSource, "physical_button") != 0 &&
        wateringDuration >= WATERING_DURATION_MS) {
      digitalWrite(RELAY_PIN, LOW);
      isWatering = false;
      lastWateringEndTime = millis();
      lastWateringDuration = wateringDuration / 1000; // Convert to seconds

#ifdef MBG_GEN2_ENABLED
      const char* completionTriggerSource = "firmware_safety";
      const char* completionReason = "watering_completed_trigger_source_fallback";
      if (strcmp(activeWateringTriggerSource, "manual_local") == 0) {
        completionTriggerSource = "manual_local";
        completionReason = "manual_water_now_completed";
      } else if (strcmp(activeWateringTriggerSource, "automatic") == 0) {
        completionTriggerSource = "automatic";
        completionReason = "automatic_watering_completed";
      }

      sendWateringEventToSupabase(
        "watering_completed",
        completionTriggerSource,
        true,
        (int)lastWateringDuration,
        completionReason
      );
      activeWateringTriggerSource = "firmware_safety";
#endif

      // Send final update with watering completed
#ifndef MBG_GEN2_ENABLED
      float humidity = 0;
      float tempF = 0;
      if (readDhtWithFallback(tempF, humidity)) {
        int soilValue = 0;
        float moisture = 0;
        readSoilMoisture(moisture, soilValue);
        sendDataToSupabase(tempF, humidity, moisture, soilValue, false);
      }
#endif

      Serial.printf("✅ Watering complete. Duration: %lu seconds\n", lastWateringDuration);
    }
  }

#if MBG_PHYSICAL_BUTTON_ENABLED
  flushOnePhysicalButtonWateringEvent();
#endif

  maintainWiFiConnection();
  server.handleClient();

#ifndef MBG_GEN2_ENABLED
  // Regular sensor logging
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    float humidity = 0;
    float tempF = 0;

    if (readDhtWithFallback(tempF, humidity)) {
      int soilValue = 0;
      float moisture = 0;
      readSoilMoisture(moisture, soilValue);

      // Send data to Supabase
      sendDataToSupabase(tempF, humidity, moisture, soilValue, isWatering);

      Serial.printf("📊 T: %.1f°F, H: %.1f%%, M: %.1f%%, Watering: %s\n",
                    tempF, humidity, moisture, isWatering ? "Yes" : "No");

      if (MBG_PUMP_CONTROL_AVAILABLE && MBG_DEVICE_CAN_WATER) {
        bool autoWateringStarted = maybeStartAutomaticWatering(moisture);
        // Phase 5D: log watering start immediately using this interval's readings.
        if (autoWateringStarted) {
          sendDataToSupabase(tempF, humidity, moisture, soilValue, true);
        }
      }
    } else {
      Serial.println("⚠️ Skipping telemetry because DHT values are unavailable");
    }

    lastLogTime = now;
  }
#endif

#if defined(MBG_GEN2_ENABLED) && MBG_DEVICE_CAN_WATER && MBG_PUMP_CONTROL_AVAILABLE && MBG_HAS_SOIL_MOISTURE
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    int soilValue = 0;
    float moisture = 0;
    unsigned long sampledAt = millis();
    readSoilMoisture(moisture, soilValue);
    unsigned long decisionAt = millis();
    if (automaticControlQualityGatesPass(moisture, sampledAt, decisionAt)) {
      maybeStartAutomaticWatering(moisture);
    }
    lastLogTime = now;
  }
#endif

#ifdef MBG_GEN2_ENABLED
  if (now - lastGen2MeasurementPostTime >= GEN2_MEASUREMENT_POST_INTERVAL_MS) {
    sendGen2MeasurementsToSupabase();
    lastGen2MeasurementPostTime = now;
  }
#endif

  if (now - lastHeartbeatPostTime >= HEARTBEAT_INTERVAL_MS) {
    sendDeviceHeartbeatToSupabase("periodic");
    lastHeartbeatPostTime = now;
  }

}
