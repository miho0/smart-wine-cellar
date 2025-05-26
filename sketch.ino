#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include "DHTesp.h"

const char *mqtt_server = "fb18f775ad6a416da588f836c40332b4.s2.eu.hivemq.cloud";

const char *ssid = "hidden";
const char *password = "hidden";

const char *mqtt_user = "esp32";
const char *mqtt_pass = "hidden";

WiFiClientSecure espClient;
PubSubClient client(espClient);

DHTesp dht;
int dhtPin = 13;
int briPin = 32;
int ledPin = 14;
int buzzerPin = 25;

int minBrightness = 100;
int maxBrightness = 500;

int minTemperature = 20;
int maxTemperature = 30;

int minHumidity = 50;
int maxHumidity = 60;

float previousTemperature = 25;
float previousHumidity = 55;

bool useBuzzer = false;

void setup_wifi()
{
    delay(10);
    Serial.println("Connecting to WiFi");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    espClient.setInsecure();
    Serial.println("Connected to WiFi");
}

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Attempting MQTT connection...");
        if (client.connect("ESP32Client", mqtt_user, mqtt_pass))
        {
            client.subscribe("esp32/settings/minBrightness");
            client.subscribe("esp32/settings/maxBrightness");
            client.subscribe("esp32/settings/minTemperature");
            client.subscribe("esp32/settings/maxTemperature");
            client.subscribe("esp32/settings/minHumidity");
            client.subscribe("esp32/settings/maxHumidity");
            client.subscribe("esp32/settings/useBuzzer");
            Serial.println("connected");
        }
        else
        {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            delay(5000);
        }
    }
}

void setup()
{
    analogReadResolution(12);
    pinMode(ledPin, OUTPUT);
    pinMode(buzzerPin, OUTPUT);
    dht.setup(dhtPin, DHTesp::DHT11);
    Serial.begin(115200);
    setup_wifi();
    client.setServer(mqtt_server, 8883);
    client.setCallback(callback);
}

void loop()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();

    int rawValue = analogRead(briPin);
    int invertedValue = 4095 - rawValue; // Invert because higher raw ADC means lower brightness sensor voltage
    float lumens = adcToLumens(invertedValue);

    char msg[50];
    snprintf(msg, 50, "%.2f", lumens);
    client.publish("esp32/brightness", msg);

    TempAndHumidity newValues = dht.getTempAndHumidity();
    if (dht.getStatus() == 0)
    {
        snprintf(msg, 50, "%.2f", newValues.temperature);
        client.publish("esp32/temperature", msg);
        previousTemperature = newValues.temperature;

        snprintf(msg, 50, "%.2f", newValues.humidity);
        previousHumidity = newValues.humidity;
        client.publish("esp32/humidity", msg);

        Serial.println(" Published. Temperature:" + String(newValues.temperature) +
                       " Humidity:" + String(newValues.humidity) + " Brightness: " + String(lumens));
        checkConditions(lumens, newValues.temperature, newValues.humidity);
    }
    else
    {
        Serial.println("DHT sensor not ready, skipping temperature/humidity publish.");
        Serial.println(" Published. Brightness: " + String(lumens));
        checkConditions(lumens, previousTemperature, previousHumidity);
    }

    delay(1500);
}

float adcToLumens(int adcVal)
{
    float normalized = (float)adcVal / 4095.0;
    return pow(normalized, 2.2) * 1000;
}

void checkConditions(float brightness, float temperature, float humidity)
{
    if (brightness >= minBrightness && brightness <= maxBrightness && temperature >= minTemperature && temperature <= maxTemperature && humidity >= minHumidity && humidity <= maxHumidity)
    {
        digitalWrite(ledPin, LOW);
    }
    else
    {
        digitalWrite(ledPin, HIGH);
        if (useBuzzer)
        {
            digitalWrite(buzzerPin, HIGH);
            delay(200);
            digitalWrite(buzzerPin, LOW);
        }
    }
}

void callback(char *topic, byte *payload, unsigned int length)
{
    String topicStr = String(topic);
    String message;
    for (int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }

    Serial.print("Message arrived [");
    Serial.print(topicStr);
    Serial.print("]: ");
    Serial.println(message);

    if (topicStr == "esp32/settings/useBuzzer")
    {
        useBuzzer = (message == "ON");
        Serial.print("Updated useBuzzer: ");
        Serial.println(useBuzzer ? "true" : "false");
    }

    int value = message.toInt();

    if (topicStr == "esp32/settings/minBrightness")
    {
        minBrightness = value;
        Serial.print("Updated minBrightness: ");
        Serial.println(minBrightness);
    }
    else if (topicStr == "esp32/settings/maxBrightness")
    {
        maxBrightness = value;
        Serial.print("Updated maxBrightness: ");
        Serial.println(maxBrightness);
    }
    else if (topicStr == "esp32/settings/minTemperature")
    {
        minTemperature = value;
        Serial.print("Updated minTemperature: ");
        Serial.println(minTemperature);
    }
    else if (topicStr == "esp32/settings/maxTemperature")
    {
        maxTemperature = value;
        Serial.print("Updated maxTemperature: ");
        Serial.println(maxTemperature);
    }
    else if (topicStr == "esp32/settings/minHumidity")
    {
        minHumidity = value;
        Serial.print("Updated minHumidity: ");
        Serial.println(minHumidity);
    }
    else if (topicStr == "esp32/settings/maxHumidity")
    {
        maxHumidity = value;
        Serial.print("Updated maxHumidity: ");
        Serial.println(maxHumidity);
    }
}
