#include <Arduino.h>

#include "DHT.h"
#include <WiFi.h>
#include <WebServer.h>

#define DHTPIN 21
#define DHTTYPE DHT11
#define SOIL_PIN 34
#define RELAY_PIN 5

const char *ssid = "big_brother2.4";
const char *password = "DudesTheDog";

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

struct LogEntry
{
  unsigned long timestamp;
  float tempF;
  float humidity;
  bool watered;
  int duration;
};

const int MAX_LOGS = 100;
LogEntry logs[MAX_LOGS];
int logIndex = 0;

float temperatureF = 0;
float humidityVal = 0;
float heatIndexF = 0;
int soilValue = 0;

unsigned long waterDuration = 15000;
bool isWatering = false;
unsigned long wateringStartTime = 0;
unsigned long lastLogTime = 0;

void connectToWiFi()
{
  Serial.print("📡 Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20)
  {
    delay(500);
    Serial.print(".");
    attempt++;
  }
  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\n✅ Wi-Fi connected!");
    Serial.print("📶 IP Address: ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println("\n❌ Wi-Fi failed to connect.");
  }
}

void handleRoot()
{
  String html = R"rawliteral(
<!DOCTYPE html><html>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Microclimate Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 800px; margin: auto; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h2 { text-align: center; }
    .stats, .controls { text-align: center; margin: 15px 0; }
    .stats div { margin: 5px; font-size: 1.2em; }
    button { padding: 10px 20px; font-size: 1em; background: green; color: white; border: none; border-radius: 5px; cursor: pointer; }
    canvas { display: block; margin: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🌿 Microclimate Dashboard</h2>
    <div class="stats" id="liveReadings">
      <div>🌡️ Temp: -- °F</div>
      <div>💧 Humidity: -- %</div>
      <div>🥵 Feels Like: -- °F</div>
      <div>🌴 Soil Moisture: --</div>
    </div>
    <div class="controls">
      <form action="/water" method="POST">
        <button type="submit">💧 Water Now</button>
      </form>
    </div>
    <canvas id="chart" width="600" height="300"></canvas>
    <script>
      async function fetchLive() {
        const res = await fetch('/logs');
        const data = await res.json();
        const last = data[data.length - 1];
        if (last) {
          document.getElementById('liveReadings').innerHTML = `
            <div>🌡️ Temp: ${last.tempF.toFixed(1)} °F</div>
            <div>💧 Humidity: ${last.humidity.toFixed(1)} %</div>
            <div>🥵 Feels Like: ${(last.tempF - 0.7).toFixed(1)} °F</div>
            <div>🌴 Soil Moisture: 0</div>`; // You can wire in real data later
        }
        return data;
      }

      function drawChart(data) {
        const canvas = document.getElementById('chart');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.width; // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const temp = data.map(d => d.tempF);
        const hum = data.map(d => d.humidity);
        const maxY = Math.max(...temp, ...hum) + 5;
        ctx.beginPath(); ctx.strokeStyle='red';
        temp.forEach((v, i) => {
          const x = i * 6; const y = 280 - (v / maxY) * 280;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.beginPath(); ctx.strokeStyle='blue';
        hum.forEach((v, i) => {
          const x = i * 6; const y = 280 - (v / maxY) * 280;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      async function update() {
        const data = await fetchLive();
        drawChart(data);
      }

      setInterval(update, 5000);
      update();
    </script>
  </div>
</body>
</html>
)rawliteral";

  server.send(200, "text/html", html);
}

void handleLogs()
{
  String json = "[";
  for (int i = 0; i < logIndex; i++)
  {
    int idx = (logIndex - logIndex + i + MAX_LOGS) % MAX_LOGS;
    json += "{";
    json += "\"tempF\": " + String(logs[idx].tempF, 1) + ", ";
    json += "\"humidity\": " + String(logs[idx].humidity, 1);
    json += "}";
    if (i < logIndex - 1)
      json += ",";
  }
  json += "]";
  server.send(200, "application/json", json);
}

void handleWaterNow()
{
  if (!isWatering)
  {
    Serial.println("💧 Watering started.");
    digitalWrite(RELAY_PIN, HIGH);
    isWatering = true;
    wateringStartTime = millis();
  }
  server.sendHeader("Location", "/");
  server.send(303);
}

void setup()
{
  Serial.begin(115200);
  delay(1000);
  connectToWiFi();
  dht.begin();
  pinMode(SOIL_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  server.on("/", handleRoot);
  server.on("/water", handleWaterNow);
  server.on("/logs", handleLogs);
  server.begin();
  Serial.println("🌐 Web server started.");
}

void loop()
{
  server.handleClient();

  if (isWatering && (millis() - wateringStartTime >= waterDuration))
  {
    digitalWrite(RELAY_PIN, LOW);
    isWatering = false;
    Serial.println("✅ Watering complete.");
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastLogTime >= 5000)
  {
    lastLogTime = currentMillis;
    humidityVal = dht.readHumidity();
    float temperatureC = dht.readTemperature();
    temperatureF = (temperatureC * 1.8) + 32;
    heatIndexF = dht.computeHeatIndex(temperatureF, humidityVal);
    soilValue = analogRead(SOIL_PIN);

    LogEntry entry;
    entry.timestamp = millis();
    entry.tempF = temperatureF;
    entry.humidity = humidityVal;
    entry.watered = isWatering;
    entry.duration = isWatering ? waterDuration : 0;

    logs[logIndex] = entry;
    logIndex = (logIndex + 1) % MAX_LOGS;

    Serial.print("📊 Logged T: ");
    Serial.print(entry.tempF);
    Serial.print(" H: ");
    Serial.print(entry.humidity);
    Serial.println(entry.watered ? " W: Yes" : " W: No");
  }
}
