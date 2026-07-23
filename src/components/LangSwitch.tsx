import React from 'react';
import { View, Pressable } from 'react-native';
import { color } from '../theme';
import { Txt } from './Txt';
import { useLang } from '../i18n/LangContext';
import type { Lang } from '../i18n/strings';

/** Segmented ID/EN control that flips all UI copy at runtime. */
export function LangSwitch() {
  const { lang, setLang } = useLang();
  const seg = (value: Lang, text: string) => {
    const active = lang === value;
    return (
      <Pressable
        key={value}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => setLang(value)}
        style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: active ? color.anugrahBlue : 'transparent' }}
      >
        <Txt w="bold" size={14} color={active ? color.white : color.muted}>
          {text}
        </Txt>
      </Pressable>
    );
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        backgroundColor: color.white,
        borderWidth: 1,
        borderColor: color.line,
      }}
    >
      {seg('id', 'ID')}
      {seg('en', 'EN')}
    </View>
  );
}

export default LangSwitch;
