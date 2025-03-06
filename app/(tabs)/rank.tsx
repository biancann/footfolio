import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RankList } from "@/components/RankList";

export default function RankScreen() {
  return (
    <SafeAreaProvider>
      <View className="p-safe h-full">
        <View className="p-5">
          <Text className="text-2xl font-bold text-white">Leaderboard</Text>
        </View>
        <RankList />
      </View>
    </SafeAreaProvider>
  );
}
