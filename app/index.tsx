import { client } from "@/constants/thirdweb";
import React, { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { defineChain } from "thirdweb";
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { router } from "expo-router";

const wallets = [
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
  createWallet("com.trustwallet.app"),
];

const chainId = parseInt(process.env.EXPO_PUBLIC_CONTRACT_ADDRESS!, 10);

export default function WelcomeScreen() {
  const account = useActiveAccount();

  useEffect(() => {
    if (account) {
      router.replace("/(tabs)");
    }

    // For development purposes
    // setTimeout(() => {
    //   router.replace("/(tabs)");
    // }, 600);
  }, [account]);

  return (
    <View className="bg-dark p-safe h-full flex flex-col items-center justify-center">
      <View className="p-5">
        <Image
          source={require("@/assets/images/designer.png")}
          className="w-80 h-64 mx-auto mb-10"
        />
        <Text className="text-5xl font-bold mb-3 text-white text-center">Transform Your Journey into NFT</Text>
        <Text className="text-base text-white/70 text-center mb-10">FootFolio transforms your daily walks into unique digital artworks that you can mint as NFTs, making every step part of your creative journey</Text>
        <ConnectButton
          client={client}
          theme={darkTheme({
            colors: {
              primaryButtonBg: "#ffd772",
              primaryButtonText: "#001a26",
              modalBg: "#0f2d3c",
            },
          })}
          wallets={wallets}
          chain={defineChain(chainId)}
        />
      </View>
    </View>
  );
}
