import React from 'react';
import { View, Modal } from 'react-native';
import { color, space, radius } from '../theme';

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Card max width in px (layout constant, not a spacing token). */
  maxWidth?: number;
  /** Center children (small confirmations) vs stretch (forms). */
  align?: 'center' | 'stretch';
  /** Backdrop tone — 'dark' for media/photo viewers. */
  tone?: 'default' | 'dark';
}

/**
 * Standard centered modal surface carrying the design-system spacing so every
 * dialog matches: backdrop inset `space.xl` (22), card padding `space.xl` (22),
 * corner `radius.lg` (22). Compose content as children and rely on `space.md`
 * (12) gaps inside. Anchored popovers (SelectField) use their own pattern.
 */
export function Dialog({ visible, onClose, children, maxWidth = 360, align = 'stretch', tone = 'default' }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: tone === 'dark' ? 'rgba(10,17,40,0.82)' : 'rgba(14,17,22,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.xl,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth,
            backgroundColor: color.white,
            borderRadius: radius.lg,
            padding: space.xl,
            alignItems: align === 'center' ? 'center' : 'stretch',
          }}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

export default Dialog;
