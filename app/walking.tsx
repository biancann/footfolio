import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { contract } from "@/constants/thirdweb";
import ViewShot from "react-native-view-shot";
import { prepareContractCall } from "thirdweb";

interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export default function WalkingScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [pathColor, setPathColor] = useState("#00ff00"); // Default green color
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const mapRef = useRef<MapView>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const account = useActiveAccount();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const [previewRegion, setPreviewRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  // Request location permissions and get initial location
  useEffect(() => {
    (async () => {
      try {
        // First, check if location services are enabled
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setErrorMsg("Location services are disabled. Please enable them in your device settings.");
          return;
        }

        // Then request permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        // Get initial location with high accuracy
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        console.log("Initial location:", location);
        setLocation(location);
      } catch (error) {
        console.error("Error getting location:", error);
        setErrorMsg("Error getting location. Please try again.");
      }
    })();

    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Toggle tracking
  const toggleTracking = async () => {
    if (!isTracking) {
      // Start tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const newCoordinate: Coordinate = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            timestamp: newLocation.timestamp,
          };

          setCoordinates((prevCoordinates) => {
            if (prevCoordinates.length > 0) {
              const lastCoord = prevCoordinates[prevCoordinates.length - 1];
              const distance = calculateDistance(
                lastCoord.latitude,
                lastCoord.longitude,
                newCoordinate.latitude,
                newCoordinate.longitude
              );
              setTotalDistance((prev) => prev + distance);
            }
            return [...prevCoordinates, newCoordinate];
          });

          // Center map on new location
          mapRef.current?.animateToRegion({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      );

      locationSubscription.current = subscription;
    } else {
      // Stop tracking and show preview
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      await capturePreview();
    }

    setIsTracking(!isTracking);
  };

  // Capture preview of the walking path
  const capturePreview = async () => {
    if (viewShotRef.current?.capture) {
      try {
        // Get the current map region
        const region = await new Promise<{
          latitude: number;
          longitude: number;
          latitudeDelta: number;
          longitudeDelta: number;
        }>((resolve) => {
          if (mapRef.current) {
            // Use the last known coordinates or current location
            const lastCoord = coordinates[coordinates.length - 1];
            resolve({
              latitude: lastCoord?.latitude || location?.coords.latitude || 0,
              longitude: lastCoord?.longitude || location?.coords.longitude || 0,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          } else {
            resolve({
              latitude: location?.coords.latitude || 0,
              longitude: location?.coords.longitude || 0,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        });

        // Update the preview map region
        setPreviewRegion(region);

        // Wait for the map to render
        await new Promise(resolve => setTimeout(resolve, 500));

        const uri = await viewShotRef.current.capture();
        console.log("Captured preview URI:", uri);
        setPreviewUri(uri);
        setShowPreview(true);
      } catch (error) {
        console.error("Error capturing preview:", error);
      }
    }
  };

  // Upload image to IPFS
  const uploadToIPFS = async (uri: string) => {
    try {
      const pinataJWT = process.env.EXPO_PUBLIC_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error("Pinata JWT token is not configured");
      }

      // Create form data with the correct content type
      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: "image/png",
        name: "walking-path.png",
      } as any);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pinataJWT}`,
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Pinata API error:", errorText);
        throw new Error(`Failed to upload to IPFS: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  };

  // Upload metadata to IPFS
  const uploadMetadataToIPFS = async (metadata: any) => {
    try {
      const pinataJWT = process.env.EXPO_PUBLIC_PINATA_JWT;
      if (!pinataJWT) {
        throw new Error("Pinata JWT token is not configured");
      }

      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pinataJWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Pinata API error:", errorText);
        throw new Error(`Failed to upload metadata to IPFS: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading metadata to IPFS:", error);
      throw error;
    }
  };

  // Mint NFT
  const mintNFT = async () => {
    if (!previewUri || !account) {
      console.error("Cannot mint: No preview URI or no account connected");
      return;
    }

    try {
      setIsMinting(true);

      // Upload image to IPFS
      const imageUri = await uploadToIPFS(previewUri);

      // Create metadata
      const metadata = {
        name: "FootFolio",
        description: `A unique walking path art created on ${new Date().toLocaleDateString()}`,
        image: imageUri,
        attributes: [
          {
            trait_type: "Distance",
            value: `${(totalDistance / 1000).toFixed(2)} km`,
          },
          {
            trait_type: "Duration",
            value: `${Math.round((coordinates[coordinates.length - 1].timestamp - coordinates[0].timestamp) / 1000)} seconds`,
          },
          {
            trait_type: "Points",
            value: coordinates.length.toString(),
          },
        ],
      };

      // Upload metadata to IPFS
      const metadataUri = await uploadMetadataToIPFS(metadata);

      const transaction = prepareContractCall({
        contract,
        method: "function mint(string token, string tokenURI)",
        params: [process.env.EXPO_PUBLIC_SECRET_TOKEN!, metadataUri],
      });
      await sendTransaction(transaction);
      setShowPreview(false);
      console.log("Successfully minted NFT");
    } catch (error) {
      console.error("Error minting NFT:", error);
    } finally {
      setIsMinting(false);
    }
  };

  // Available path colors
  const colors = ["#00ff00", "#ff0000", "#0000ff", "#ffff00", "#ff00ff"];

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-dark">
        {location ? (
          <>
            {/* Main Map View */}
            <View className="flex-1">
              <MapView
                ref={mapRef}
                provider={Platform.select({
                  ios: undefined,
                  android: PROVIDER_GOOGLE,
                })}
                showsUserLocation
                followsUserLocation
                showsMyLocationButton
                showsCompass
                loadingEnabled
                loadingIndicatorColor="#ffffff"
                loadingBackgroundColor="#000000"
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                style={StyleSheet.absoluteFill}
                mapType="standard"
                userInterfaceStyle="dark"
              >
                {coordinates.length > 0 && (
                  <Polyline
                    coordinates={coordinates}
                    strokeColor={pathColor}
                    strokeWidth={3}
                  />
                )}
              </MapView>
            </View>

            {/* Hidden ViewShot for capturing */}
            <View style={{ position: 'absolute', opacity: 0, width: 800, height: 800, overflow: 'hidden' }}>
              <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0, width: 800, height: 800 }}>
                <View style={{ width: 800, height: 800, backgroundColor: '#000' }}>
                  <MapView
                    provider={Platform.select({
                      ios: undefined,
                      android: PROVIDER_GOOGLE,
                    })}
                    showsUserLocation={false}
                    followsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    loadingEnabled={false}
                    initialRegion={previewRegion || {
                      latitude: location?.coords.latitude || 0,
                      longitude: location?.coords.longitude || 0,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    style={StyleSheet.absoluteFill}
                    mapType="standard"
                    userInterfaceStyle="dark"
                  >
                    {coordinates.length > 0 && (
                      <Polyline
                        coordinates={coordinates}
                        strokeColor={pathColor}
                        strokeWidth={3}
                      />
                    )}
                  </MapView>
                </View>
              </ViewShot>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-lg">
              {errorMsg || "Loading map..."}
            </Text>
            {!errorMsg && (
              <Text className="text-white/60 mt-2">
                Please ensure location services are enabled
              </Text>
            )}
          </View>
        )}

        {/* Floating controls at the bottom */}
        <SafeAreaView className="absolute bottom-0 w-full">
          <View className="flex-row items-center justify-between bg-black/50 backdrop-blur-md p-4 mx-4 mb-4 rounded-full">
            {/* Color picker */}
            <View className="flex-row gap-2">
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setPathColor(color)}
                  className={`w-8 h-8 rounded-full ${
                    pathColor === color ? "border-2 border-white" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>

            {/* Play/Pause button */}
            <TouchableOpacity
              onPress={toggleTracking}
              className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center"
            >
              <Ionicons
                name={isTracking ? "pause" : "play"}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            {/* Distance */}
            <View className="bg-black/30 px-4 py-2 rounded-full">
              <Text className="text-white font-semibold">
                {(totalDistance / 1000).toFixed(2)} km
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Back button */}
        <SafeAreaView className="absolute top-0 left-0">
          <TouchableOpacity
            onPress={() => router.back()}
            className="m-4 bg-black/50 backdrop-blur-md p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Preview Modal */}
        <Modal
          visible={showPreview}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPreview(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-dark-800 rounded-2xl p-4 w-full max-w-md">
              <Text className="text-white text-xl font-bold mb-4 text-center">
                Your Walking Path Art
              </Text>
              {previewUri && (
                <Image
                  source={{ uri: previewUri }}
                  className="w-full h-64 rounded-xl mb-4"
                  resizeMode="contain"
                />
              )}
              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  onPress={() => setShowPreview(false)}
                  className="bg-dark-700 px-4 py-2 rounded-full"
                >
                  <Text className="text-white">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={mintNFT}
                  disabled={isMinting}
                  className="bg-primary px-4 py-2 rounded-full"
                >
                  <Text className="text-dark font-semibold">
                    {isMinting ? "Minting..." : "Mint NFT"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}
