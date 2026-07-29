import React, { useEffect, useRef } from 'react';
import { Animated, View, Easing, type DimensionValue, type ViewStyle } from 'react-native';
import { color, radius, space } from '../theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  style?: ViewStyle;
}

/** A single pulsing placeholder block. */
export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[{ width, height, borderRadius: radius.sm, backgroundColor: color.line, opacity: o }, style]} />;
}

/** A skeleton row mirroring a list item (leading block + two text lines). */
export function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.md, padding: space.md }}>
      <Skeleton width={44} height={44} />
      <View style={{ flex: 1, gap: space.sm }}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

/** A vertical stack of `count` skeleton rows (default 4). */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: space.md }}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

export default Skeleton;
