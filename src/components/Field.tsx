import React from 'react';
import { View, TextInput } from 'react-native';
import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';
import { Txt } from './Txt';

export type FieldVariant = 'text' | 'select' | 'readonly';

export interface FieldProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  variant?: FieldVariant;
}

/**
 * Labelled form control for the Invite form. `text` is editable, `select` shows
 * a chevron, `readonly` (auto-generated ID) is a muted, non-editable grey box.
 */
export function Field({ label, value, icon: Icon, variant = 'text' }: FieldProps) {
  const readonly = variant === 'readonly';
  const iconColor = readonly ? color.muted : color.anugrahBlue;
  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: space.sm }}>
        {label}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: variant === 'select' ? 8 : 10,
          backgroundColor: readonly ? color.paper : color.white,
          borderWidth: 1,
          borderColor: color.line,
          borderRadius: radius.sm,
          padding: space.md,
        }}
      >
        {Icon && <Icon size={20} color={iconColor} strokeWidth={2} />}
        {variant === 'text' ? (
          <TextInput
            defaultValue={value}
            style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
          />
        ) : (
          <Txt w="regular" size={14} color={readonly ? color.muted : color.ink} tabular={readonly} style={{ flex: 1 }}>
            {value}
          </Txt>
        )}
        {variant === 'select' && <ChevronDown size={16} color={color.muted} strokeWidth={2} />}
      </View>
    </View>
  );
}

export default Field;
