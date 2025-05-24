import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import MQTTService from "@/services/MQTTService";
import {
  fetchCurrentWeather,
  fetchWeatherForecast,
} from "@/services/WeatherService";

type WeatherData = {
  temperature: number | null;
  humidity: number | null;
  brightness: number | null;
};

type ForecastEntry = {
  time: string;
  temperature: number;
  humidity: number;
  brightness: number;
};

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState<WeatherData>({
    temperature: null,
    humidity: null,
    brightness: null,
  });

  const [outsideData, setOutsideData] = useState<WeatherData>({
    temperature: null,
    humidity: null,
    brightness: null,
  });

  const [forecastData, setForecastData] = useState<ForecastEntry[]>([]);

  useEffect(() => {
    MQTTService.connect(
      process.env.EXPO_PUBLIC_MQTT_USERNAME!,
      process.env.EXPO_PUBLIC_MQTT_PASSWORD!,
      {
        onTemperature(msg) {
          setSensorData((prev) => ({ ...prev, temperature: parseFloat(msg) }));
        },
        onHumidity(msg) {
          setSensorData((prev) => ({ ...prev, humidity: parseFloat(msg) }));
        },
        onBrightness(msg) {
          setSensorData((prev) => ({ ...prev, brightness: parseFloat(msg) }));
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
          temperature: temperature,
          humidity: humidity,
          brightness: brightness,
        });
      }
    });

    // TODO - odstrani te demo podatke
    // const publishInterval = setInterval(() => {
    //   const randomTemp = (15 + Math.random() * 10).toFixed(1); // 15-25°C
    //   const randomHumidity = (40 + Math.random() * 30).toFixed(1); // 40-70%
    //   const randomBrightness = (50 + Math.random() * 1000).toFixed(0); // 50-1050 lux

    //   MQTTService.publish("esp32/temperature", randomTemp);
    //   MQTTService.publish("esp32/humidity", randomHumidity);
    //   MQTTService.publish("esp32/brightness", randomBrightness);
    // }, 3000);

    return () => {
      // clearInterval(publishInterval); // Počisti interval ob unmountu
      MQTTService.disconnect();
    };
  }, []);

  const handleFetchCurrent = async () => {
    const data = await fetchCurrentWeather();
    if (data) {
      setOutsideData({
        temperature: data.temperature,
        humidity: data.humidity,
        brightness: data.brightness,
      });
    } else {
      Alert.alert("Error", "Failed to fetch current weather.");
    }
  };

  const handleFetchForecast = async () => {
    const forecast = await fetchWeatherForecast();
    if (forecast) {
      setForecastData(forecast);
    } else {
      Alert.alert("Error", "Failed to fetch forecast.");
    }
  };

  const renderForecastItem = ({ item }: { item: ForecastEntry }) => (
    <View style={styles.forecastRow}>
      <ThemedText style={styles.forecastCell}>{item.time}</ThemedText>
      <ThemedText style={styles.forecastCell}>
        {item.temperature.toFixed(1)}°C
      </ThemedText>
      <ThemedText style={styles.forecastCell}>{item.humidity}%</ThemedText>
      <ThemedText style={styles.forecastCell}>{item.brightness} lx</ThemedText>
    </View>
  );

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

      {/* LIVE SENSOR DATA */}
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

      {/* OUTSIDE WEATHER DATA */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Live Outside Data:</ThemedText>
        <Button title="Get Current Weather" onPress={handleFetchCurrent} />
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

      {/* FORECAST TABLE */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Forecast Table:</ThemedText>
        <Button title="Get Forecast" onPress={handleFetchForecast} />
        {forecastData.length > 0 && (
          <>
            <View style={styles.forecastHeader}>
              <ThemedText style={styles.forecastCell}>Time</ThemedText>
              <ThemedText style={styles.forecastCell}>Temp</ThemedText>
              <ThemedText style={styles.forecastCell}>Humidity</ThemedText>
              <ThemedText style={styles.forecastCell}>Brightness</ThemedText>
            </View>
            <FlatList
              data={forecastData}
              renderItem={renderForecastItem}
              keyExtractor={(_, index) => index.toString()}
            />
          </>
        )}
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
  forecastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ddd",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  forecastCell: {
    flex: 1,
    textAlign: "center",
  },
});
