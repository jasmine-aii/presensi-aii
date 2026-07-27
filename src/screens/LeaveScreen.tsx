import React from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { Plus } from 'lucide-react-native';
import { color, space, radius } from '../theme';
import { Txt, IconTile, StatusBadge } from '../components';
import { useLang } from '../i18n/LangContext';
import { leaveTypeIcons, leaveRequests } from '../lib/data';

export function LeaveScreen() {
  const { s, lang } = useLang();
  const reqs = leaveRequests(lang, s);
  const { width } = useWindowDimensions();
  const tile = (width - 18 * 2 - 12 * 2) / 3;

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space[20],
          paddingVertical: space[16],
          backgroundColor: color.white,
          borderBottomWidth: 1,
          borderBottomColor: color.line,
        }}
      >
        <Txt w="bold" size={17} color={color.ink}>
          {s.leave.title}
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space[5],
            paddingVertical: space[7],
            paddingHorizontal: space[12],
            backgroundColor: color.anugrahBlue,
            borderRadius: radius.pill,
          }}
        >
          <Plus size={14} color={color.white} strokeWidth={2.25} />
          <Txt w="semibold" size={13} color={color.white}>
            {s.leave.newReq}
          </Txt>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space[18], paddingBottom: space[22] }}>
        {/* Type grid */}
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space[10] }}>
          {s.leave.typeTitle}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[12] }}>
          {s.leaveTypes.map((label, i) => (
            <View
              key={label}
              style={{
                width: tile,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: radius[18],
                paddingVertical: space[16],
                paddingHorizontal: space[8],
                alignItems: 'center',
                gap: space[9],
              }}
            >
              <IconTile icon={leaveTypeIcons[i]} />
              <Txt w="semibold" size={12} color={color.ink} style={{ textAlign: 'center' }}>
                {label}
              </Txt>
            </View>
          ))}
        </View>

        {/* Recent requests */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[22], marginBottom: space[10] }}>
          <Txt w="bold" size={14} color={color.ink}>
            {s.leave.reqTitle}
          </Txt>
          <Txt w="semibold" size={13} color={color.anugrahBlue}>
            {s.home.seeAll}
          </Txt>
        </View>
        <View style={{ gap: space[10] }}>
          {reqs.map((q) => (
            <View
              key={q.type + q.dates}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[14],
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: radius[18],
                padding: space[15],
              }}
            >
              <IconTile icon={q.icon} size={42} radius={12} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Txt w="semibold" size={14} color={color.ink}>
                  {q.type}
                </Txt>
                <Txt size={12} color={color.muted} tabular style={{ marginTop: space[2] }}>
                  {q.dates} · {q.days} {s.daysUnit}
                </Txt>
              </View>
              <StatusBadge status={q.st} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default LeaveScreen;
