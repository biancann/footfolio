import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const clientId = process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID!;
const chainId = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID!, 10);
const contractAddress = process.env.EXPO_PUBLIC_CONTRACT_ADDRESS!;

if (!clientId) {
  throw new Error(
    "Missing EXPO_PUBLIC_THIRDWEB_CLIENT_ID - make sure to set it in your .env file"
  );
}

if (!contractAddress) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONTRACT_ADDRESS - make sure to set it in your .env file"
  );
}

export const client = createThirdwebClient({
  clientId,
});

export const contract = getContract({
  client,
  address: contractAddress,
  chain: defineChain({
    id: chainId,
    rpc: process.env.EXPO_PUBLIC_RPC_URL,
    nativeCurrency: {
      name: "Electroneum",
      symbol: "ETN",
    }
  }),
});
