import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

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
  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Request location permissions and get initial location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
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
      // Stop tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    }

    setIsTracking(!isTracking);
  };

  // Available path colors
  const colors = ["#00ff00", "#ff0000", "#0000ff", "#ffff00", "#ff00ff"];

  return (
    <SafeAreaProvider>
      <View className="flex-1">
        {location ? (
          <MapView
            ref={mapRef}
            className="flex-1 w-full h-full"
            provider={Platform.select({
              ios: undefined,
              android: PROVIDER_GOOGLE
            })}
            showsUserLocation
            followsUserLocation
            showsMyLocationButton
            showsCompass
            loadingEnabled
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            style={{ flex: 1 }}
          >
            {coordinates.length > 0 && (
              <Polyline
                coordinates={coordinates}
                strokeColor={pathColor}
                strokeWidth={3}
              />
            )}
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white">
              {errorMsg || "Loading map..."}
            </Text>
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
      </View>
    </SafeAreaProvider>
  );
}
