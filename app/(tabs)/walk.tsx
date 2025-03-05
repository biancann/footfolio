import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function WalkScreen() {
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <View className="p-safe h-full">
        <View className="p-5">
          <Text className="text-lg font-bold text-white">Walk</Text>
        </View>
        <View className="flex-1 items-center justify-center px-5">
          <TouchableOpacity
            onPress={() => router.push("/walking")}
            className="bg-blue-500 px-8 py-4 rounded-full w-full"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Start Walking
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}
