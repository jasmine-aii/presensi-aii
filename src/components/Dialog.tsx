import React from 'react';
import { View, Modal } from 'react-native';
import { color, radius } from '../theme';

// Astryx dialog spacing (astryx.css): interior padding = --spacing-4 (16px);
// corner = --radius-container (22px in the Anugrah theme = radius.lg). We mirror
// those exact values here rather than defining a bespoke modal scale.
const DIALOG_PADDING = 16;

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
 * Standard centered modal surface matching Astryx's dialog spacing so every
 * modal is consistent: card padding 16 (Astryx --spacing-4), corner radius.lg
 * (22, --radius-container). Compose content as children. Anchored popovers
 * (SelectField) use their own pattern.
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
          padding: DIALOG_PADDING,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth,
            backgroundColor: color.white,
            borderRadius: radius.lg,
            padding: DIALOG_PADDING,
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
