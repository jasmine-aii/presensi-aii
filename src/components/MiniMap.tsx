import React from 'react';
import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { color } from '../theme';

/**
 * Schematic mini-map with a geofence accuracy circle and a centered pin — the
 * "within office radius" preview on Clock In. Swap for a real map tile
 * (react-native-maps) in production.
 */
export function MiniMap({ height = 120 }: { height?: number }) {
  return (
    <View
      style={{
        height,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: color.skyTint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Accuracy / geofence circle */}
      <View
        style={{
          position: 'absolute',
          width: 70,
          height: 70,
          borderRadius: 999,
          backgroundColor: 'rgba(31,70,222,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(31,70,222,0.3)',
        }}
      />
      {/* Pin — nudged up so its tip sits at the circle centre */}
      <View style={{ marginBottom: 20 }}>
        <MapPin size={26} color={color.anugrahBlue} fill={color.skyTint} strokeWidth={2} />
      </View>
    </View>
  );
}

export default MiniMap;
