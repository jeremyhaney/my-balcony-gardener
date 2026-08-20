// My Balcony Gardener - ESP32 Firmware
// Version: v1.0.0_refactored
// Follows PRD architecture requirements

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <cstring>
#include "time.h"
#include "config.h"
#include "profile_overrides.h"
#include "device_identity.h"
#include "firmware_identity.h"

#include "gen2_measurements.h"
#include "gen2_sen0204.h"

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

// Phase 7D validation used a deliberate 15-second override for short prove-out.
// Committed default is 15 minutes; future short validation must opt in.
#ifndef GEN2_MEASUREMENT_POST_INTERVAL_MS
#define GEN2_MEASUREMENT_POST_INTERVAL_MS 900000
#endif

// Firmware-local Gen2 automatic-control quality gates. Balcony02 has no direct
// analog control feed; this is the explicit boundary for a future Gen2 source.
const unsigned long AUTOMATIC_CONTROL_STARTUP_SETTLING_MS = 60000;
const unsigned long AUTOMATIC_CONTROL_LATEST_SAMPLE_FRESHNESS_MS = 5000;
const unsigned long AUTOMATIC_CONTROL_POST_WATERING_EXCLUSION_MS = 300000;
const int AUTOMATIC_CONTROL_STARTUP_QUALIFIED_SAMPLE_COUNT = 3;
const int AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT = 3;
const int AUTOMATIC_CONTROL_REQUIRED_LOW_SAMPLES = 2;

// Initialize hardware
WebServer server(80);

// State management
bool isWatering = false;
unsigned long wateringStartTime = 0;
unsigned long lastWateringEndTime = 0;
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
unsigned long automaticControlBootTime = 0;
unsigned long lastAutomaticControlSampleTime = 0;
float automaticControlMoistureSamples[AUTOMATIC_CONTROL_RECENT_SAMPLE_COUNT] = {0};
int automaticControlSampleIndex = 0;
int automaticControlSampleCount = 0;
int automaticControlQualifiedSampleCount = 0;
unsigned long lastGen2MeasurementPostTime = 0;
String lastSuccessfulMeasurementPostAt = "";
unsigned long lastSuccessfulMeasurementPostUptimeSeconds = 0;
bool hasLastSuccessfulMeasurementPost = false;
String lastSuccessfulStatusPostAt = "";
unsigned long lastSuccessfulStatusPostUptimeSeconds = 0;
bool hasLastSuccessfulStatusPost = false;
String lastWateringAt = "";
bool hasLastWateringStarted = false;
bool hasCompletedWateringSinceBoot = false;
bool hasWiFiDisconnectReasonSinceBoot = false;

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
void recordSupabasePostSuccess(int httpCode);
void recordSupabasePostFailure(int httpCode, const String &category);
String jsonStringOrNull(const String &value);
String supabaseTableUrl(const char* tableName);
void connectToWiFi();
void maintainWiFiConnection();
void setupTime();
bool automaticControlQualityGatesPass(float moisture, unsigned long sampledAt, unsigned long decisionAt);
bool maybeStartAutomaticWatering(float moisture);
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
void recordGen2MeasurementPostSuccess(int httpCode);
void recordGen2StatusPostSuccess(int httpCode);
void recordGen2WateringStart();
const char* gen2WiFiStatusLabel(int statusCode);
const char* gen2HttpStatusLabel(bool hasStatus, int statusCode);
const char* gen2NetworkActivityLabel(const String &internalActivity);
const char* gen2WiFiDisconnectReasonLabel(bool hasReason, int reasonCode);
void sendGen2MeasurementsToSupabase();
void handleRoot();
void handleStatus();
void handleCapabilities();
void handleMeasurements();
void handleNotFound();

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

