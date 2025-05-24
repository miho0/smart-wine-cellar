import mqtt, { IClientOptions, MqttClient } from "mqtt";

class MQTTService {
  private client: MqttClient | null = null;
  private isConnected = false;

  private defaultTopics = {
    temperature: "esp32/sensors/temperature",
    humidity: "esp32/sensors/humidity",
    brightness: "esp32/sensors/brightness",
    control: "esp32/control/#",
  };

  private brokerUrl =
    "wss://fb18f775ad6a416da588f836c40332b4.s2.eu.hivemq.cloud:8884/mqtt";

  connect = (
    username: string,
    password: string,
    messageHandlers: {
      onMessage?: (topic: string, message: string) => void;
      onTemperature?: (message: string) => void;
      onHumidity?: (message: string) => void;
      onBrightness?: (message: string) => void;
      onControl?: (topic: string, message: string) => void;
      onConnect?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    const connectionOptions: IClientOptions = {
      username: username,
      password: password,
      clientId: `expo_${Math.random().toString(16).slice(2, 8)}`,
      protocol: "wss",
      reconnectPeriod: 1000,
      connectTimeout: 8 * 1000, // 8 seconds
      clean: true,
    };

    console.log("Connecting to MQTT broker with options:", {
      ...connectionOptions,
      password: "***",
    });

    this.client = mqtt.connect(this.brokerUrl, connectionOptions);

    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("MQTT connected");

      this.subscribeToDefaultTopics();
      messageHandlers.onConnect?.();
    });

    this.client.on("error", (err) => {
      console.error("MQTT error:", err);
      this.isConnected = false;
      messageHandlers.onError?.(err);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      console.log("MQTT connection closed");
    });

    this.client.on("message", (topic, messageBuffer) => {
      const message = messageBuffer.toString();
      console.log(`Message on ${topic}: ${message}`);

      messageHandlers.onMessage?.(topic, message);

      switch (topic) {
        case this.defaultTopics.temperature:
          messageHandlers.onTemperature?.(message);
          break;
        case this.defaultTopics.humidity:
          messageHandlers.onHumidity?.(message);
          break;
        case this.defaultTopics.brightness:
          messageHandlers.onBrightness?.(message);
          break;
        default:
          if (topic.startsWith("esp32/control/")) {
            messageHandlers.onControl?.(topic, message);
          }
          break;
      }
    });
  };

  private subscribeToDefaultTopics = () => {
    if (!this.client) return;

    const topics = Object.values(this.defaultTopics);
    this.client.subscribe(topics, (err) => {
      if (err) console.error("Default subscription error:", err);
      else console.log("Subscribed to topics:", topics);
    });
  };

  sebscribe = (topic: string) => {
    if (!this.client) return;
    this.client.subscribe(topic, (err) => {
      if (err) console.error(`Subscription to ${topic} failed:`, err);
      else console.log(`Subscribed to ${topic}`);
    });
  };

  publish = (topic: string, message: string) => {
    if (!this.client || !this.isConnected) {
      console.warn("Client not connected");
      return;
    }
    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) console.error("Publish error:", err);
      else console.log(`Published to ${topic}: ${message}`);
    });
  };

  disconnect = () => {
    this.client?.end();
    this.isConnected = false;
    console.log("Disconnected from MQTT broker");
  };

  getConnectionStatus = () => this.isConnected;
}

export default new MQTTService();
