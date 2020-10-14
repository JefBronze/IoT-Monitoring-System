#include "SecretsESP1CasaTiosGas.h"
#include <WiFiClientSecure.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"

// The MQTT topics that this device should publish/subscribe
#define AWS_IOT_PUBLISH_TOPIC   "ESP1CasaTiosGas/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "ESP1CasaTiosGas/sub"

#define DEBOUNCETIME 2000 //tempo máximo de debounce para o botão (ms) --> 2000 = 2seg de garantia que o odometro rodou 
#define chave_gas_1 12 //chave magengética no pino funcionando como interrupção---esse seria a leitura do sensor

volatile uint32_t debounceTimeout = 0; //guarda o tempo de debounce //É DECLARADA VOLÁTIL PORQUE SERÁ COMPARTILHADA PELO ISR E PELO CÓDIGO PRINCIPAL

//variáveis para controle dentro do loop
bool chave_gas_1_status = 0; //armazena o ultimo estado do pino da chave magnetica
float decimo_gas_1 = 0;
float volume_total_gas_1 = 0.00;

portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;// Para configurar seções críticas (interrupções de ativação e interrupções de desativação não disponíveis // usado para desabilitar e interromper interrupções
//***Variaveis e definições da chave de interrupção do gás***////


//função de interrupção da chave magnética do gás
void IRAM_ATTR handleButtonInterrupt() {
  portENTER_CRITICAL_ISR(&mux); //trava a variavel para utilizar só nessa função
  chave_gas_1_status = 1;  //força o ultimo estado como LOW
  debounceTimeout = xTaskGetTickCount(); //versão do millis () que funciona a partir da interrupção //version of millis() that works from interrupt
  portEXIT_CRITICAL_ISR(&mux); //destrava a variavel para utilizar só nessa função
}


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
  doc["pulso_gas"] = decimo_gas_1;
  doc["volume_total"] = volume_total_gas_1;
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

void setup() {
  Serial.begin(115200);

  connectWifi();
  connectAWS();

  pinMode(chave_gas_1, INPUT);
  attachInterrupt(digitalPinToInterrupt(chave_gas_1), handleButtonInterrupt, RISING);   //configura a interrupção do botão no evento CHANGE para a função handleButtonInterrupt
  chave_gas_1_status = 0; //inicia o status da chave em alto
  delay(1000);
  Serial.println("Conectado!");
}

void loop() {


  //se o tempo passado foi maior que o configurado para o debounce e o número de interrupções ocorridas é maior que ZERO (ou seja, ocorreu alguma), realiza os procedimentos
  if ( (millis() - debounceTimeout) > DEBOUNCETIME && (chave_gas_1_status == 1) ) {
    //se a chave indicar um contato aumenta volume de gas total e adiciona um décimo de gás também
    volume_total_gas_1 = volume_total_gas_1 + 0.01; //soma o total de gás que já passou
    decimo_gas_1 = 0.01; // adiciona um décimo de m3 na nuvem - variavel responsavel de criar rastros de quando um décimo de m3 é gerad
    portENTER_CRITICAL_ISR(&mux);  //início da seção crítica
    chave_gas_1_status = 0; //retorna o status do gás para alto
    portEXIT_CRITICAL_ISR(&mux); //fim da seção crítica

  }

   Serial.print("Volume total de gás: ");
   Serial.println(volume_total_gas_1);
   Serial.print("Adiciona: ");
   Serial.println(decimo_gas_1);
   delay(1000);

   publishMessage();
   client.loop();

  decimo_gas_1 = 0; //reseta o ultimo décimo de gás gravado *** Verificar a lógica que usar posteriomente..

  if (WiFi.status() != WL_CONNECTED) {

    Serial.print("Perdeu conexão WIFI");
    connectWifi();
  }
  
  if (!client.connect(THINGNAME) && WiFi.status() == WL_CONNECTED) {
    Serial.print("Perdeu conexão AWS");
    connectAWS();
  }
}
