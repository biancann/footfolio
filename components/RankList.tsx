import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Image } from "react-native";
import { tokenURI, ownerOf, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { contract } from "@/constants/thirdweb";

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
    <View className="flex-row justify-between items-center">
      <Text className="text-2xl font-bold text-primary shrink-0 w-10">{item.rank}</Text>
      <View className="flex-row items-center gap-4 bg-dark-800 flex-1 rounded-full pl-3 pr-5 py-2 border border-dark-700">
        <Image
          source={{ uri: `https://api.dicebear.com/9.x/thumbs/png?seed=${item.address}&size=128&shapeColor=fff9eb,ffd772,f98b07&backgroundColor=1d3f50` }}
          className="w-10 h-10 rounded-full bg-gray-800 shrink-0"
        />
        <Text className="text-base text-white flex-1">
          {item.address.slice(0, 6)}...{item.address.slice(-4)}
        </Text>
        <Text className="text-base font-bold text-white shrink-0">{item.totalPoints} pts</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={ranks}
      renderItem={renderItem}
      keyExtractor={(item) => item.address}
      contentContainerClassName="px-5"
      showsVerticalScrollIndicator={false}
    />
  );
}