// Build-time validation accepts only the Supabase project root. Add the Data API
// table route deterministically while accepting an optional trailing root slash.
String supabaseTableUrl(const char* tableName) {
  String url = String(SUPABASE_URL);
  if (url.endsWith("/")) {
    url.remove(url.length() - 1);
  }
  return url + "/rest/v1/" + tableName;
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

void recordSupabasePostSuccess(int httpCode) {
  hasLastSupabaseHttpStatus = true;
  lastSupabaseHttpStatus = httpCode;
  consecutiveSupabaseFailures = 0;
  lastSupabaseErrorCategory = "none";
}

void recordSupabasePostFailure(int httpCode, const String &category) {
  hasLastSupabaseHttpStatus = true;
  lastSupabaseHttpStatus = httpCode;
  consecutiveSupabaseFailures++;
  lastSupabaseErrorCategory = category.length() == 0 ? "unknown" : category;
}

// Record measurement-specific success separately from other cloud posts;
// watering-event posts intentionally never call this helper.
void recordGen2MeasurementPostSuccess(int httpCode) {
  recordSupabasePostSuccess(httpCode);
  String postedAt = getUtcIsoTimestamp();
  lastSuccessfulMeasurementPostAt = postedAt == "TIME_ERROR" ? "" : postedAt;
  lastSuccessfulMeasurementPostUptimeSeconds = millis() / 1000;
  hasLastSuccessfulMeasurementPost = true;
}

// Record status success only after the heartbeat POST has returned HTTP 201.
// The heartbeat already sent therefore truthfully describes the prior success.
void recordGen2StatusPostSuccess(int httpCode) {
  recordSupabasePostSuccess(httpCode);
  String postedAt = getUtcIsoTimestamp();
  lastSuccessfulStatusPostAt = postedAt == "TIME_ERROR" ? "" : postedAt;
  lastSuccessfulStatusPostUptimeSeconds = millis() / 1000;
  hasLastSuccessfulStatusPost = true;
}

// Capture UTC evidence for a real local-firmware watering start.
void recordGen2WateringStart() {
  String startedAt = getUtcIsoTimestamp();
  lastWateringAt = startedAt == "TIME_ERROR" ? "" : startedAt;
  hasLastWateringStarted = true;
}

// Public labels intentionally use stable contract text rather than framework names.
const char* gen2WiFiStatusLabel(int statusCode) {
  switch (statusCode) {
    case 255: return "no_shield";
    case 0: return "idle";
    case 1: return "no_ssid_available";
    case 2: return "scan_completed";
    case 3: return "connected";
    case 4: return "connection_failed";
    case 5: return "connection_lost";
    case 6: return "disconnected";
    default: return "unknown";
  }
}

const char* gen2HttpStatusLabel(bool hasStatus, int statusCode) {
  if (!hasStatus) return "not_recorded";
  if (statusCode == 0) return "no_http_response";
  if (statusCode < 0) return "client_error";
  switch (statusCode) {
    case 200: return "ok";
    case 201: return "created";
    case 204: return "no_content";
    case 400: return "bad_request";
    case 401: return "unauthorized";
    case 403: return "forbidden";
    case 404: return "not_found";
    case 409: return "conflict";
    case 429: return "too_many_requests";
    case 500: return "internal_server_error";
    case 502: return "bad_gateway";
    case 503: return "service_unavailable";
    default: return "unknown";
  }
}

const char* gen2NetworkActivityLabel(const String &internalActivity) {
  if (internalActivity == "wifi_connected_event") return "connected";
  if (internalActivity == "wifi_got_ip_event") return "ip_acquired";
  if (internalActivity == "wifi_disconnected_event") return "disconnected";
  if (internalActivity == "wifi_not_connected_detected") return "disconnect_detected";
  if (internalActivity == "wifi_reconnect") return "reconnect_requested";
  if (internalActivity == "wifi_disconnect_begin") return "full_recovery_started";
  return "none";
}

// Numeric cases mirror the installed ESP-IDF header and the Phase 8B.4 SQL view.
// Numeric literals keep builds compatible when a framework omits newer symbols.
const char* gen2WiFiDisconnectReasonLabel(bool hasReason, int reasonCode) {
  if (!hasReason) return "not_recorded";
  switch (reasonCode) {
    case 1: return "unspecified"; case 2: return "auth_expire";
    case 3: return "auth_leave"; case 4: return "assoc_expire";
    case 5: return "assoc_too_many"; case 6: return "not_authed";
    case 7: return "not_assoced"; case 8: return "assoc_leave";
    case 9: return "assoc_not_authed"; case 10: return "disassoc_power_capability_bad";
    case 11: return "disassoc_supported_channel_bad"; case 12: return "bss_transition_disassoc";
    case 13: return "ie_invalid"; case 14: return "mic_failure";
    case 15: return "four_way_handshake_timeout"; case 16: return "group_key_update_timeout";
    case 17: return "ie_in_4way_differs"; case 18: return "group_cipher_invalid";
    case 19: return "pairwise_cipher_invalid"; case 20: return "akmp_invalid";
    case 21: return "unsupported_rsn_ie_version"; case 22: return "invalid_rsn_ie_capability";
    case 23: return "802_1x_auth_failed"; case 24: return "cipher_suite_rejected";
    case 25: return "tdls_peer_unreachable"; case 26: return "tdls_unspecified";
    case 27: return "ssp_requested_disassoc"; case 28: return "no_ssp_roaming_agreement";
    case 29: return "bad_cipher_or_akm"; case 30: return "not_authorized_this_location";
    case 31: return "service_change_precludes_ts"; case 32: return "unspecified_qos";
    case 33: return "not_enough_bandwidth"; case 34: return "missing_acks";
    case 35: return "exceeded_txop"; case 36: return "sta_leaving";
    case 37: return "end_ba"; case 38: return "unknown_ba";
    case 39: return "timeout"; case 46: return "peer_initiated";
    case 47: return "ap_initiated"; case 48: return "invalid_ft_action_frame_count";
    case 49: return "invalid_pmkid"; case 50: return "invalid_mde";
    case 51: return "invalid_fte"; case 67: return "transmission_link_establish_failed";
    case 68: return "alternative_channel_occupied"; case 200: return "beacon_timeout";
    case 201: return "no_ap_found"; case 202: return "auth_fail";
    case 203: return "assoc_fail"; case 204: return "handshake_timeout";
    case 205: return "connection_fail"; case 206: return "ap_tsf_reset";
    case 207: return "roaming"; case 208: return "assoc_comeback_time_too_long";
    case 209: return "sa_query_timeout";
    default: return "unknown";
  }
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
      hasWiFiDisconnectReasonSinceBoot = true;
      lastNetworkRecoveryAction = "wifi_disconnected_event";
      break;
    default:
      break;
  }
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
    recordGen2WateringStart();
    Serial.println("💧 Auto-watering triggered (low moisture)");
    sendWateringEventToSupabase(
      "watering_started",
      activeWateringTriggerSource,
      false,
      0,
      "automatic_watering_started"
    );
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
  recordGen2WateringStart();
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
  hasCompletedWateringSinceBoot = true;

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
#if MBG_SEN0204_PUMP_INTERLOCK_ENABLED
        if (!gen2Sen0204LiquidDetected()) {
          digitalWrite(RELAY_PIN, LOW);
          physicalButtonReleaseRequired = true;
          Serial.println("Physical button watering blocked: WL01 liquid not detected");
          queuePhysicalButtonWateringEvent(
            "watering_blocked",
            "physical_button",
            false,
            0,
            "reservoir_liquid_not_detected"
          );
          return;
        }
#endif
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
#if MBG_SEN0204_PUMP_INTERLOCK_ENABLED
    if (!gen2Sen0204LiquidDetected()) {
      stopPhysicalButtonWatering(
        now,
        "watering_safety_cutoff",
        "firmware_safety",
        "reservoir_liquid_lost",
        true
      );
      Serial.println("Physical button safety cutoff: WL01 liquid lost");
      return;
    }
#endif
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

  String url = supabaseTableUrl("watering_events");

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
#if MBG_SEN0204_PUMP_INTERLOCK_ENABLED
  if (strcmp(reason, "reservoir_liquid_not_detected") == 0 ||
      strcmp(reason, "reservoir_liquid_lost") == 0) {
    postData += ",\"physical_sensor_id\":\"WL01\"";
    postData += ",\"gpio\":" + String(MBG_SEN0204_PIN);
    postData += ",\"raw_digital_state\":0";
    postData += ",\"raw_state_label\":\"LOW\"";
    postData += ",\"interlock_enabled\":true";
  }
#endif
  postData += "}";
  postData += "}";

  Serial.println("Posting watering event: " + String(eventType) + " / " + String(triggerSource));

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      recordSupabasePostSuccess(httpCode);
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

  String url = supabaseTableUrl("device_heartbeats");

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
  int wifiStatusCode = (int)WiFi.status();
  lastWiFiStatusCode = wifiStatusCode;
  postData += "\"wifi_status_code\":" + String(wifiStatusCode) + ",";
  postData += "\"wifi_status_label\":\"" + String(gen2WiFiStatusLabel(wifiStatusCode)) + "\",";
  postData += "\"last_wifi_disconnect_reason\":";
  postData += hasWiFiDisconnectReasonSinceBoot ? String(lastWiFiDisconnectReason) : "null";
  postData += ",";
  postData += "\"last_wifi_disconnect_reason_label\":\"" +
    String(gen2WiFiDisconnectReasonLabel(hasWiFiDisconnectReasonSinceBoot, lastWiFiDisconnectReason)) + "\",";
  postData += "\"wifi_reconnect_attempts_since_boot\":" + String(wifiReconnectAttemptCount) + ",";
  postData += "\"wifi_full_recovery_attempts_since_boot\":" + String(wifiBeginRecoveryAttemptCount) + ",";
  postData += "\"wifi_disconnects_since_boot\":" + String(wifiDisconnectEventCount) + ",";
  postData += "\"wifi_ip_acquisitions_since_boot\":" + String(wifiGotIpEventCount) + ",";
  postData += "\"last_wifi_disconnect_uptime_seconds\":";
  postData += hasWiFiDisconnectedSinceBoot ? String(lastWiFiDisconnectedUptimeSeconds) : "null";
  postData += ",";
  postData += "\"last_wifi_ip_acquired_uptime_seconds\":";
  postData += wifiGotIpEventCount > 0 ? String(lastWiFiReconnectedUptimeSeconds) : "null";
  postData += ",";
  postData += "\"last_wifi_activity\":\"" + String(gen2NetworkActivityLabel(lastNetworkRecoveryAction)) + "\",";
  postData += "\"last_http_status\":";
  postData += hasLastSupabaseHttpStatus ? String(lastSupabaseHttpStatus) : "null";
  postData += ",";
  postData += "\"last_http_status_label\":\"" +
    String(gen2HttpStatusLabel(hasLastSupabaseHttpStatus, lastSupabaseHttpStatus)) + "\",";
  postData += "\"consecutive_failures\":" + String(consecutiveSupabaseFailures) + ",";
  postData += "\"last_error_category\":\"" + lastSupabaseErrorCategory + "\",";
  postData += "\"last_successful_measurement_post_at\":";
  postData += hasLastSuccessfulMeasurementPost && lastSuccessfulMeasurementPostAt.length() > 0
    ? jsonStringOrNull(lastSuccessfulMeasurementPostAt) : "null";
  postData += ",";
  postData += "\"last_successful_measurement_post_uptime_seconds\":";
  postData += hasLastSuccessfulMeasurementPost && lastSuccessfulMeasurementPostAt.length() > 0
    ? String(lastSuccessfulMeasurementPostUptimeSeconds) : "null";
  postData += ",";
  postData += "\"last_successful_status_post_at\":";
  postData += hasLastSuccessfulStatusPost && lastSuccessfulStatusPostAt.length() > 0
    ? jsonStringOrNull(lastSuccessfulStatusPostAt) : "null";
  postData += ",";
  postData += "\"last_successful_status_post_uptime_seconds\":";
  postData += hasLastSuccessfulStatusPost && lastSuccessfulStatusPostAt.length() > 0
    ? String(lastSuccessfulStatusPostUptimeSeconds) : "null";
  postData += ",";
  postData += "\"currently_watering\":" + String(isWatering ? "true" : "false") + ",";
  postData += "\"active_trigger_source\":";
  postData += isWatering ? "\"" + String(activeWateringTriggerSource) + "\"" : "null";
  postData += ",";
  postData += "\"last_watering_at\":";
  postData += hasLastWateringStarted ? jsonStringOrNull(lastWateringAt) : "null";
  postData += ",";
  postData += "\"last_watering_duration_seconds\":";
  postData += hasCompletedWateringSinceBoot ? String(lastWateringDuration) : "null";
  postData += ",";
  postData += "\"free_heap_bytes\":" + String(ESP.getFreeHeap()) + ",";
  postData += "\"minimum_free_heap_bytes\":" + String(ESP.getMinFreeHeap());
  postData += "}";

  Serial.println("Device heartbeat payload: " + postData);

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      recordGen2StatusPostSuccess(httpCode);
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

  String url = supabaseTableUrl("sensor_measurement_batches");

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
      recordGen2MeasurementPostSuccess(httpCode);
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

  IPAddress localIp = WiFi.localIP();
  String ipAddress = localIp.toString();
  bool hasValidIpAddress = wifiConnected && ipAddress != "0.0.0.0";
  String macAddress = WiFi.macAddress();
  bool hasMacAddress = macAddress.length() > 0 && macAddress != "00:00:00:00:00:00";

  String response = "{";
  response += "\"device_label\":\"" + String(DEVICE_LABEL) + "\",";
  response += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  response += "\"device_role\":\"" + String(DEVICE_ROLE) + "\",";
  response += "\"firmware_version\":\"" + String(MBG_FIRMWARE_VERSION) + "\",";
  response += "\"build_profile\":\"" + String(MBG_BUILD_PROFILE) + "\",";
  response += "\"reported_at\":\"" + getUtcIsoTimestamp() + "\",";
  response += "\"uptime_seconds\":" + String(millis() / 1000) + ",";
  response += "\"network\":{";
  response += "\"wifi_connected\":" + String(wifiConnected ? "true" : "false") + ",";
  response += "\"wifi_rssi\":";
  response += wifiConnected ? String(WiFi.RSSI()) : "null";
  response += ",";
  response += "\"wifi_status_code\":" + String((int)wifiStatus) + ",";
  response += "\"wifi_status_label\":\"" + String(gen2WiFiStatusLabel((int)wifiStatus)) + "\",";
  response += "\"ip_address\":";
  response += hasValidIpAddress ? "\"" + ipAddress + "\"" : "null";
  response += ",";
  response += "\"mac_address\":";
  response += hasMacAddress ? "\"" + macAddress + "\"" : "null";
  response += ",";
  response += "\"last_wifi_disconnect_reason\":";
  response += hasWiFiDisconnectReasonSinceBoot ? String(lastWiFiDisconnectReason) : "null";
  response += ",";
  response += "\"last_wifi_disconnect_reason_label\":\"" +
    String(gen2WiFiDisconnectReasonLabel(hasWiFiDisconnectReasonSinceBoot, lastWiFiDisconnectReason)) + "\",";
  response += "\"wifi_reconnect_attempts_since_boot\":" + String(wifiReconnectAttemptCount) + ",";
  response += "\"wifi_full_recovery_attempts_since_boot\":" + String(wifiBeginRecoveryAttemptCount) + ",";
  response += "\"wifi_disconnects_since_boot\":" + String(wifiDisconnectEventCount) + ",";
  response += "\"wifi_ip_acquisitions_since_boot\":" + String(wifiGotIpEventCount) + ",";
  response += "\"last_wifi_disconnect_uptime_seconds\":";
  response += hasWiFiDisconnectedSinceBoot ? String(lastWiFiDisconnectedUptimeSeconds) : "null";
  response += ",";
  response += "\"last_wifi_ip_acquired_uptime_seconds\":";
  response += wifiGotIpEventCount > 0 ? String(lastWiFiReconnectedUptimeSeconds) : "null";
  response += ",";
  response += "\"last_wifi_activity\":\"" + String(gen2NetworkActivityLabel(lastNetworkRecoveryAction)) + "\"";
  response += "},";
  response += "\"cloud_reporting\":{";
  response += "\"last_http_status\":";
  response += hasLastSupabaseHttpStatus ? String(lastSupabaseHttpStatus) : "null";
  response += ",";
  response += "\"last_http_status_label\":\"" +
    String(gen2HttpStatusLabel(hasLastSupabaseHttpStatus, lastSupabaseHttpStatus)) + "\",";
  response += "\"consecutive_failures\":" + String(consecutiveSupabaseFailures) + ",";
  response += "\"last_error_category\":\"" + lastSupabaseErrorCategory + "\",";
  response += "\"last_successful_measurement_post_at\":";
  response += hasLastSuccessfulMeasurementPost && lastSuccessfulMeasurementPostAt.length() > 0
    ? jsonStringOrNull(lastSuccessfulMeasurementPostAt) : "null";
  response += ",";
  response += "\"last_successful_measurement_post_uptime_seconds\":";
  response += hasLastSuccessfulMeasurementPost && lastSuccessfulMeasurementPostAt.length() > 0
    ? String(lastSuccessfulMeasurementPostUptimeSeconds) : "null";
  response += ",";
  response += "\"last_successful_status_post_at\":";
  response += hasLastSuccessfulStatusPost && lastSuccessfulStatusPostAt.length() > 0
    ? jsonStringOrNull(lastSuccessfulStatusPostAt) : "null";
  response += ",";
  response += "\"last_successful_status_post_uptime_seconds\":";
  response += hasLastSuccessfulStatusPost && lastSuccessfulStatusPostAt.length() > 0
    ? String(lastSuccessfulStatusPostUptimeSeconds) : "null";
  response += "},";
  response += "\"watering\":{";
  response += "\"currently_watering\":" + String(isWatering ? "true" : "false") + ",";
  response += "\"active_trigger_source\":";
  response += isWatering ? "\"" + String(activeWateringTriggerSource) + "\"" : "null";
  response += ",";
  response += "\"last_watering_at\":";
  response += hasLastWateringStarted ? jsonStringOrNull(lastWateringAt) : "null";
  response += ",";
  response += "\"last_watering_duration_seconds\":";
  response += hasCompletedWateringSinceBoot ? String(lastWateringDuration) : "null";
  response += "},";
  response += "\"system\":{";
  response += "\"free_heap_bytes\":" + String(ESP.getFreeHeap()) + ",";
  response += "\"minimum_free_heap_bytes\":" + String(ESP.getMinFreeHeap());
  response += "}";
  response += "}";

  server.send(200, "application/json", response);
}

