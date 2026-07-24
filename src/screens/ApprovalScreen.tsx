import React from 'react';
import { View } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from '../components';
import { useLang } from '../i18n/LangContext';

/** Placeholder — the approval flow is disabled pending future development. */
export function ApprovalScreen() {
  const { s } = useLang();
  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <Txt w="bold" size={17} color={color.ink}>
          {s.adm.apprTitle}
        </Txt>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardList size={32} color={color.anugrahBlue} strokeWidth={1.75} />
        </View>
        <Txt w="bold" size={15} color={color.ink} style={{ textAlign: 'center' }}>
          {s.adm.apprSoon}
        </Txt>
        <Txt size={13} color={color.muted} style={{ textAlign: 'center', lineHeight: 19 }}>
          {s.adm.apprSoonSub}
        </Txt>
      </View>
    </View>
  );
}

export default ApprovalScreen;
