import { NFT, Stats } from "@/utils/types";
import React, { useEffect, useState } from "react";
import { View, Image, Text, ScrollView, RefreshControl, TouchableOpacity, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { tokensOfOwner, tokenURI } from "thirdweb/extensions/erc721";
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { client, contract } from "@/constants/thirdweb";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder'
import { LinearGradient } from 'expo-linear-gradient';
import { createWallet } from "thirdweb/wallets";
import { defineChain } from "thirdweb";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient)
const chainId = parseInt(process.env.EXPO_PUBLIC_CONTRACT_ADDRESS!, 10);
const wallets = [
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
  createWallet("com.trustwallet.app"),
];

export default function ProfileScreen() {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalNFTs: 0,
    totalDistance: 0,
    totalPoints: 0,
  });
  const router = useRouter();

  const fetchStats = async () => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
            (attr: { trait_type: string; value: string }) => attr.trait_type === "Distance"
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [account]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  return (
    <SafeAreaProvider>
      <ScrollView
        className="h-full bg-dark"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={["#ffd772"]}
            progressBackgroundColor="#1d3f50"
          />
        }
      >
        <View className="p-safe">
          <View className="px-5 mb-5">
            <Text className="text-2xl font-bold text-white">Profile</Text>
          </View>

          <View className="px-5 mb-4">
            <View className="flex flex-row items-center mb-4">
              <Image
                source={{ uri: `https://api.dicebear.com/9.x/thumbs/png?seed=${account?.address}&size=128&shapeColor=fff9eb,ffd772&&backgroundColor=1d3f50` }}
                className="w-20 h-20 rounded-full bg-gray-800"
              />
              <View className="ml-4 flex-1">
                <View className="flex flex-row items-center gap-5">
                  <View>
                    <ShimmerPlaceholder visible={!isLoading} width={60} height={25} shimmerColors={["#001a26", "#1d3f50", "#355e75"]}>
                      <Text className="font-bold text-xl text-white">{stats.totalNFTs}</Text>
                    </ShimmerPlaceholder>
                    <Text className="text-white/50 text-sm">Total NFTs</Text>
                  </View>
                  <View>
                    <ShimmerPlaceholder visible={!isLoading} width={60} height={25} shimmerColors={["#001a26", "#1d3f50", "#355e75"]}>
                      <Text className="font-bold text-xl text-white">{parseFloat(stats.totalDistance.toFixed(2))} km</Text>
                    </ShimmerPlaceholder>
                    <Text className="text-white/50 text-sm">Total Distance</Text>
                  </View>
                  <View>
                    <ShimmerPlaceholder visible={!isLoading} width={60} height={25} shimmerColors={["#001a26", "#1d3f50", "#355e75"]}>
                      <Text className="font-bold text-xl text-white">{stats.totalPoints}</Text>
                    </ShimmerPlaceholder>
                    <Text className="text-white/50 text-sm">Total Points</Text>
                  </View>
                </View>
              </View>
            </View>
            <ConnectButton
              client={client}
              theme={darkTheme({
                colors: {
                  primaryButtonBg: "#0f2d3c",
                  primaryButtonText: "#fff9eb",
                  modalBg: "#0f2d3c",
                },
              })}
              wallets={wallets}
              chain={defineChain({
                id: chainId,
                rpc: process.env.EXPO_PUBLIC_RPC_URL,
                nativeCurrency: {
                  name: "Electroneum",
                  symbol: "ETN",
                }
              })}
            />
          </View>

          <View className="px-5 pb-5">
            {nfts.length === 0 ? (
              <View className="bg-dark-800/50 backdrop-blur-md p-8 rounded-xl items-center">
                <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.5)" />
                <Text className="text-white/50 text-base mt-3 text-center">No NFTs in your collection yet.{"\n"}Start walking to earn your first NFT!</Text>
                <TouchableOpacity
                  onPress={() => router.push("/walking")}
                  className="mt-4 bg-primary-600 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Start Walking</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex flex-row flex-wrap -mx-1">
                {nfts.map((n) => (
                  <TouchableOpacity
                    key={n.tokenId}
                    className="w-1/3 aspect-square p-1"
                    onPress={() => {
                      const url = `https://blockexplorer.electroneum.com/token/${contract.address}/instance/${n.tokenId}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Image
                      source={{ uri: n.image }}
                      className="rounded-lg w-full h-full border border-white/10"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
}