// Capabilities endpoint handler - returns the device's configured hardware and control features
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

void setup() {
  Serial.begin(115200);
  Serial.println("\n🌱 My Balcony Gardener Starting...");
  automaticControlBootTime = millis();

  // Initialize installed Gen2 hardware.
  gen2Begin();
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
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/capabilities", HTTP_GET, handleCapabilities);
  server.on("/measurements", HTTP_GET, handleMeasurements);
  server.onNotFound(handleNotFound);

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

      hasCompletedWateringSinceBoot = true;
      const char* completionTriggerSource = "firmware_safety";
      const char* completionReason = "watering_completed_trigger_source_fallback";
      if (strcmp(activeWateringTriggerSource, "automatic") == 0) {
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

      Serial.printf("✅ Watering complete. Duration: %lu seconds\n", lastWateringDuration);
    }
  }

#if MBG_PHYSICAL_BUTTON_ENABLED
  flushOnePhysicalButtonWateringEvent();
#endif

  maintainWiFiConnection();
  server.handleClient();

  if (now - lastGen2MeasurementPostTime >= GEN2_MEASUREMENT_POST_INTERVAL_MS) {
    sendGen2MeasurementsToSupabase();
    lastGen2MeasurementPostTime = now;
  }

  if (now - lastHeartbeatPostTime >= HEARTBEAT_INTERVAL_MS) {
    sendDeviceHeartbeatToSupabase("periodic");
    lastHeartbeatPostTime = now;
  }

}
