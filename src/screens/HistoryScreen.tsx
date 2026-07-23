import React from 'react';
import { View, ScrollView } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { color } from '../theme';
import { Txt, StatusBadge } from '../components';
import { useLang } from '../i18n/LangContext';
import { historyRows } from '../lib/data';

export function HistoryScreen() {
  const { s } = useLang();
  const rows = historyRows(s);

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: color.white,
          borderBottomWidth: 1,
          borderBottomColor: color.line,
        }}
      >
        <Txt w="bold" size={17} color={color.ink}>
          {s.hist.title}
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: 7,
            paddingHorizontal: 12,
            backgroundColor: color.skyTint,
            borderRadius: 999,
          }}
        >
          <Txt w="semibold" size={13} color={color.deepNavy}>
            {s.hist.month}
          </Txt>
          <ChevronDown size={15} color={color.deepNavy} strokeWidth={2} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 22 }}>
        {/* Stat cells */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 18 }}>
          <HistStat value="18" label={s.hist.present} valueColor={color.success} />
          <HistStat value="2" label={s.hist.late} valueColor={color.danger} />
          <HistStat value="1" label={s.hist.leave} valueColor={color.anugrahBlue} />
        </View>

        {/* Rows */}
        <View style={{ gap: 10, paddingHorizontal: 18, paddingTop: 20 }}>
          {rows.map((r) => (
            <View
              key={r.dnum}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: 18,
                padding: 14,
              }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color.skyTint, alignItems: 'center', justifyContent: 'center' }}>
                <Txt w="semibold" size={11} color={color.muted} style={{ textTransform: 'uppercase' }}>
                  {r.day}
                </Txt>
                <Txt w="extrabold" size={17} color={color.deepNavy} tabular>
                  {r.dnum}
                </Txt>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <Txt size={14} color={color.ink} tabular>
                    <Txt size={12} color={color.muted}>
                      {s.out.inAt}{'  '}
                    </Txt>
                    {r.cin}
                  </Txt>
                  <Txt size={14} color={color.ink} tabular>
                    <Txt size={12} color={color.muted}>
                      {s.out.outAt}{'  '}
                    </Txt>
                    {r.cout}
                  </Txt>
                </View>
                <Txt size={12} color={color.muted} style={{ marginTop: 3 }}>
                  {s.hist.month}
                </Txt>
              </View>

              <StatusBadge status={r.st} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function HistStat({ value, label, valueColor }: { value: string; label: string; valueColor: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4 }}>
      <Txt w="extrabold" size={22} color={valueColor} tabular>
        {value}
      </Txt>
      <Txt size={12} color={color.muted} style={{ marginTop: 2 }}>
        {label}
      </Txt>
    </View>
  );
}

export default HistoryScreen;
