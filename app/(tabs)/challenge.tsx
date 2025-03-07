import React from "react";
import { View, Text, Image } from "react-native";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";

export default function ChallengeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#0f2d3c", dark: "#0f2d3c" }}
      headerImage={
        <Image
          source={require("@/assets/images/people-jogging.jpg")}
          className="h-full w-full absolute bottom-0 left-0"
        />
      }
    >
      <View className="w-full h-full p-5 bg-dark">
        <Text className="text-2xl font-bold text-white mb-6">Challenges</Text>

        {/* Introduction */}
        <View className="bg-dark-800/50 backdrop-blur-md p-6 rounded-xl mb-6">
          <Text className="text-white text-lg mb-4">
            Welcome to FootFolio Challenges! Here's where you can push your walking goals to new heights and earn exclusive rewards.
          </Text>
          <Text className="text-white/80 mb-4">
            Coming soon, you'll be able to participate in various exciting challenges:
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Text className="text-primary-400 mr-2">•</Text>
              <Text className="text-white/80 flex-1">Distance-based challenges to achieve specific walking goals</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary-400 mr-2">•</Text>
              <Text className="text-white/80 flex-1">Streak challenges to maintain consistent walking habits</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary-400 mr-2">•</Text>
              <Text className="text-white/80 flex-1">Community challenges where you can compete with other walkers</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary-400 mr-2">•</Text>
              <Text className="text-white/80 flex-1">Special event challenges with unique rewards and achievements</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary-400 mr-2">•</Text>
              <Text className="text-white/80 flex-1">Achievement-based challenges to unlock special walking patterns</Text>
            </View>
          </View>
        </View>

        {/* Coming Soon Message */}
        <View className="bg-dark-800/50 backdrop-blur-md p-6 rounded-xl">
          <Text className="text-white text-center text-lg">
            Stay tuned! We're working on bringing these exciting challenges to you soon.
          </Text>
        </View>
      </View>
    </ParallaxScrollView>
  );
}
