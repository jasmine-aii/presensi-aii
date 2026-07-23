import React, { useRef, useState } from 'react';
import { View, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check, type LucideIcon } from 'lucide-react-native';
import { color, elevation } from '../theme';
import { Txt } from './Txt';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
}

/**
 * Anchored dropdown: tapping the field opens a popover positioned directly
 * below it (not a bottom sheet), listing options with a check on the current
 * one. Used for the Invite form's role selector.
 */
export function SelectField({ label, value, options, onChange, icon: Icon }: SelectFieldProps) {
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const selected = options.find((o) => o.value === value);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  };

  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: 8 }}>
        {label}
      </Txt>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        onPress={openMenu}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.white, borderWidth: 1, borderColor: open ? color.anugrahBlue : color.line, borderRadius: 12, padding: 14 }}
      >
        {Icon && <Icon size={20} color={color.anugrahBlue} strokeWidth={2} />}
        <Txt w="semibold" size={14} color={color.ink} style={{ flex: 1 }}>
          {selected?.label ?? ''}
        </Txt>
        <ChevronDown size={16} color={color.muted} strokeWidth={2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
          <View
            style={{
              position: 'absolute',
              top: anchor.y + anchor.h + 4,
              left: anchor.x,
              width: anchor.w,
              maxHeight: 240,
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: color.line,
              borderRadius: 12,
              overflow: 'hidden',
              ...elevation('card'),
            }}
          >
            <ScrollView bounces={false}>
              {options.map((o, i) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: color.line, backgroundColor: active ? color.skyTint : color.white }}
                  >
                    <Txt w={active ? 'semibold' : 'regular'} size={14} color={active ? color.anugrahBlue : color.ink} style={{ flex: 1 }}>
                      {o.label}
                    </Txt>
                    {active && <Check size={16} color={color.anugrahBlue} strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default SelectField;
