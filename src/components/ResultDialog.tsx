import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { CircleCheck, CircleX } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt } from './Txt';
import { Dialog } from './Dialog';

export type ResultKind = 'success' | 'fail';

export interface ResultDialogProps {
  visible: boolean;
  kind: ResultKind;
  title: string;
  message: string;
  /** Button label (e.g. "Selesai" / "Coba lagi"). */
  actionLabel: string;
  /** Optional captured selfie (data URI) shown above the check on success. */
  imageUri?: string | null;
  onClose: () => void;
}

/** Centered success/failure popup shown after a clock in / clock out attempt. */
export function ResultDialog({ visible, kind, title, message, actionLabel, imageUri, onClose }: ResultDialogProps) {
  const ok = kind === 'success';
  const accent = ok ? color.success : color.danger;
  const tint = ok ? color.successBg : color.dangerBg;
  const Icon = ok ? CircleCheck : CircleX;
  return (
    <Dialog visible={visible} onClose={onClose} align="center" maxWidth={340}>
      {ok && imageUri ? (
        <View style={{ marginBottom: space.md, alignItems: 'center' }}>
          <Image source={{ uri: imageUri }} style={{ width: 96, height: 96, borderRadius: radius.md, backgroundColor: color.line }} resizeMode="cover" />
          <View style={{ position: 'absolute', bottom: -8, width: 34, height: 34, borderRadius: radius.pill, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={30} color={accent} strokeWidth={2} />
          </View>
        </View>
      ) : (
        <View style={{ width: 60, height: 60, borderRadius: radius.pill, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', marginBottom: space.md }}>
          <Icon size={34} color={accent} strokeWidth={2} />
        </View>
      )}
      <Txt w="extrabold" size={18} color={color.ink} style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      <Txt size={14} color={color.muted} style={{ textAlign: 'center', lineHeight: 20, marginTop: space.xs + 2 }}>
        {message}
      </Txt>
      <Pressable
        onPress={onClose}
        style={{ marginTop: space.lg, alignSelf: 'stretch', alignItems: 'center', backgroundColor: ok ? color.anugrahBlue : color.white, borderWidth: ok ? 0 : 1, borderColor: color.danger, borderRadius: radius.md, paddingVertical: space[15] }}
      >
        <Txt w="semibold" size={16} color={ok ? color.white : color.danger}>
          {actionLabel}
        </Txt>
      </Pressable>
    </Dialog>
  );
}

export default ResultDialog;
