import React, { useRef, useState } from 'react';
import { View, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { ChevronDown, Check, Plus, type LucideIcon } from 'lucide-react-native';
import { color, elevation, interFamily, space, radius } from '../theme';
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
  required?: boolean;
  /** Show an "add new" row at the bottom of the dropdown (e.g. HR adding a department). */
  allowAdd?: boolean;
  addLabel?: string;
  addPlaceholder?: string;
  onAdd?: (name: string) => void;
}

/**
 * Anchored dropdown: opens a popover directly below the field. Optionally lets
 * an authorized user add a new option inline (`allowAdd`).
 */
export function SelectField({ label, value, options, onChange, icon: Icon, required, allowAdd, addLabel, addPlaceholder, onAdd }: SelectFieldProps) {
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [anchor, setAnchor] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const selected = options.find((o) => o.value === value);

  const measure = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0) setAnchor({ x, y, w, h });
    });
  };

  const openMenu = () => {
    measure(); // refine position; anchor is also cached on layout for a reliable first open
    setAdding(false);
    setDraft('');
    setOpen(true);
  };

  const submitAdd = () => {
    const name = draft.trim();
    if (!name) return;
    onAdd?.(name);
    setDraft('');
    setAdding(false);
    setOpen(false);
  };

  return (
    <View>
      <Txt w="semibold" size={13} color={color.muted} style={{ marginBottom: space.sm }}>
        {label}
        {required ? <Txt color={color.danger}> *</Txt> : null}
      </Txt>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        onPress={openMenu}
        onLayout={measure}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: color.white, borderWidth: 1, borderColor: open ? color.anugrahBlue : color.line, borderRadius: radius.sm, padding: space.md }}
      >
        {Icon && <Icon size={20} color={color.anugrahBlue} strokeWidth={2} />}
        <Txt w="regular" size={14} color={color.ink} style={{ flex: 1 }}>
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
              maxHeight: 260,
              backgroundColor: color.white,
              borderWidth: 1,
              borderColor: color.line,
              borderRadius: radius.sm,
              overflow: 'hidden',
              ...elevation('card'),
            }}
          >
            {adding ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md }}>
                <TextInput
                  autoFocus
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={submitAdd}
                  placeholder={addPlaceholder}
                  placeholderTextColor={color.muted}
                  style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, borderWidth: 1, borderColor: color.line, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.md }}
                />
                <Pressable onPress={submitAdd} style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: color.anugrahBlue, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={18} color={color.white} strokeWidth={2.5} />
                </Pressable>
              </View>
            ) : (
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
                      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: color.line, backgroundColor: active ? color.skyTint : color.white }}
                    >
                      <Txt w={active ? 'semibold' : 'regular'} size={14} color={active ? color.anugrahBlue : color.ink} style={{ flex: 1 }}>
                        {o.label}
                      </Txt>
                      {active && <Check size={16} color={color.anugrahBlue} strokeWidth={2.5} />}
                    </Pressable>
                  );
                })}
                {allowAdd && (
                  <Pressable
                    onPress={() => { setDraft(''); setAdding(true); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: color.line, backgroundColor: color.white }}
                  >
                    <Plus size={16} color={color.anugrahBlue} strokeWidth={2.5} />
                    <Txt w="semibold" size={14} color={color.anugrahBlue}>
                      {addLabel}
                    </Txt>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default SelectField;
