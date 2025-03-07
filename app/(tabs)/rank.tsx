import React from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RankList } from "@/components/RankList";

export default function RankScreen() {
  return (
    <SafeAreaProvider>
      <View className="p-safe h-full bg-dark">
        <View className="px-5 pb-5 mb-2">
          <Text className="text-2xl font-bold text-white">Leaderboard</Text>
          <Text className="text-white/60 mt-2">
            Compare your walking achievements and NFT collection with other walkers.
          </Text>
        </View>
        <RankList />
      </View>
    </SafeAreaProvider>
  );
}
