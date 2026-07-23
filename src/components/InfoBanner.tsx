import React from 'react';
import { View } from 'react-native';
import { ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from './Txt';

export interface InfoBannerProps {
  text: string;
  icon?: LucideIcon;
}

/** Teal-accented informational banner (e.g. the HR provisioning note on Invite). */
export function InfoBanner({ text, icon: Icon = ShieldCheck }: InfoBannerProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, padding: 16, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: color.humanAccent }} />
      <Icon size={22} color="#0F766E" strokeWidth={2} />
      <Txt size={13} color={color.ink} style={{ flex: 1, lineHeight: 20 }}>
        {text}
      </Txt>
    </View>
  );
}

export default InfoBanner;
