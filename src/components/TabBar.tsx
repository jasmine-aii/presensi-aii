import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { House, History, Clock, CalendarDays, User, type LucideIcon } from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from './Txt';

export type EmployeeNav = 'home' | 'history' | 'clock' | 'leave' | 'profile';

interface Item {
  key: EmployeeNav;
  icon: LucideIcon;
  center?: boolean;
}

const ITEMS: Item[] = [
  { key: 'home', icon: House },
  { key: 'history', icon: History },
  { key: 'clock', icon: Clock, center: true },
  { key: 'leave', icon: CalendarDays },
  { key: 'profile', icon: User },
];

export interface TabBarProps {
  active: EmployeeNav;
  labels: Record<string, string>;
  onNavigate: (key: EmployeeNav) => void;
  /** Extra bottom padding for the device safe-area inset. */
  bottomInset?: number;
}

/** Employee bottom navigation with a raised center FAB (the "Absen" action). */
export function TabBar({ active, labels, onNavigate, bottomInset = 0 }: TabBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 18 + bottomInset,
        backgroundColor: color.white,
        borderTopWidth: 1,
        borderTopColor: color.line,
      }}
    >
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        const Icon = item.icon;
        const label = labels[item.key] ?? item.key;
        if (item.center) {
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => onNavigate(item.key)}
              style={{ alignItems: 'center', width: 64, gap: 6 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: color.anugrahBlue,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -24,
                  ...Platform.select({
                    ios: {
                      shadowColor: color.anugrahBlue,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.34,
                      shadowRadius: 10,
                    },
                    android: { elevation: 8 },
                  }),
                }}
              >
                <Icon size={26} color={color.white} strokeWidth={2} />
              </View>
              <Txt w="semibold" size={11} color={color.muted}>
                {label}
              </Txt>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onNavigate(item.key)}
            style={{ alignItems: 'center', width: 58, gap: 5 }}
          >
            <Icon size={24} color={isActive ? color.anugrahBlue : color.muted} strokeWidth={2} />
            <Txt w={isActive ? 'bold' : 'semibold'} size={11} color={isActive ? color.anugrahBlue : color.muted}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TabBar;
