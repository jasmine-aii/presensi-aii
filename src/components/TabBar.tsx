import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import {
  House,
  History,
  Clock,
  CalendarDays,
  User,
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { color } from '../theme';
import { Txt } from './Txt';

export type EmployeeNav = 'home' | 'history' | 'clock' | 'leave' | 'profile';
export type AdminNav = 'dashboard' | 'team' | 'add' | 'approval' | 'report';
export type NavKey = EmployeeNav | AdminNav;

interface Item {
  key: NavKey;
  icon: LucideIcon;
  center?: boolean;
}

const EMPLOYEE_ITEMS: Item[] = [
  { key: 'home', icon: House },
  { key: 'history', icon: History },
  { key: 'clock', icon: Clock, center: true },
  { key: 'leave', icon: CalendarDays },
  { key: 'profile', icon: User },
];

const ADMIN_ITEMS: Item[] = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'team', icon: Users },
  { key: 'add', icon: UserPlus, center: true },
  { key: 'approval', icon: ClipboardList },
  { key: 'report', icon: TrendingUp },
];

export interface TabBarProps {
  mode?: 'employee' | 'admin';
  active: NavKey;
  labels: Record<string, string>;
  onNavigate: (key: NavKey) => void;
  /** Count badges keyed by nav key (e.g. { approval: 3 }). */
  badges?: Partial<Record<NavKey, number>>;
  /** Nav keys shown greyed-out and non-tappable (e.g. features under development). */
  disabled?: NavKey[];
  bottomInset?: number;
}

/** Bottom navigation with a raised center FAB. Employee & admin variants. */
export function TabBar({ mode = 'employee', active, labels, onNavigate, badges, disabled, bottomInset = 0 }: TabBarProps) {
  const items = mode === 'admin' ? ADMIN_ITEMS : EMPLOYEE_ITEMS;
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
      {items.map((item) => {
        const isActive = active === item.key;
        const isDisabled = disabled?.includes(item.key) ?? false;
        const Icon = item.icon;
        const label = labels[item.key] ?? item.key;
        const badge = badges?.[item.key];
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
                    ios: { shadowColor: color.anugrahBlue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.34, shadowRadius: 10 },
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
        const iconColor = isDisabled ? color.line : isActive ? color.anugrahBlue : color.muted;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: isDisabled }}
            disabled={isDisabled}
            onPress={() => onNavigate(item.key)}
            style={{ alignItems: 'center', width: 58, gap: 5, opacity: isDisabled ? 0.6 : 1 }}
          >
            <View>
              <Icon size={24} color={iconColor} strokeWidth={2} />
              {badge != null && badge > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 999,
                    backgroundColor: color.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt w="bold" size={10} color={color.white}>
                    {badge}
                  </Txt>
                </View>
              )}
            </View>
            <Txt w={isActive ? 'bold' : 'semibold'} size={11} color={isDisabled ? color.line : isActive ? color.anugrahBlue : color.muted}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TabBar;
