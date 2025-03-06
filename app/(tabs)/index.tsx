import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { UserStats } from "@/components/UserStats";

export default function HomeScreen() {
  return (
    <SafeAreaProvider>
      <View className="p-safe h-full">
        <View className="p-5">
          <ThemedText className="text-2xl font-bold text-white">Welcome</ThemedText>
        </View>
        <View className="px-5">
          <UserStats />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
