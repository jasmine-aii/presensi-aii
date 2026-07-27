import React from 'react';
import { View, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt } from './Txt';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Units label shown after the value (e.g. "hari"). */
  units?: string;
  /** Prefix positive values with "+" (for signed adjustments). */
  signed?: boolean;
}

/**
 * Numeric increment/decrement control — the React Native counterpart of Astryx's
 * NumberInput step controls. Clamped to [min, max]; buttons disable at the edges.
 */
export function Stepper({ value, onChange, min = -Infinity, max = Infinity, step = 1, units, signed }: StepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  const dec = () => !atMin && onChange(Math.max(min, value - step));
  const inc = () => !atMax && onChange(Math.min(max, value + step));
  const shown = signed && value > 0 ? `+${value}` : String(value);

  const StepButton = ({ icon: Icon, onPress, disabled, label }: { icon: typeof Minus; onPress: () => void; disabled: boolean; label: string }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 40,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: disabled ? color.paper : color.skyTint,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon size={18} color={color.anugrahBlue} strokeWidth={2.5} />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <StepButton icon={Minus} onPress={dec} disabled={atMin} label="decrement" />
      <View style={{ minWidth: 72, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: space.xs }}>
        <Txt w="extrabold" size={20} color={color.ink} tabular>
          {shown}
        </Txt>
        {units ? (
          <Txt size={12} color={color.muted}>
            {units}
          </Txt>
        ) : null}
      </View>
      <StepButton icon={Plus} onPress={inc} disabled={atMax} label="increment" />
    </View>
  );
}

export default Stepper;
