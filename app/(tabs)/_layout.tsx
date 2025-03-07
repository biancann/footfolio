import { Tabs } from "expo-router";
import React from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "home" : "home-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="walk"
				options={{
					title: "Walk",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "walk" : "walk-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="rank"
				options={{
					title: "Leaderboard",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "medal" : "medal-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "person" : "person-outline"}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
