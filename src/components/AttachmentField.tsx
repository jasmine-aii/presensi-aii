import React, { useRef } from 'react';
import { Platform, View, Pressable } from 'react-native';
import { Paperclip, X } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt } from './Txt';

export interface AttachmentFieldProps {
  label?: string;
  /** Name of the currently selected file, or null when none. */
  fileName: string | null;
  /** Fires with the picked File (web) or null when cleared. */
  onPick: (file: any | null) => void;
  accept?: string;
  hint?: string;
  pickLabel: string;
}

/**
 * Optional file attachment picker, mirroring Astryx's FileInput (compact mode).
 * On web it drives a hidden `<input type="file">`; on native it shows a note
 * (no file picker bundled). Selected file shows as a removable chip.
 */
export function AttachmentField({ label, fileName, onPick, accept = 'image/*,application/pdf', hint, pickLabel }: AttachmentFieldProps) {
  const inputRef = useRef<any>(null);

  const Label = () =>
    label ? (
      <Txt w="semibold" size={12} color={color.muted} style={{ marginBottom: space.sm }}>
        {label}
      </Txt>
    ) : null;

  if (Platform.OS !== 'web') {
    return (
      <View>
        <Label />
        <Txt size={12} color={color.muted}>
          {hint ?? '—'}
        </Txt>
      </View>
    );
  }

  const hiddenInput = React.createElement('input' as any, {
    ref: inputRef,
    type: 'file',
    accept,
    style: { display: 'none' },
    onChange: (e: any) => onPick(e.target.files?.[0] ?? null),
  });

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onPick(null);
  };

  return (
    <View>
      <Label />
      {hiddenInput}
      {fileName ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            backgroundColor: color.skyTint,
            borderRadius: radius.sm,
            paddingHorizontal: space.md,
            paddingVertical: space.md,
          }}
        >
          <Paperclip size={16} color={color.anugrahBlue} strokeWidth={2} />
          <Txt size={13} color={color.deepNavy} numberOfLines={1} style={{ flex: 1 }}>
            {fileName}
          </Txt>
          <Pressable onPress={clear} hitSlop={8} accessibilityLabel="remove attachment">
            <X size={16} color={color.muted} strokeWidth={2} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => inputRef.current?.click()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            backgroundColor: color.white,
            borderWidth: 1,
            borderColor: color.line,
            borderStyle: 'dashed',
            borderRadius: radius.sm,
            paddingHorizontal: space.md,
            paddingVertical: space.md,
          }}
        >
          <Paperclip size={16} color={color.anugrahBlue} strokeWidth={2} />
          <Txt w="semibold" size={13} color={color.anugrahBlue} style={{ flex: 1 }}>
            {pickLabel}
          </Txt>
        </Pressable>
      )}
      {hint ? (
        <Txt size={11} color={color.muted} style={{ marginTop: space.sm }}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export default AttachmentField;
