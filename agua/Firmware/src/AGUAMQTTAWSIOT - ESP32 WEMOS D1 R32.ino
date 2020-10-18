#include "SecretsESP3CasaTiosA.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"

#define SENSOR 36

#define AWS_IOT_PUBLISH_TOPIC   "ESP3CasaTiosA/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "ESP3CasaTiosA/sub"

long currentMillis = 0;
long previousMillis = 0;
int interval = 1000;
float calibrationFactor = 4.5;
volatile byte pulseCount;
byte pulse1Sec = 0;
float flowRate;
unsigned int flowMilliLitres;
unsigned long totalMilliLitres;

WiFiClientSecure net = WiFiClientSecure();
MQTTClient client = MQTTClient(256);

void connectWifi()
{

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void connectAWS()
{
  // Configure WiFiClientSecure to use the AWS IoT device credentials
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);

  // Connect to the MQTT broker on the AWS endpoint we defined earlier
  client.begin(AWS_IOT_ENDPOINT, 8883, net);

  // Create a message handler
  client.onMessage(messageHandler);

  Serial.print("Connecting to AWS IOT");

  while (!client.connect(THINGNAME)) {
    Serial.print(".");
    delay(100);
  }

  if (!client.connected()) {
    Serial.println("AWS IoT Timeout!");
    return;
  }

  // Subscribe to a topic
  client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC);

  Serial.println("AWS IoT Connected!");
}

void publishMessage()
{
  StaticJsonDocument<200> doc;
  doc["time"] = millis();
  doc["fluxoAgua"] = flowRate;
  doc["volumeTotal"] = totalMilliLitres;
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer); // print to client

  client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}

void messageHandler(String &topic, String &payload) {
  Serial.println("incoming: " + topic + " - " + payload);

  //  StaticJsonDocument<200> doc;
  //  deserializeJson(doc, payload);
  //  const char* message = doc["message"];
}

void IRAM_ATTR pulseCounter()
{
  pulseCount++;
}

void setup()
{
  Serial.begin(115200);

  connectWifi();
  connectAWS();

  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(SENSOR, INPUT_PULLUP);

  pulseCount = 0;
  flowRate = 0.0;
  flowMilliLitres = 0;
  totalMilliLitres = 0;
  previousMillis = 0;

  attachInterrupt(digitalPinToInterrupt(SENSOR), pulseCounter, FALLING);
}

void loop()
{
  pulse1Sec = pulseCount;
  pulseCount = 0;

  // Because this loop may not complete in exactly 1 second intervals we calculate
  // the number of milliseconds that have passed since the last execution and use
  // that to scale the output. We also apply the calibrationFactor to scale the output
  // based on the number of pulses per second per units of measure (litres/minute in
  // this case) coming from the sensor.
  flowRate = ((1000.0 / (millis() - previousMillis)) * pulse1Sec) / calibrationFactor;
  previousMillis = millis();

  // Divide the flow rate in litres/minute by 60 to determine how many litres have
  // passed through the sensor in this 1 second interval, then multiply by 1000 to
  // convert to millilitres.
  flowMilliLitres = (flowRate / 60) * 1000;

  // Add the millilitres passed in this second to the cumulative total
  totalMilliLitres += flowMilliLitres;

  // Print the flow rate for this second in litres / minute
  Serial.print("Flow rate: ");
  Serial.print(int(flowRate));  // Print the integer part of the variable
  Serial.print("L/min");
  Serial.print("\t");       // Print tab space

  // Print the cumulative total of litres flowed since starting
  Serial.print("Output Liquid Quantity: ");
  Serial.print(totalMilliLitres);
  Serial.print("mL / ");
  Serial.print(totalMilliLitres / 1000);
  Serial.println("L");

  publishMessage();
  client.loop();

  if (WiFi.status() != WL_CONNECTED) {

    Serial.print("Perdeu conexão WIFI");
    connectWifi();
  }

  if (!client.connect(THINGNAME) && WiFi.status() == WL_CONNECTED) {
    Serial.print("Perdeu conexão AWS");
    connectAWS();
  }
}
