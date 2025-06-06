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

// Initialize hardware
DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

// State management
bool isWatering = false;
unsigned long wateringStartTime = 0;
unsigned long lastLogTime = 0;
unsigned long lastWateringDuration = 0;
String lastWateredTime = "N/A";

// Function declarations
void connectToWiFi();
void setupTime();
String getFormattedTime();
void sendDataToSupabase(float temperature, float humidity, int moisture, bool watering);
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

// Connect to Wi-Fi
void connectToWiFi() {
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
    Serial.println("\n❌ Failed to connect to Wi-Fi. Rebooting...");
    delay(3000);
    ESP.restart();
  }
}

// Setup NTP time
void setupTime() {
  configTime(0, 0, NTP_SERVER1, NTP_SERVER2);
  setenv("TZ", TIMEZONE, 1);
  tzset();
}

// Send sensor data to Supabase
void sendDataToSupabase(float temperature, float humidity, int moisture, bool watering) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // TODO: Use setCACert() for production
  HTTPClient https;

  https.begin(client, SUPABASE_URL);
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  // Build JSON payload according to Supabase schema
  String postData = "{";
  postData += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  postData += "\"temperature\":" + String(temperature, 2) + ",";
  postData += "\"humidity\":" + String(humidity, 2) + ",";
  postData += "\"moisture\":" + String(moisture) + ",";
  postData += "\"watering\":" + String(watering ? "true" : "false") + ",";
  postData += "\"lastWateredTime\":\"" + lastWateredTime + "\",";
  postData += "\"lastWateringDuration\":" + String(lastWateringDuration);
  postData += "}";

  int httpCode = https.POST(postData);

  if (httpCode > 0) {
    if (httpCode == 201) {
      Serial.println("✅ Data sent to Supabase");
    } else {
      Serial.print("⚠️ Supabase response code: ");
      Serial.println(httpCode);
      String response = https.getString();
      Serial.println(response);
    }
  } else {
    Serial.println("❌ POST failed");
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

  float humidity = dht.readHumidity();
  float tempC = dht.readTemperature();

  if (isnan(humidity) || isnan(tempC)) {
    server.send(500, "application/json", "{\"error\":\"Sensor read error\"}");
    return;
  }

  float tempF = (tempC * 1.8) + 32;
  int soilValue = analogRead(SOIL_PIN);
  float moisture = map(soilValue, 3680, 1230, 0, 100);
  moisture = constrain(moisture, 0, 100);

  String response = "{";
  response += "\"temperature\":" + String(tempF, 1) + ",";
  response += "\"humidity\":" + String(humidity, 1) + ",";
  response += "\"moisture\":" + String(moisture, 1) + ",";
  response += "\"watering\":" + String(isWatering ? "true" : "false") + ",";
  response += "\"lastWateredTime\":\"" + lastWateredTime + "\",";
  response += "\"lastWateringDuration\":" + String(lastWateringDuration) + ",";
  response += "\"timestamp\":\"" + getFormattedTime() + "\"";
  response += "}";

  server.send(200, "application/json", response);
}

// Water-now endpoint handler
void handleWaterNow() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (!isWatering) {
    digitalWrite(RELAY_PIN, HIGH);
    isWatering = true;
    wateringStartTime = millis();
    lastWateredTime = getFormattedTime();
    Serial.println("💧 Manual watering triggered");
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
  server.handleClient();
  unsigned long now = millis();

  // Regular sensor logging
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    float humidity = dht.readHumidity();
    float tempC = dht.readTemperature();

    if (!isnan(humidity) && !isnan(tempC)) {
      float tempF = (tempC * 1.8) + 32;
      int soilValue = analogRead(SOIL_PIN);
      float moisture = map(soilValue, 3680, 1230, 0, 100);
      moisture = constrain(moisture, 0, 100);

      // Send data to Supabase
      sendDataToSupabase(tempF, humidity, moisture, isWatering);

      Serial.printf("📊 T: %.1f°F, H: %.1f%%, M: %.1f%%, Watering: %s\n",
                    tempF, humidity, moisture, isWatering ? "Yes" : "No");

      // Auto-watering logic
      if (!isWatering && moisture < MOISTURE_THRESHOLD) {
        digitalWrite(RELAY_PIN, HIGH);
        isWatering = true;
        wateringStartTime = millis();
        lastWateredTime = getFormattedTime();
        Serial.println("💧 Auto-watering triggered (low moisture)");
      }
    } else {
      Serial.println("⚠️ Failed to read DHT sensor");
    }

    lastLogTime = now;
  }

  // Handle watering duration
  if (isWatering) {
    unsigned long wateringDuration = millis() - wateringStartTime;

    if (wateringDuration >= WATERING_DURATION_MS) {
      digitalWrite(RELAY_PIN, LOW);
      isWatering = false;
      lastWateringDuration = wateringDuration / 1000; // Convert to seconds

      // Send final update with watering completed
      float humidity = dht.readHumidity();
      float tempC = dht.readTemperature();
      if (!isnan(humidity) && !isnan(tempC)) {
        float tempF = (tempC * 1.8) + 32;
        int soilValue = analogRead(SOIL_PIN);
        float moisture = map(soilValue, 3680, 1230, 0, 100);
        moisture = constrain(moisture, 0, 100);
        sendDataToSupabase(tempF, humidity, moisture, false);
      }

      Serial.printf("✅ Watering complete. Duration: %lu seconds\n", lastWateringDuration);
    }
  }
}
