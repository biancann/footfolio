import { NFT, Stats } from "@/utils/types";
import React, { useEffect, useState } from "react";
import { View, Image, Text, ScrollView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { tokensOfOwner, tokenURI } from "thirdweb/extensions/erc721";
import { useActiveAccount } from "thirdweb/react";
import { contract } from "@/constants/thirdweb";

export default function ProfileScreen() {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalNFTs: 0,
    totalDistance: 0,
    totalPoints: 0,
  });

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
        const newNfts: NFT[] = [];
        // Fetch metadata for each token
        for (const tokenId of tokens) {
          const uri = await tokenURI({
            contract,
            tokenId,
          });

          if (uri) {
            const response = await fetch(uri.replace("ipfs://", process.env.EXPO_PUBLIC_PINATA_GATEWAY + "/ipfs/"));
            const metadata = await response.json();
            newNfts.push({
              tokenId: Number(tokenId), // Convert bigint to number
              name: metadata.name,
              description: metadata.description,
              image: metadata.image.replace("ipfs://", process.env.EXPO_PUBLIC_PINATA_GATEWAY + "/ipfs/"),
              attributes: undefined,
            });
            // Extract distance and points from attributes
            const distanceAttr = metadata.attributes.find(
              (attr: {trait_type: string; value: string}) => attr.trait_type === "Distance"
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

        setNfts(newNfts);
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

  return (
    <SafeAreaProvider>
      <ScrollView className="h-full">
        <View className="p-safe">
          <View className="px-5 mb-5">
            <Text className="text-2xl font-bold text-white">Profile</Text>
          </View>

          <View className="px-5 mb-2">
            <View className="flex flex-row items-center mb-6">
              <Image
                source={{ uri: "https://avatars.githubusercontent.com/u/124599?v=4" }}
                className="w-20 h-20 rounded-full bg-gray-800"
              />
              <View className="ml-4 flex-1">
                <Text className="text-lg text-primary font-bold mb-2">
                  {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Not connected"}
                </Text>
                <View className="flex flex-row items-center gap-5">
                  <View>
                    <Text className="font-bold text-xl text-white">{stats.totalNFTs}</Text>
                    <Text className="text-white/50 text-sm">Total NFTs</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-xl text-white">{parseFloat(stats.totalDistance.toFixed(2))} km</Text>
                    <Text className="text-white/50 text-sm">Total Distance</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-xl text-white">{stats.totalPoints}</Text>
                    <Text className="text-white/50 text-sm">Total Points</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="px-5 pb-5">
            <View className="flex flex-row flex-wrap -mx-1">
              {nfts.map((n) => (
                <View className="w-1/3 aspect-square p-1" key={n.tokenId}>
                  <Image
                    source={{ uri: n.image }}
                    className="rounded-lg w-full h-full"
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}
