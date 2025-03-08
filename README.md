![Banner](https://raw.githubusercontent.com/biancann/footfolio/refs/heads/main/assets/images/title.png)

# FootFolio - Transform Your Walks into NFT Art

FootFolio is an innovative mobile application that transforms your daily walks into unique digital artworks that you can mint as NFTs. By combining fitness tracking with blockchain technology, FootFolio encourages a healthier lifestyle while creating lasting memories of your journeys.

## Features

### 🚶‍♂️ Walk Tracking
- Real-time GPS tracking of your walking path
- Live path visualization on an interactive map

### 🎨 Art Generation
- Convert walking paths into beautiful digital art
- Multiple visualization styles
- Customizable path colors and backgrounds

### 🌟 NFT Creation
- Mint your walking path art as unique NFTs
- Include metadata such as:
  - Total distance covered
  - Duration of walk
  - Date and time
  - Achievement points
- View your NFT collection in-app

### 🏆 Achievements & Leaderboard
- Earn points for consistent walking
- Compare achievements with other users
- Track personal records and milestones
- View global leaderboard rankings

## Tech Stack

- **Frontend**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Blockchain**: Electroneum
- **Maps**: React Native Maps
- **Location**: Expo Location

## Prerequisites

Before you begin, ensure you have the following:
- Node.js (v16 or higher)
- Yarn package manager
- Expo CLI
- iOS Simulator or Android Emulator
- thirdweb API key
- Pinata IPFS account for NFT storage

## Installation

1. Clone the repository
```bash
git clone https://github.com/biancann/footfolio
cd footfolio
```

2. Install dependencies
```bash
yarn install
```

3. Environment Setup

Copy `.env.example` to `.env` and fill in the required values:
```env
EXPO_PUBLIC_THIRDWEB_CLIENT_ID=      # Your thirdweb client ID
EXPO_PUBLIC_PINATA_JWT=              # Pinata JWT for IPFS storage
EXPO_PUBLIC_PINATA_GATEWAY=          # Pinata gateway URL
EXPO_PUBLIC_CHAIN_ID=                # Blockchain network ID, 52014 for Electroneum Mainnet or 5201420 for Electroneum Testnet
EXPO_PUBLIC_CONTRACT_ADDRESS=        # NFT contract address
EXPO_PUBLIC_SECRET_TOKEN=            # Secret token for minting
EXPO_PUBLIC_RPC_URL=                 # RPC URL for the blockchain
```

4. Prebuild the native modules
```bash
npx expo prebuild
```

5. Start the development server
```bash
# For iOS
yarn ios

# For Android
yarn android
```

## Troubleshooting

### OpenSSL Error on Xcode 16

If using Xcode 16, you may encounter an OpenSSL error. To fix this:

1. Open `app.json`
2. Find the `ios` > `extraPods` section
3. Set `"version": "3.3.2000"` for the `OpenSSL-Universal` pod
4. Run `npx expo prebuild`
