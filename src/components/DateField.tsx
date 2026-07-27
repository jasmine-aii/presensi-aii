import React from 'react';
import { Platform, View, TextInput } from 'react-native';
import { color, space, radius, interFamily } from '../theme';
import { Txt } from './Txt';

export interface DateFieldProps {
  label?: string;
  /** Selected date as YYYY-MM-DD, or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  required?: boolean;
}

/**
 * Date field mirroring Astryx's DateInput. On web it renders a native
 * `<input type="date">` (calendar popover, keyboard entry) styled with Anugrah
 * tokens; on native it falls back to a YYYY-MM-DD text input. Value is always
 * an ISO YYYY-MM-DD string — the same format the DB and leave engine use.
 */
export function DateField({ label, value, onChange, min, max, placeholder, required }: DateFieldProps) {
  const Label = () =>
    label ? (
      <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
        {label}
        {required ? <Txt color={color.danger}> *</Txt> : null}
      </Txt>
    ) : null;

  if (Platform.OS === 'web') {
    const input = React.createElement('input' as any, {
      type: 'date',
      value,
      min,
      max,
      onChange: (e: any) => onChange(e.target.value),
      style: {
        width: '100%',
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

  // Native fallback: typed ISO date.
  return (
    <View>
      <Label />
      <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? 'YYYY-MM-DD'}
          placeholderTextColor={color.muted}
          autoCapitalize="none"
          style={{ fontFamily: interFamily('semibold'), fontSize: 15, color: color.ink, padding: 0 }}
        />
      </View>
    </View>
  );
}

export default DateField;
