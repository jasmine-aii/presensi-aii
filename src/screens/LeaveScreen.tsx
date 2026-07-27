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
          paddingHorizontal: space.lg,
          paddingVertical: space.lg,
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
            gap: space.xs,
            paddingVertical: space.sm,
            paddingHorizontal: space.md,
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

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}>
        {/* Type grid */}
        <Txt w="bold" size={14} color={color.ink} style={{ marginBottom: space.md }}>
          {s.leave.typeTitle}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          {s.leaveTypes.map((label, i) => (
            <View
              key={label}
              style={{
                width: tile,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: radius.md,
                paddingVertical: space.lg,
                paddingHorizontal: space.sm,
                alignItems: 'center',
                gap: space.sm,
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md }}>
          <Txt w="bold" size={14} color={color.ink}>
            {s.leave.reqTitle}
          </Txt>
          <Txt w="semibold" size={13} color={color.anugrahBlue}>
            {s.home.seeAll}
          </Txt>
        </View>
        <View style={{ gap: space.md }}>
          {reqs.map((q) => (
            <View
              key={q.type + q.dates}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                backgroundColor: color.white,
                borderWidth: 1,
                borderColor: color.line,
                borderRadius: radius.md,
                padding: space.lg,
              }}
            >
              <IconTile icon={q.icon} size={42} radius={12} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Txt w="semibold" size={14} color={color.ink}>
                  {q.type}
                </Txt>
                <Txt size={12} color={color.muted} tabular style={{ marginTop: space.xs }}>
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
