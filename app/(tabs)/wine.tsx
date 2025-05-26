import { Collapsible } from "@/components/Collapsible";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import MQTTService from "@/services/MQTTService";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

type WeatherData = {
  temperature: number | null;
  humidity: number | null;
  brightness: number | null;
};

type WineConditions = {
  wineName: string;
  brightness: { min: number; max: number };
  humidity: { min: number; max: number };
  temperature: { min: number; max: number };
};

const defaultConditions: WineConditions = {
  wineName: "Merlot",
  brightness: { min: 100, max: 300 },
  humidity: { min: 50, max: 80 },
  temperature: { min: 10, max: 15 },
};

const MQTT_buzzer = (value: string) => {
  MQTTService.publish("esp32/settings/useBuzzer", value);
};

export default function WineScreen() {
  const wineName = defaultConditions.wineName;
  const [minBrightness, setMinBrightness] = useState(
    defaultConditions.brightness.min
  );
  const [maxBrightness, setMaxBrightness] = useState(
    defaultConditions.brightness.max
  );
  const [minHumidity, setMinHumidity] = useState(
    defaultConditions.humidity.min
  );
  const [maxHumidity, setMaxHumidity] = useState(
    defaultConditions.humidity.max
  );
  const [minTemperature, setMinTemperature] = useState(
    defaultConditions.temperature.min
  );
  const [maxTemperature, setMaxTemperature] = useState(
    defaultConditions.temperature.max
  );

  const [sensorData, setSensorData] = useState<WeatherData>({
    temperature: null,
    humidity: null,
    brightness: null,
  });

  // Publish the optimal conditions to MQTT broker
  // This function will be called when the user saves the conditions
  const MQTT_publish_conditions = () => {
    MQTTService.publish(
      "esp32/settings/maxBrightness",
      maxBrightness.toString()
    );
    MQTTService.publish(
      "esp32/settings/minBrightness",
      minBrightness.toString()
    );
    MQTTService.publish("esp32/settings/maxHumidity", maxHumidity.toString());
    MQTTService.publish("esp32/settings/minHumidity", minHumidity.toString());
    MQTTService.publish(
      "esp32/settings/maxTemperature",
      maxTemperature.toString()
    );
    MQTTService.publish(
      "esp32/settings/minTemperature",
      minTemperature.toString()
    );
  };

  useEffect(() => {
    MQTTService.connect(
      process.env.EXPO_PUBLIC_MQTT_USERNAME!,
      process.env.EXPO_PUBLIC_MQTT_PASSWORD!,
      {
        onTemperature: (msg) =>
          setSensorData((prev) => ({ ...prev, temperature: parseFloat(msg) })),
        onHumidity: (msg) =>
          setSensorData((prev) => ({ ...prev, humidity: parseFloat(msg) })),
        onBrightness: (msg) =>
          setSensorData((prev) => ({ ...prev, brightness: parseFloat(msg) })),
      }
    );

    return () => {
      MQTTService.disconnect();
    };
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <Image
          source={require("@/assets/images/wine.png")}
          style={styles.headerImage}
          contentFit="cover"
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{wineName}</ThemedText>
        <ThemedText style={styles.subTitle}>Red wine</ThemedText>
      </ThemedView>

      {/* SET OPTIMAL CONDITIONS */}
      <Collapsible title="Set optimal conditions">
        <ThemedText>
          Set the optimal conditions for your wine cellar to ensure best
          quality.
        </ThemedText>

        <ThemedText style={styles.label}>Brightness (lux)</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Min"
          keyboardType="numeric"
          value={minBrightness.toString()}
          onChangeText={(text) => setMinBrightness(Number(text))}
        />
        <TextInput
          style={styles.input}
          placeholder="Max"
          keyboardType="numeric"
          value={maxBrightness.toString()}
          onChangeText={(text) => setMaxBrightness(Number(text))}
        />

        <ThemedText style={styles.label}>Humidity (%)</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Min"
          keyboardType="numeric"
          value={minHumidity.toString()}
          onChangeText={(text) => setMinHumidity(Number(text))}
        />
        <TextInput
          style={styles.input}
          placeholder="Max"
          keyboardType="numeric"
          value={maxHumidity.toString()}
          onChangeText={(text) => setMaxHumidity(Number(text))}
        />

        <ThemedText style={styles.label}>Temperature (°C)</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Min"
          keyboardType="numeric"
          value={minTemperature.toString()}
          onChangeText={(text) => setMinTemperature(Number(text))}
        />
        <TextInput
          style={[styles.input, { marginBottom: 24 }]}
          placeholder="Max"
          keyboardType="numeric"
          value={maxTemperature.toString()}
          onChangeText={(text) => setMaxTemperature(Number(text))}
        />

        <Button title="Save Conditions" onPress={MQTT_publish_conditions} />
      </Collapsible>

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

      <Button title="Buzzer ON" onPress={() => MQTT_buzzer("ON")} />
      <Button title="Buzzer OFF" onPress={() => MQTT_buzzer("OFF")} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "column",
    gap: 4,
  },
  headerImage: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
  subTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    marginTop: 32,
  },
});
