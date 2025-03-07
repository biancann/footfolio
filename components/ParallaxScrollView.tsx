import type { PropsWithChildren, ReactElement } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
	interpolate,
	useAnimatedRef,
	useAnimatedStyle,
	useScrollViewOffset,
} from "react-native-reanimated";

const HEADER_HEIGHT = 240;

type Props = PropsWithChildren<{
	headerImage: ReactElement;
	headerBackgroundColor: { dark: string; light: string };
}>;

export function ParallaxScrollView({
	children,
	headerImage,
	headerBackgroundColor,
}: Props) {
	const colorScheme = useColorScheme() ?? "light";
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollOffset = useScrollViewOffset(scrollRef);

	const headerAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateY: interpolate(
						scrollOffset.value,
						[-HEADER_HEIGHT, 0, HEADER_HEIGHT],
						[-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
					),
				},
				{
					scale: interpolate(
						scrollOffset.value,
						[-HEADER_HEIGHT, 0, HEADER_HEIGHT],
						[2, 1, 1],
					),
				},
			],
		};
	});

	return (
		<View className="flex bg-dark min-h-screen">
			<Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
				<Animated.View
					style={[
						styles.header,
						{ backgroundColor: headerBackgroundColor[colorScheme] },
						headerAnimatedStyle,
					]}
				>
					{headerImage}
				</Animated.View>
				<View className="flex overflow-hidden">{children}</View>
			</Animated.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		height: HEADER_HEIGHT,
		overflow: "hidden",
	},
	content: {
		flex: 1,
		padding: 32,
		gap: 16,
		overflow: "hidden",
	},
});
