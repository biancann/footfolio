import React, { useEffect, useState } from "react";
import { Image, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { useActiveAccount } from "thirdweb/react";
import { contract } from "@/constants/thirdweb";
import { tokensOfOwner, tokenURI, ownerOf, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface Stats {
  totalNFTs: number;
  totalDistance: number;
  totalPoints: number;
}

interface RecentActivity {
  tokenId: number;
  name: string;
  image: string;
  distance: number;
  date: string;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalDistance: number;
  totalPoints: number;
}

export default function HomeScreen() {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalNFTs: 0,
    totalDistance: 0,
    totalPoints: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topLeaderboard, setTopLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async () => {
    try {
      // Get total supply
      const supply = await nextTokenIdToMint({
        contract,
      });

      // Create a map to store owner stats
      const ownerStats = new Map<string, { distance: number; points: number }>();

      // Loop through all tokens
      for (let i = 0; i < supply; i++) {
        const tokenId = BigInt(i);

        // Get token URI and owner
        const [uri, owner] = await Promise.all([
          tokenURI({
            contract,
            tokenId,
          }),
          ownerOf({
            contract,
            tokenId,
          }),
        ]);

        if (uri && uri !== "testing") {
          const response = await fetch(uri.replace("ipfs://", process.env.EXPO_PUBLIC_PINATA_GATEWAY + "/ipfs/"));
          const metadata = await response.json();

          // Extract distance and points from attributes
          const distanceAttr = metadata.attributes.find(
            (attr: any) => attr.trait_type === "Distance"
          );
          const pointsAttr = metadata.attributes.find(
            (attr: any) => attr.trait_type === "Points"
          );

          const distance = distanceAttr ? parseFloat(distanceAttr.value) : 0;
          const points = pointsAttr ? parseInt(pointsAttr.value) : 0;

          // Update owner stats
          const currentStats = ownerStats.get(owner) || { distance: 0, points: 0 };
          ownerStats.set(owner, {
            distance: currentStats.distance + distance,
            points: currentStats.points + points,
          });
        }
      }

      // Convert map to array and sort by points
      const sortedRanks = Array.from(ownerStats.entries())
        .map(([address, stats], index) => ({
          rank: index + 1,
          address,
          totalDistance: stats.distance,
          totalPoints: stats.points,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 5); // Get top 5

      setTopLeaderboard(sortedRanks);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const fetchStats = async () => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const tokens = await tokensOfOwner({
        contract,
        owner: account.address,
      });

      let totalDistance = 0;
      let totalPoints = 0;
      const activities: RecentActivity[] = [];

      for (const tokenId of tokens) {
        const uri = await tokenURI({
          contract,
          tokenId,
        });

        if (uri) {
          const response = await fetch(uri.replace("ipfs://", process.env.EXPO_PUBLIC_PINATA_GATEWAY + "/ipfs/"));
          const metadata = await response.json();

          const distanceAttr = metadata.attributes.find(
            (attr: any) => attr.trait_type === "Distance"
          );
          const pointsAttr = metadata.attributes.find(
            (attr: any) => attr.trait_type === "Points"
          );

          if (distanceAttr) {
            const distance = parseFloat(distanceAttr.value);
            totalDistance += distance;
          }

          if (pointsAttr) {
            totalPoints += parseInt(pointsAttr.value);
          }

          // Add to recent activities
          activities.push({
            tokenId: Number(tokenId),
            name: metadata.name,
            image: metadata.image.replace("ipfs://", process.env.EXPO_PUBLIC_PINATA_GATEWAY + "/ipfs/"),
            distance: distanceAttr ? parseFloat(distanceAttr.value) : 0,
            date: new Date().toLocaleDateString(),
          });
        }
      }

      setStats({
        totalNFTs: tokens.length,
        totalDistance,
        totalPoints,
      });

      // Sort activities by date and take the most recent 3
      setRecentActivities(activities.sort((a, b) => b.tokenId - a.tokenId).slice(0, 3));
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
  }, [account]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#0f2d3c", dark: "#0f2d3c" }}
      headerImage={
        <Image
          source={require("@/assets/images/jogging.jpg")}
          className="h-full w-full absolute bottom-0 left-0"
        />
      }
    >
      <View className="w-full h-full p-5 bg-dark">
        <Text className="text-2xl font-bold text-white mb-6">Welcome</Text>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-dark-800/50 backdrop-blur-md p-4 rounded-xl flex-1 mr-2">
            <ShimmerPlaceholder visible={!isLoading} width={60} height={25} shimmerColors={["#001a26", "#1d3f50", "#355e75"]}>
              <Text className="font-bold text-xl text-white">{stats.totalNFTs}</Text>
            </ShimmerPlaceholder>
            <Text className="text-white/50 text-sm">Total NFTs</Text>
          </View>
          <View className="bg-dark-800/50 backdrop-blur-md p-4 rounded-xl flex-1 mx-2">
            <ShimmerPlaceholder visible={!isLoading} width={60} height={25} shimmerColors={["#001a26", "#1d3f50", "#355e75"]}>
              <Text className="font-bold text-xl text-white">{parseFloat(stats.totalDistance.toFixed(2))} km</Text>
            </ShimmerPlaceholder>
            <Text className="text-white/50 text-sm">Total Distance</Text>
          </View>
          <View className="bg-dark-800/50 backdrop-blur-md p-4 rounded-xl flex-1 ml-2">
            <ShimmerPlaceholder visible={!isLoading} width={60} height={25} shimmerColors={["#001a26", "#1d3f50", "#355e75"]}>
              <Text className="font-bold text-xl text-white">{stats.totalPoints}</Text>
            </ShimmerPlaceholder>
            <Text className="text-white/50 text-sm">Total Points</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.push("/walking")}
            className="bg-primary-600 p-4 rounded-xl flex-1 mr-2 items-center"
          >
            <Ionicons name="walk" size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Start Walking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            className="bg-dark-800/50 backdrop-blur-md p-4 rounded-xl flex-1 ml-2 items-center"
          >
            <Ionicons name="person" size={24} color="white" />
            <Text className="text-white font-semibold mt-2">View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activities */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-white mb-4">Recent Activities</Text>
          {recentActivities.length === 0 ? (
            <View className="bg-dark-800/50 backdrop-blur-md p-6 rounded-xl items-center">
              <Ionicons name="walk-outline" size={48} color="rgba(255,255,255,0.5)" />
              <Text className="text-white/50 text-base mt-2 text-center">No activities yet.{"\n"}Start walking to earn your first NFT!</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.tokenId}
                  className="bg-dark-800/50 backdrop-blur-md p-4 rounded-xl mr-4 w-40"
                  onPress={() => router.push("/profile")}
                >
                  <Image
                    source={{ uri: activity.image }}
                    className="w-full h-32 rounded-lg mb-2"
                  />
                  <Text className="text-white font-semibold">{activity.name}</Text>
                  <Text className="text-white/50 text-sm">{activity.distance.toFixed(2)} km</Text>
                  <Text className="text-white/50 text-sm">{activity.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Leaderboard Preview */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-white">Top 5 Leaderboard</Text>
            <TouchableOpacity onPress={() => router.push("/rank")}>
              <Text className="text-primary-400">View All</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-dark-800/50 backdrop-blur-md p-4 rounded-xl">
            {topLeaderboard.map((entry) => (
              <View key={entry.address} className="flex-row items-center mb-3 last:mb-0">
                <Text className="text-2xl font-bold text-primary-400 w-8">{entry.rank}</Text>
                <View className="flex-row items-center flex-1 bg-dark-700/50 rounded-full pl-3 pr-5 py-2">
                  <Image
                    source={{ uri: `https://api.dicebear.com/9.x/thumbs/png?seed=${entry.address}&size=128&shapeColor=fff9eb,ffd772,f98b07&backgroundColor=1d3f50` }}
                    className="w-8 h-8 rounded-full bg-gray-800"
                  />
                  <Text className="text-white ml-3 flex-1">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </Text>
                  <Text className="text-white font-bold">{entry.totalPoints} pts</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ParallaxScrollView>
  );
}
