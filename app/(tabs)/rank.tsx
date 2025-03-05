import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RankScreen() {
  return (
    <SafeAreaProvider>
      <View className="p-safe h-full">
        <View className="p-5">
          <Text className="text-lg font-bold text-white">Rank</Text>
        </View>
      </View>
    </SafeAreaProvider>
  );
}
