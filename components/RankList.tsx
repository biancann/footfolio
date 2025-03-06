import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { tokenURI, ownerOf, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { contract } from "@/constants/thirdweb";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface RankData {
  rank: number;
  address: string;
  totalDistance: number;
  totalPoints: number;
}

export function RankList() {
  const [ranks, setRanks] = useState<RankData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRanks() {
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
          .sort((a, b) => b.totalPoints - a.totalPoints);

        setRanks(sortedRanks);
      } catch (error) {
        console.error("Error fetching ranks:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRanks();
  }, []);

  const renderItem = ({ item }: { item: RankData }) => (
    <ThemedView className="p-4 mb-2 rounded-xl">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-4">
          <ThemedText className="text-lg font-bold">#{item.rank}</ThemedText>
          <ThemedText className="text-base">
            {item.address.slice(0, 6)}...{item.address.slice(-4)}
          </ThemedText>
        </View>
        <View className="flex-row space-x-4">
          <ThemedText className="text-base">{item.totalDistance.toFixed(2)} km</ThemedText>
          <ThemedText className="text-base font-bold">{item.totalPoints} pts</ThemedText>
        </View>
      </View>
    </ThemedView>
  );

  if (isLoading) {
    return (
      <ThemedView className="p-4 rounded-xl">
        <ThemedText>Loading ranks...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={ranks}
      renderItem={renderItem}
      keyExtractor={(item) => item.address}
      contentContainerClassName="p-4"
      showsVerticalScrollIndicator={false}
    />
  );
}
