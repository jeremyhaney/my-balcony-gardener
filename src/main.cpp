// REV v1.2.9_auto_watering_trigger added back
// REV v1.2.8 Added cumulative watering duration and last watering duration to the Supabase database
// REV v1.2.7 First connect to Supabase
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// Replace with your Supabase project details
const char *supabase_url = "https://ltqohdqdakytyxnlqzog.supabase.co/rest/v1/sensor_logs";
const char *supabase_api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cW9oZHFkYWt5dHl4bmxxem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTY3NTksImV4cCI6MjA2MjMzMjc1OX0.MIpkiyTLAXQxh_huBkCU5gFxLxkUVlSddy-cFCFC_KM";

void sendDataToSupabase(String deviceId, float temperature, float humidity, int moisture, bool watering, int duration);

#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include "time.h"

#define DHTPIN 21
#define DHTTYPE DHT11
#define SOIL_PIN 34
#define RELAY_PIN 5

const char *ssid = "big_brother2.4";
const char *password = "DudesTheDog";

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

// LogArray structure
struct LogEntry
{
  String timestamp; // Human-readable timestamp
  float tempF;
  float humidity;
  float moisture;
  unsigned long duration;
  String lastWateredTime; // Human-readable timestamp
};

// Log storage
const int MAX_LOGS = 100;
LogEntry logs[MAX_LOGS];
int logIndex = 0;

// State
bool isWatering = false;
unsigned long wateringStartTime = 0;
unsigned long lastLogTime = 0;
String lastWateredTime = "N/A";

// Add a new variable to track cumulative watering duration
unsigned long cumulativeWateringDuration = 0;

// Add a new variable to track the last watering duration in seconds
unsigned long lastWateringDuration = 0;

// Get formatted local time as a string
String getFormattedTime()
{
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo))
  {
    Serial.println("⚠️ Failed to obtain time");
    return "TIME_ERROR";
  }
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

// Function to connect to Wi-Fi
void connectToWiFi()
{
  WiFi.begin(ssid, password);
  Serial.print("📡 Connecting to Wi-Fi: ");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20)
  {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\n✅ Wi-Fi connected!");
    Serial.print("🔗 IP: ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println("\n❌ Failed to connect to Wi-Fi. Rebooting...");
    delay(3000);
    ESP.restart();
  }
}

// Save a log entry with FIFO logic and formatted timestamps
void logData(float tempF, float humidity, float moisture, unsigned long duration)
{
  String currentTime = getFormattedTime();
  LogEntry newEntry = {
      currentTime,
      tempF,
      humidity,
      moisture,
      duration,
      lastWateredTime};
  sendDataToSupabase("550e8400-e29b-41d4-a716-446655440000", tempF, humidity, moisture, isWatering, lastWateringDuration);

  if (logIndex >= MAX_LOGS)
  {
    for (int i = 1; i < MAX_LOGS; i++)
    {
      logs[i - 1] = logs[i];
    }
    logs[MAX_LOGS - 1] = newEntry;
  }
  else
  {
    logs[logIndex++] = newEntry;
  }
}

// Serve JSON logs
void handleLogs()
{
  server.sendHeader("Access-Control-Allow-Origin", "*");

  String logArray = "[";
  for (int i = 0; i < MAX_LOGS; i++)
  {
    if (logs[i].timestamp == "")
      continue;
    logArray += "{";
    logArray += "\"timestamp\":\"" + logs[i].timestamp + "\",";
    logArray += "\"tempF\":" + String(logs[i].tempF, 1) + ",";
    logArray += "\"humidity\":" + String(logs[i].humidity, 1) + ",";
    logArray += "\"moisture\":" + String(logs[i].moisture, 1) + ",";
    logArray += "\"duration\":" + String(logs[i].duration) + ",";
    logArray += "\"lastWateredTime\":\"" + logs[i].lastWateredTime + "\"";
    logArray += "},";
  }

  if (logArray.endsWith(","))
    logArray.remove(logArray.length() - 1);

  logArray += "]";
  String response = "{\"logs\":" + logArray + ",";
  response += "\"lastWateringDuration\":" + String(lastWateringDuration) + ",";
  response += "\"lastWateredTime\":\"" + lastWateredTime + "\"}";
  server.send(200, "application/json", response);
}

