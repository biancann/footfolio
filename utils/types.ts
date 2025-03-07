export interface Stats {
    totalNFTs: number;
    totalDistance: number;
    totalPoints: number;
}

export interface NFT {
    tokenId: number | null;
    name: string;
    description: string;
    image: string;
    attributes: {
        trait_type: string;
        value: string;
    }[] | undefined;
}
