import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';

export function PinDrop() {
  const dropOffset = useSharedValue(-80);

  useEffect(() => {
    dropOffset.value = withSequence(
      // 1) Drop from -80 to 0 in 700ms
      withTiming(0, { duration: 700 }),
      // 2) Then bounce slightly upward to -10 with a spring
      withSpring(-10),
      // 3) Finally spring back to 0
      withSpring(0)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dropOffset.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText style={styles.text}>📍</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 40,
    lineHeight: 44,
  },
});
