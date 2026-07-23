import React, { useState } from 'react';
import { View, Pressable, Modal } from 'react-native';
import { ChevronDown, Check, type LucideIcon } from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from './Txt';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  /** Selected option value. */
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  /** Sheet title (defaults to `label`). */
  title?: string;
}

/**
 * A real dropdown: tapping the field opens a bottom-sheet list of options with a
 * check on the current one. Used for the Invite form's role/department/shift.
 */
export function SelectField({ label, value, options, onChange, icon: Icon, title }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: 8 }}>
        {label}
      </Txt>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 12, padding: 14 }}
      >
        {Icon && <Icon size={20} color={color.anugrahBlue} strokeWidth={2} />}
        <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
          {selected?.label ?? ''}
        </Txt>
        <ChevronDown size={16} color={color.muted} strokeWidth={2} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(14,17,22,0.4)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: color.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8, paddingBottom: 28 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, backgroundColor: color.line, marginBottom: 8 }} />
            <Txt w="bold" size={15} color={color.ink} style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              {title ?? label}
            </Txt>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderTopColor: color.line }}
                >
                  <Txt w={active ? 'semibold' : 'regular'} size={15} color={active ? color.anugrahBlue : color.ink} style={{ flex: 1 }}>
                    {o.label}
                  </Txt>
                  {active && <Check size={18} color={color.anugrahBlue} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default SelectField;
