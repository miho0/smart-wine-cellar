import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import MQTTService from "@/services/MQTTService";
import { fetchCurrentWeather } from "@/services/WeatherService";

type EnvironmentData = {
  temperature: string | null;
  humidity: string | null;
  brightness: string | null;
};

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState<EnvironmentData>({
    temperature: null,
    humidity: null,
    brightness: null,
  });

  const [outsideData, setOutsideData] = useState<EnvironmentData>({
    temperature: null,
    humidity: null,
    brightness: null,
  });

  useEffect(() => {
    MQTTService.connect(
      process.env.EXPO_PUBLIC_MQTT_USERNAME!,
      process.env.EXPO_PUBLIC_MQTT_PASSWORD!,
      {
        onTemperature(msg) {
          setSensorData((prev) => ({ ...prev, temperature: msg }));
        },
        onHumidity(msg) {
          setSensorData((prev) => ({ ...prev, humidity: msg }));
        },
        onBrightness(msg) {
          setSensorData((prev) => ({ ...prev, brightness: msg }));
        },
        onError(err) {
          console.error("MQTT error", err);
        },
      }
    );

    fetchCurrentWeather().then((data) => {
      if (data) {
        const { temperature, humidity, brightness } = data;
        setOutsideData({
          temperature: temperature.toFixed(1),
          humidity: humidity.toString(),
          brightness: brightness.toString(),
        });
      }
    });

    // TODO - odstrani te demo podatke
    const publishInterval = setInterval(() => {
      const randomTemp = (15 + Math.random() * 10).toFixed(1); // 15-25°C
      const randomHumidity = (40 + Math.random() * 30).toFixed(1); // 40-70%
      const randomBrightness = (50 + Math.random() * 1000).toFixed(0); // 50-1050 lux

      MQTTService.publish("esp32/sensors/temperature", randomTemp);
      MQTTService.publish("esp32/sensors/humidity", randomHumidity);
      MQTTService.publish("esp32/sensors/brightness", randomBrightness);
    }, 3000);

    return () => {
      clearInterval(publishInterval); // Počisti interval ob unmountu
      MQTTService.disconnect();
    };
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/index-hero.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Smart Wine Cellar</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Live Sensor Data:</ThemedText>
        <ThemedText>
          🌡 Temperature: {sensorData.temperature ?? "Loading..."}
        </ThemedText>
        <ThemedText>
          💧 Humidity: {sensorData.humidity ?? "Loading..."}
        </ThemedText>
        <ThemedText>
          💡 brightness: {sensorData.brightness ?? "Loading..."}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Live Outside Data:</ThemedText>
        <ThemedText>
          🌡 Temperature: {outsideData.temperature ?? "Loading..."}
        </ThemedText>
        <ThemedText>
          💧 Humidity: {outsideData.humidity ?? "Loading..."}
        </ThemedText>
        <ThemedText>
          💡 Brightness: {outsideData.brightness ?? "N/A"}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: "100%",
    width: "100%",
    position: "absolute",
    resizeMode: "cover",
  },
});