// Trigger watering manually
void handleWater()
{
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (!isWatering)
  {
    digitalWrite(RELAY_PIN, HIGH);
    isWatering = true;
    wateringStartTime = millis();
    lastWateredTime = getFormattedTime();
    Serial.println("💧 Manual watering started");
  }
  server.send(200, "text/plain", "Watering triggered");
}

void handleRoot()
{
  server.send(200, "text/plain", "MBG dashboard is alive!");
}

void setup()
{
  Serial.begin(115200);
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  connectToWiFi();

  // Configure NTP
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  setenv("TZ", "EST5EDT,M3.2.0,M11.1.0", 1);
  tzset();

  // Define server routes
  server.on("/", HTTP_GET, handleRoot);

  server.on("/logs", handleLogs);
  server.on("/water", handleWater);

  server.begin();
  Serial.println("🌐 Web server started");
}

void loop()
{
  server.handleClient();
  unsigned long now = millis();

  if (now - lastLogTime >= 5000)
  {
    float humidity = dht.readHumidity();
    float tempC = dht.readTemperature();
    if (!isnan(humidity) && !isnan(tempC))
    {
      float tempF = (tempC * 1.8) + 32;
      int soilValue = analogRead(SOIL_PIN);
      float moisture = map(soilValue, 3680, 1230, 0, 100);
      moisture = constrain(moisture, 0, 100);

      // Log data with cumulative watering duration
      logData(tempF, humidity, moisture, cumulativeWateringDuration);
      Serial.printf("📊 T: %.1f°F, H: %.1f%%, M: %.1f%%, D: %lu ms\n", tempF, humidity, moisture, cumulativeWateringDuration);

      // Auto-watering trigger (e.g. if moisture below 50% - for testing)
      if (!isWatering && moisture < 50)
      {
        digitalWrite(RELAY_PIN, HIGH);
        isWatering = true;
        wateringStartTime = millis();
        lastWateredTime = getFormattedTime();
        Serial.println("💧 Auto-watering triggered due to low moisture");
      }
    }
    else if (isnan(humidity) || isnan(tempC))
    {
      Serial.println("⚠️ Failed to read DHT sensor.");
    }
    else
    {
      Serial.println("⚠️ Failed to read DHT sensor.");
    }
    lastLogTime = now;
  }

  if (isWatering)
  {
    // Accumulate watering duration
    cumulativeWateringDuration = millis() - wateringStartTime;

    // Stop watering after 15 seconds (example threshold)
    if (cumulativeWateringDuration >= 15000)
    {
      digitalWrite(RELAY_PIN, LOW);
      isWatering = false;

      // Update last watering duration in seconds
      lastWateringDuration = cumulativeWateringDuration / 1000;

      // Log the final watering duration
      logData(dht.readTemperature() * 1.8 + 32, dht.readHumidity(), analogRead(SOIL_PIN), cumulativeWateringDuration);
      Serial.println("✅ Watering complete");

      // Reset cumulative duration
      cumulativeWateringDuration = 0;
    }
  }
}

void sendDataToSupabase(String deviceId, float temperature, float humidity, int moisture, bool watering, int duration)
{
  if (WiFi.status() == WL_CONNECTED)
  {
    WiFiClientSecure client;
    client.setInsecure(); // WARNING: use setCACert() for production
    HTTPClient https;

    https.begin(client, supabase_url);
    https.addHeader("apikey", supabase_api_key);
    https.addHeader("Authorization", "Bearer " + String(supabase_api_key));
    https.addHeader("Content-Type", "application/json");

    String postData = "{";
    postData += "\"device_id\":\"" + deviceId + "\",";
    postData += "\"data\":{";
    postData += "\"temperature\":" + String(temperature, 2) + ",";
    postData += "\"humidity\":" + String(humidity, 2) + ",";
    postData += "\"moisture\":" + String(moisture) + ",";
    postData += "\"watering\":" + String(watering ? "true" : "false") + ",";
    postData += "\"duration\":" + String(duration) + ",";
    postData += "\"lastWateredTime\":\"" + lastWateredTime + "\",";
    postData += "\"lastWateringDuration\":" + String(lastWateringDuration);
    postData += "}}";

    int httpCode = https.POST(postData);
    Serial.print("Supabase response code: ");
    Serial.println(httpCode);

    if (httpCode > 0)
    {
      String response = https.getString();
      Serial.println(response);
    }
    else
    {
      Serial.println("POST failed");
    }

    https.end();
  }
  else
  {
    Serial.println("WiFi not connected");
  }
}
