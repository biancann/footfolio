import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useActiveAccount } from "thirdweb/react";
import { contract } from "@/constants/thirdweb";
import { tokensOfOwner, tokenURI } from "thirdweb/extensions/erc721";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface Stats {
  totalNFTs: number;
  totalDistance: number;
  totalPoints: number;
}

export function UserStats() {
  const account = useActiveAccount();
  const [stats, setStats] = useState<Stats>({
    totalNFTs: 0,
    totalDistance: 0,
    totalPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!account) {
        setIsLoading(false);
        return;
      }

      try {
        // Get all tokens owned by the user
        const tokens = await tokensOfOwner({
          contract,
          owner: account.address,
        });

        let totalDistance = 0;
        let totalPoints = 0;

        // Fetch metadata for each token
        for (const tokenId of tokens) {
          const uri = await tokenURI({
            contract,
            tokenId,
          });

          if (uri) {
            const response = await fetch(uri.replace("ipfs://", process.env.EXPO_PUBLIC_PINATA_GATEWAY + "/ipfs/"));
            const metadata = await response.json();

            // Extract distance and points from attributes
            const distanceAttr = metadata.attributes.find(
              (attr: any) => attr.trait_type === "Distance"
            );
            const pointsAttr = metadata.attributes.find(
              (attr: any) => attr.trait_type === "Points"
            );

            if (distanceAttr) {
              // Convert "X km" to number
              const distance = parseFloat(distanceAttr.value);
              totalDistance += distance;
            }

            if (pointsAttr) {
              totalPoints += parseInt(pointsAttr.value);
            }
          }
        }

        setStats({
          totalNFTs: tokens.length,
          totalDistance,
          totalPoints,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [account]);

  if (isLoading) {
    return (
      <ThemedView className="p-4 rounded-xl">
        <ThemedText>Loading stats...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="p-4 rounded-xl">
      <View className="space-y-4">
        <View className="flex-row justify-between items-center">
          <ThemedText className="text-lg">Total NFTs</ThemedText>
          <ThemedText className="text-xl font-bold">{stats.totalNFTs}</ThemedText>
        </View>
        <View className="flex-row justify-between items-center">
          <ThemedText className="text-lg">Total Distance</ThemedText>
          <ThemedText className="text-xl font-bold">{stats.totalDistance.toFixed(2)} km</ThemedText>
        </View>
        <View className="flex-row justify-between items-center">
          <ThemedText className="text-lg">Total Points</ThemedText>
          <ThemedText className="text-xl font-bold">{stats.totalPoints}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}
