import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { AlertCircle, CircleCheck, Info, type LucideIcon } from 'lucide-react-native';
import { color, space, radius, elevation } from '../theme';
import { Txt } from './Txt';

export type ToastTone = 'error' | 'info' | 'success';

export interface ToastProps {
  /** Message to show; null hides the toast. */
  message: string | null;
  /** Called after the auto-dismiss animation completes. */
  onHide: () => void;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. */
  duration?: number;
}

const iconFor: Record<ToastTone, LucideIcon> = { error: AlertCircle, success: CircleCheck, info: Info };
const accentFor: Record<ToastTone, string> = { error: color.danger, success: color.success, info: color.humanAccent };

/**
 * Brief non-blocking notification pinned to the bottom of its container, fading
 * in then auto-dismissing after `duration`. RN counterpart of Astryx's Toast.
 * Render as the last child of a flex:1 screen so it overlays the content.
 */
export function Toast({ message, onHide, tone = 'error', duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onHide();
      });
    }, duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;
  const Icon = iconFor[tone];
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center', opacity, transform: [{ translateY }] }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          maxWidth: 440,
          marginHorizontal: space.lg,
          backgroundColor: color.ink,
          borderRadius: radius.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          ...elevation('card'),
        }}
      >
        <Icon size={18} color={accentFor[tone]} strokeWidth={2.5} />
        <Txt w="semibold" size={13} color={color.white} style={{ flexShrink: 1 }}>
          {message}
        </Txt>
      </View>
    </Animated.View>
  );
}

export default Toast;
