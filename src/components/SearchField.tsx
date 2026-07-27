import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { color, interFamily, space, radius } from '../theme';

export interface SearchFieldProps {
  placeholder: string;
  value?: string;
  onChangeText?: (t: string) => void;
}

/** Search input row with a leading magnifier — used in the employee directory. */
export function SearchField({ placeholder, value, onChangeText }: SearchFieldProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[10], backgroundColor: color.paper, borderWidth: 1, borderColor: color.line, borderRadius: radius[12], paddingVertical: space[11], paddingHorizontal: space[14] }}>
      <Search size={18} color={color.muted} strokeWidth={2} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={color.muted}
        value={value}
        onChangeText={onChangeText}
        style={{ flex: 1, fontFamily: interFamily('regular'), fontSize: 14, color: color.ink, padding: 0 }}
      />
    </View>
  );
}

export default SearchField;
