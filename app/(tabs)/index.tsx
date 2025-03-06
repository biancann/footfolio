import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserStats } from "@/components/UserStats";

export default function HomeScreen() {
  return (
    <SafeAreaProvider>
      <View className="p-safe h-full">
        <View className="p-5">
          <Text className="text-2xl font-bold text-white">Welcome</Text>
        </View>
        <View className="px-5">
          <UserStats />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
