import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

import { color } from './src/theme';
import { LangProvider } from './src/i18n/LangContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: color.deepNavy }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LangProvider initial="id">
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.paper }}>
          <AppNavigator />
        </SafeAreaView>
      </LangProvider>
    </SafeAreaProvider>
  );
}
