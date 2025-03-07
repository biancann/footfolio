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
import { uploadToIPFS, uploadMetadataToIPFS } from "@/utils/ipfs";
import Svg, { Path } from "react-native-svg";
import { nextTokenIdToMint } from "thirdweb/extensions/erc721";

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
  const [previewBackground, setPreviewBackground] = useState<'solid' | 'dimmed'>('dimmed');
  const [previewBackgroundColor, setPreviewBackgroundColor] = useState('#FFFFFF');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Add custom dark map style
  const darkMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.business",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.place_of_worship",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.school",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.medical",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit.line",
      elementType: "all",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

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
        if (coordinates.length === 0) {
          console.error("No coordinates to capture");
          return;
        }

        // Calculate bounds of the path
        const bounds = coordinates.reduce((acc, coord) => ({
          minLat: Math.min(acc.minLat, coord.latitude),
          maxLat: Math.max(acc.maxLat, coord.latitude),
          minLng: Math.min(acc.minLng, coord.longitude),
          maxLng: Math.max(acc.maxLng, coord.longitude),
        }), {
          minLat: coordinates[0].latitude,
          maxLat: coordinates[0].latitude,
          minLng: coordinates[0].longitude,
          maxLng: coordinates[0].longitude,
        });

        // Add padding to ensure path is fully visible
        const latPadding = (bounds.maxLat - bounds.minLat) * 0.2;
        const lngPadding = (bounds.maxLng - bounds.minLng) * 0.2;

        // Calculate the region that will show the entire path
        const region = {
          latitude: (bounds.minLat + bounds.maxLat) / 2,
          longitude: (bounds.minLng + bounds.maxLng) / 2,
          latitudeDelta: Math.max((bounds.maxLat - bounds.minLat) + latPadding, 0.001),
          longitudeDelta: Math.max((bounds.maxLng - bounds.minLng) + lngPadding, 0.001),
        };

        // Update the preview map region
        setPreviewRegion(region);

        // Wait for the map to render
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait time for better rendering

        const uri = await viewShotRef.current.capture();
        setPreviewUri(uri);
        setShowPreview(true);
      } catch (error) {
        console.error("Error capturing preview:", error);
      }
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
      const nextTokenId = await nextTokenIdToMint({contract});
      const name = "FootFolio #" + (Number(nextTokenId) + 1);

      // Upload image to IPFS
      const imageUri = await uploadToIPFS(name, previewUri);

      let level;
      if (totalDistance < 2000) {
        level = "Leisure Walker";
      } else if (totalDistance < 5000) {
        level = "Explorer";
      } else if (totalDistance < 10000) {
        level = "Trailblazer";
      } else if (totalDistance < 20000) {
        level = "Distance Champion";
      } else {
        level = "Marathon Voyager";
      }

      // Create metadata
      const metadata = {
        name,
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
          {
            trait_type: "Level",
            value: level,
          },
        ],
      };

      // Upload metadata to IPFS
      const metadataUri = await uploadMetadataToIPFS(name, metadata);

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
  const colors = ["#ffd772", "#729aff", "#ff9172", "#9aff72", "#72ffd7"];

  // Add this new function to handle background changes
  const handleBackgroundChange = async (type: 'solid' | 'dimmed') => {
    setPreviewBackground(type);
    // Wait for state to update and re-render
    await new Promise(resolve => setTimeout(resolve, 100));
    await capturePreview();
  };

  // Add this new function to handle background color changes
  const handleBackgroundColorChange = async (color: string) => {
    setPreviewBackgroundColor(color);
    // Wait for state to update and re-render
    await new Promise(resolve => setTimeout(resolve, 100));
    await capturePreview();
  };

  // Update the normalizeCoordinates function
  const normalizeCoordinates = (coordinates: Coordinate[]) => {
    if (coordinates.length === 0) return [];

    // Find the bounds
    const bounds = coordinates.reduce((acc, coord) => ({
      minLat: Math.min(acc.minLat, coord.latitude),
      maxLat: Math.max(acc.maxLat, coord.latitude),
      minLng: Math.min(acc.minLng, coord.longitude),
      maxLng: Math.max(acc.maxLng, coord.longitude),
    }), {
      minLat: coordinates[0].latitude,
      maxLat: coordinates[0].latitude,
      minLng: coordinates[0].longitude,
      maxLng: coordinates[0].longitude,
    });

    // Calculate center point
    const centerLat = (bounds.maxLat + bounds.minLat) / 2;
    const centerLng = (bounds.maxLng + bounds.minLng) / 2;

    // Calculate the range
    const latRange = bounds.maxLat - bounds.minLat || 0.0001; // Prevent division by zero
    const lngRange = bounds.maxLng - bounds.minLng || 0.0001;

    // Use the larger range to maintain aspect ratio
    const range = Math.max(latRange, lngRange);

    // Set canvas size with padding
    const size = 700; // Slightly smaller than 800 to ensure padding
    const scale = size / range;

    // Normalize coordinates to fit in the canvas
    return coordinates.map(coord => ({
      x: 400 + ((coord.longitude - centerLng) * scale),
      y: 400 + ((centerLat - coord.latitude) * scale), // Note the inversion here
    }));
  };

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
                customMapStyle={darkMapStyle}
              >
                {coordinates.length > 0 && (
                  <Polyline
                    coordinates={coordinates}
                    strokeColor={pathColor}
                    strokeWidth={5}
                  />
                )}
              </MapView>
            </View>

            {/* Hidden ViewShot for capturing */}
            <View style={{ position: 'absolute', opacity: 0, width: 800, height: 800, overflow: 'hidden' }}>
              <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0, width: 800, height: 800 }}>
                <View style={{
                  width: 800,
                  height: 800,
                  backgroundColor: previewBackground === 'solid' ? previewBackgroundColor : '#000',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {previewBackground === 'dimmed' ? (
                    <>
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
                        region={previewRegion || {
                          latitude: location?.coords.latitude || 0,
                          longitude: location?.coords.longitude || 0,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                        style={StyleSheet.absoluteFill}
                        mapType="standard"
                        userInterfaceStyle="dark"
                        customMapStyle={darkMapStyle}
                      >
                        {coordinates.length > 0 && (
                          <Polyline
                            coordinates={coordinates}
                            strokeColor={pathColor}
                            strokeWidth={5}
                          />
                        )}
                      </MapView>
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                    </>
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Svg width={800} height={800} viewBox="0 0 800 800">
                        {coordinates.length > 0 && (
                          <>
                            <Path
                              d={normalizeCoordinates(coordinates).reduce((path, point, index) => {
                                return index === 0
                                  ? `M ${point.x} ${point.y}`
                                  : `${path} L ${point.x} ${point.y}`;
                              }, '')}
                              stroke={pathColor}
                              strokeWidth={8}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </>
                        )}
                      </Svg>
                    </View>
                  )}
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
            <View className="relative">
              <TouchableOpacity
                onPress={() => setShowColorPicker(!showColorPicker)}
                className="w-8 h-8 rounded-full border-2 border-white"
                style={{ backgroundColor: pathColor }}
              />
              {showColorPicker && (
                <View className="absolute bottom-7 -left-2 mb-2 bg-dark backdrop-blur-md p-2 rounded-full">
                  <View className="flex-col gap-2">
                    {colors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => {
                          setPathColor(color);
                          setShowColorPicker(false);
                        }}
                        className={`w-8 h-8 rounded-full ${pathColor === color ? "border-2 border-white" : ""
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Play/Pause button */}
            <TouchableOpacity
              onPress={toggleTracking}
              className="bg-primary-600 w-12 h-12 rounded-full items-center justify-center ml-6"
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
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                  onPress={() => handleBackgroundChange(previewBackground === 'solid' ? 'dimmed' : 'solid')}
                  className="bg-dark-700 px-4 py-2 rounded-full"
                >
                  <Text className="text-white">
                    {previewBackground === 'solid' ? 'Show Map' : 'Solid Background'}
                  </Text>
                </TouchableOpacity>
                {previewBackground === 'solid' && (
                  <View className="flex-row gap-2">
                    {['#FFFFFF', '#000000', '#1A1A1A'].map((color) => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleBackgroundColorChange(color)}
                        className={`w-8 h-8 rounded-full ${previewBackgroundColor === color ? "border-2 border-white" : ""
                          }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </View>
                )}
              </View>
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
