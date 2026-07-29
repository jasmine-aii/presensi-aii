import React from 'react';
import { Platform, View, TextInput } from 'react-native';
import { color, space, radius, interFamily } from '../theme';
import { Txt } from './Txt';

export interface TimeFieldProps {
  label?: string;
  /** Selected time as HH:MM, or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Time field mirroring DateField. On web it renders a native `<input type="time">`
 * (proper time picker / keyboard) styled with Anugrah tokens; on native it falls
 * back to an HH:MM text input. Value is always an "HH:MM" string.
 */
export function TimeField({ label, value, onChange, placeholder }: TimeFieldProps) {
  const Label = () =>
    label ? (
      <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
        {label}
      </Txt>
    ) : null;

  if (Platform.OS === 'web') {
    const input = React.createElement('input' as any, {
      type: 'time',
      value,
      onChange: (e: any) => onChange(e.target.value),
      style: {
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        height: 46,
        border: `1px solid ${color.line}`,
        borderRadius: radius.sm,
        padding: `0 ${space.md}px`,
        fontFamily: interFamily('semibold'),
        fontSize: 15,
        color: color.ink,
        backgroundColor: color.white,
        outline: 'none',
      },
    });
    return (
      <View>
        <Label />
        {input}
      </View>
    );
  }

  return (
    <View>
      <Label />
      <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? 'HH:MM'}
          placeholderTextColor={color.muted}
          keyboardType="numbers-and-punctuation"
          style={{ fontFamily: interFamily('semibold'), fontSize: 15, color: color.ink, padding: 0 }}
        />
      </View>
    </View>
  );
}

export default TimeField;
