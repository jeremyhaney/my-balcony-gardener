// My Balcony Gardener - ESP32 Firmware
// Version: v1.0.0_refactored
// Follows PRD architecture requirements

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DHT.h>
#include "time.h"
#include "config.h"
#include "device_identity.h"

// 15-minute post-watering cooldown/soak guard for automatic watering only.
// Guarded here because src/config.h contains local secrets and is intentionally ignored by Git.
#ifndef WATERING_COOLDOWN_MS
#define WATERING_COOLDOWN_MS 900000
#endif

#ifndef WIFI_RECONNECT_INTERVAL_MS
#define WIFI_RECONNECT_INTERVAL_MS 30000
#endif

// Initialize hardware
DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

// State management
bool isWatering = false;
unsigned long wateringStartTime = 0;
unsigned long lastWateringEndTime = 0;
unsigned long lastLogTime = 0;
unsigned long lastWateringDuration = 0;
unsigned long lastWiFiReconnectAttemptTime = 0;
String lastWateredTime = "N/A";
bool hasLastGoodDht = false;
float lastGoodTempF = 0;
float lastGoodHumidity = 0;

// Function declarations
void connectToWiFi();
void maintainWiFiConnection();
void setupTime();
String getFormattedTime();
bool readDhtWithFallback(float &temperatureF, float &humidity);
void sendDataToSupabase(float temperature, float humidity, int moisture, int soilRawAdc, bool watering);
void handleRoot();
void handleLogs();
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

// Only DHT temperature/humidity may fall back to last-known-good values.
// Soil moisture stays fresh-only because it controls watering decisions.
bool readDhtWithFallback(float &temperatureF, float &humidity) {
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
}

// Connect to Wi-Fi
void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
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
  if (wifiStatus == WL_CONNECTED) {
    return;
  }

  if (wifiStatus == WL_IDLE_STATUS) {
    return;
  }

  unsigned long now = millis();
  if (now - lastWiFiReconnectAttemptTime < WIFI_RECONNECT_INTERVAL_MS) {
    return;
  }

  lastWiFiReconnectAttemptTime = now;
  Serial.println("Wi-Fi disconnected; requesting reconnect without blocking local control.");
  WiFi.reconnect();
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
      Serial.println("✅ Data sent to Supabase");
    } else {
      Serial.print("⚠️ Supabase response code: ");
      Serial.println(httpCode);
      String response = https.getString();
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.println("❌ POST failed");
    Serial.print("Error: ");
    Serial.println(https.errorToString(httpCode).c_str());
  }

  https.end();
}

// Root endpoint handler
void handleRoot() {
  server.send(200, "text/plain", "My Balcony Gardener ESP32 - Alive!");
}

// Logs endpoint handler - returns latest sensor data
void handleLogs() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  float humidity = 0;
  float tempF = 0;
  if (!readDhtWithFallback(tempF, humidity)) {
    server.send(500, "application/json", "{\"error\":\"Sensor read error\"}");
    return;
  }

  int soilValue = analogRead(SOIL_PIN);
  float moisture = map(soilValue, 3680, 1230, 0, 100);
  moisture = constrain(moisture, 0, 100);

  // Use the same format as we send to Supabase for consistency
  String response = "{";
  response += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
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

  // Manual Water Now is intentionally not blocked by the automatic cooldown.
  if (!isWatering) {
    digitalWrite(RELAY_PIN, HIGH);
    isWatering = true;
    wateringStartTime = millis();
    lastWateredTime = getFormattedTime();
    Serial.println("💧 Manual watering triggered");
    // Phase 5D: log watering start immediately so short pump cycles are visible.
    float humidity = 0;
    float tempF = 0;
    if (readDhtWithFallback(tempF, humidity)) {
      int soilValue = analogRead(SOIL_PIN);
      float moisture = map(soilValue, 3680, 1230, 0, 100);
      moisture = constrain(moisture, 0, 100);
      sendDataToSupabase(tempF, humidity, moisture, soilValue, true);
    }
    server.send(200, "text/plain", "Watering started");
  } else {
    server.send(409, "text/plain", "Already watering");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n🌱 My Balcony Gardener Starting...");

  // Initialize hardware
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  // Connect to network and setup time
  connectToWiFi();
  setupTime();

  // Setup web server endpoints
  server.on("/", HTTP_GET, handleRoot);
  server.on("/logs", HTTP_GET, handleLogs);
  server.on("/water-now", HTTP_POST, handleWaterNow);

  server.begin();
  Serial.println("🌐 Web server started");
}

void loop() {
  unsigned long now = millis();

  // Pump shutoff has priority over client/server, network, and telemetry work.
  if (isWatering) {
    unsigned long wateringDuration = now - wateringStartTime;

    if (wateringDuration >= WATERING_DURATION_MS) {
      digitalWrite(RELAY_PIN, LOW);
      isWatering = false;
      lastWateringEndTime = millis();
      lastWateringDuration = wateringDuration / 1000; // Convert to seconds

      // Send final update with watering completed
      float humidity = 0;
      float tempF = 0;
      if (readDhtWithFallback(tempF, humidity)) {
        int soilValue = analogRead(SOIL_PIN);
        float moisture = map(soilValue, 3680, 1230, 0, 100);
        moisture = constrain(moisture, 0, 100);
        sendDataToSupabase(tempF, humidity, moisture, soilValue, false);
      }

      Serial.printf("✅ Watering complete. Duration: %lu seconds\n", lastWateringDuration);
    }
  }

  maintainWiFiConnection();
  server.handleClient();

  // Regular sensor logging
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    float humidity = 0;
    float tempF = 0;

    if (readDhtWithFallback(tempF, humidity)) {
      int soilValue = analogRead(SOIL_PIN);
      float moisture = map(soilValue, 3680, 1230, 0, 100);
      moisture = constrain(moisture, 0, 100);

      // Send data to Supabase
      sendDataToSupabase(tempF, humidity, moisture, soilValue, isWatering);

      Serial.printf("📊 T: %.1f°F, H: %.1f%%, M: %.1f%%, Watering: %s\n",
                    tempF, humidity, moisture, isWatering ? "Yes" : "No");

      // Cooldown prevents repeated automatic cycles before soil/sensor readings stabilize.
      if (!isWatering &&
          moisture < MOISTURE_THRESHOLD &&
          (lastWateringEndTime == 0 || now - lastWateringEndTime >= WATERING_COOLDOWN_MS)) {
        digitalWrite(RELAY_PIN, HIGH);
        isWatering = true;
        wateringStartTime = millis();
        lastWateredTime = getFormattedTime();
        // Phase 5D: log watering start immediately using this interval's readings.
        sendDataToSupabase(tempF, humidity, moisture, soilValue, true);
        Serial.println("💧 Auto-watering triggered (low moisture)");
      }
    } else {
      Serial.println("⚠️ Skipping telemetry because DHT values are unavailable");
    }

    lastLogTime = now;
  }

}
