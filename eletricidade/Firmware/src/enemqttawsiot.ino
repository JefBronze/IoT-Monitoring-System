#include "SecretsESP2CasaTiosEne.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"
#include "EmonLib.h"

EnergyMonitor emonF1;
EnergyMonitor emonF2;
EnergyMonitor emonN;

#define AWS_IOT_PUBLISH_TOPIC   "ESP2CasaTiosEne/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "ESP2CasaTiosEne/sub"

double IrmsF1 = 0.00;
double IrmsF2 = 0.00;
double IrmsN = 0.00;

WiFiClientSecure net = WiFiClientSecure();
MQTTClient client = MQTTClient(256);

long interval = 5000;
long previousMillis = 0;

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
  doc["potencia_ApaF1"] = IrmsF1 * 126.8;
  doc["IrmsF1"] = IrmsF1;
  doc["potencia_ApaF2"] = IrmsF2 * 126.6;
  doc["IrmsF2"] = IrmsF2;
  doc["potencia_ApaN"] = IrmsN * 0;
  doc["IrmsN"] = IrmsN;
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

void setup()
{
  Serial.begin(115200);

  connectWifi();
  connectAWS();

  emonF1.current(34, 5.1);// Corrente Fase 1: input pin, calibration.
  emonF2.current(35, 2.1);// Corrente Fase 2: input pin, calibration.
  emonN.current(32, 10.1);// Corrente Neutro: input pin, calibration.
}

void loop()
{
  IrmsF1 = emonF1.calcIrms(1480);// Calculate Irms Fase 1 only
  IrmsF2 = emonF2.calcIrms(1480);// Calculate Irms Fase 2 only
  IrmsN = emonN.calcIrms(1480);// Calculate Irms Neutro only
  Serial.print(IrmsF1 * 126.8);// Apparent power - Fase 1
  Serial.print(" ");
  Serial.println(IrmsF1);
  Serial.print(IrmsF2 * 126.6);// Apparent power - Fase 2
  Serial.print(" ");
  Serial.println(IrmsF2);
  Serial.print(IrmsN * 0);// Apparent power - Neutro
  Serial.print(" ");
  Serial.println(IrmsN);

  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis > interval) {
    Serial.println("Ta rolando!");
    
    previousMillis = currentMillis;
    publishMessage();
    client.loop();
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.print("Perdeu conexão WIFI");
      connectWifi();
    }

    if (!client.connect(THINGNAME)) {
      Serial.print("Perdeu conexão AWS");
      connectAWS();
    }
  }

}
