import React from 'react';
import { View, Modal, Pressable, Image } from 'react-native';
import { CircleCheck, CircleX } from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from './Txt';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(14,17,22,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: '100%', maxWidth: 320, backgroundColor: color.white, borderRadius: 22, padding: 24, alignItems: 'center' }}>
          {ok && imageUri ? (
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              <Image source={{ uri: imageUri }} style={{ width: 96, height: 96, borderRadius: 20, backgroundColor: color.line }} resizeMode="cover" />
              <View style={{ position: 'absolute', bottom: -8, width: 34, height: 34, borderRadius: 999, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={30} color={accent} strokeWidth={2} />
              </View>
            </View>
          ) : (
            <View style={{ width: 60, height: 60, borderRadius: 999, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon size={34} color={accent} strokeWidth={2} />
            </View>
          )}
          <Txt w="extrabold" size={18} color={color.ink} style={{ textAlign: 'center' }}>
            {title}
          </Txt>
          <Txt size={14} color={color.muted} style={{ textAlign: 'center', lineHeight: 20, marginTop: 6 }}>
            {message}
          </Txt>
          <Pressable
            onPress={onClose}
            style={{ marginTop: 20, alignSelf: 'stretch', alignItems: 'center', backgroundColor: ok ? color.anugrahBlue : color.white, borderWidth: ok ? 0 : 1, borderColor: color.danger, borderRadius: 16, paddingVertical: 15 }}
          >
            <Txt w="semibold" size={16} color={ok ? color.white : color.danger}>
              {actionLabel}
            </Txt>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default ResultDialog;
