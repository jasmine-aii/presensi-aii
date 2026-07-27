import React from 'react';
import { View, ScrollView } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt } from '../components';
import { useLang } from '../i18n/LangContext';

/**
 * Reports (Laporan) — not detailed in the handoff, so a minimal on-brand
 * placeholder surfacing the team attendance rate. Expand with real charts later.
 */
export function ReportsScreen() {
  const { s, lang } = useLang();
  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      <View style={{ paddingHorizontal: space.lg, paddingVertical: space.lg, backgroundColor: color.white, borderBottomWidth: 1, borderBottomColor: color.line }}>
        <Txt w="bold" size={17} color={color.ink}>
          {s.anav.report}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
        <View style={{ backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: radius.lg, padding: space.xl, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: color.humanAccent }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md }}>
            <TrendingUp size={18} color={color.anugrahBlue} strokeWidth={2} />
            <Txt w="bold" size={14} color={color.ink}>
              {s.adm.rate}
            </Txt>
          </View>
          <Txt w="extrabold" size={46} color={color.anugrahBlue} tabular style={{ letterSpacing: -1 }}>
            94%
          </Txt>
          <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: color.skyTint, marginTop: space.md, overflow: 'hidden' }}>
            <View style={{ width: '94%', height: 8, borderRadius: radius.pill, backgroundColor: color.anugrahBlue }} />
          </View>
        </View>
        <Txt size={13} color={color.muted} style={{ textAlign: 'center', paddingHorizontal: space.xl, marginTop: space.sm }}>
          {lang === 'id' ? 'Laporan lengkap (grafik & ekspor) menyusul.' : 'Full reports (charts & export) coming soon.'}
        </Txt>
      </ScrollView>
    </View>
  );
}

export default ReportsScreen;
