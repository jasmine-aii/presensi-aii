import React from 'react';
import { View, ActivityIndicator, useWindowDimensions } from 'react-native';
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

import { color, space } from './src/theme';
import { Txt } from './src/components';
import { LangProvider } from './src/i18n/LangContext';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens';

/**
 * This is a mobile-first app. On wide screens (desktop/tablet) we constrain the
 * UI to a phone-width column centered on a dark backdrop, instead of stretching
 * edge-to-edge. On phones it stays full-bleed.
 */
function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  // Full-bleed on phones (and landscape phones); only tablets/desktops (≥768px)
  // get the centered phone-width column.
  if (width < 768) return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: color.deepNavy }}>
      <View style={{ flex: 1, maxWidth: 440, backgroundColor: color.paper, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

/** Chooses the splash / login / app view based on the auth session. */
function Root() {
  const { session, loading } = useAuth();

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={{ flex: 1, backgroundColor: color.deepNavy, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <StatusBar style="light" />
        <Txt w="extrabold" size={32} color={color.white} style={{ letterSpacing: -0.5 }}>
          Presenta
        </Txt>
        <ActivityIndicator color={color.humanAccent} />
      </View>
    );
  } else if (!session) {
    content = (
      <>
        <StatusBar style="light" />
        <LoginScreen />
      </>
    );
  } else {
    content = (
      <>
        <StatusBar style="dark" />
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: color.paper }}>
          <AppNavigator />
        </SafeAreaView>
      </>
    );
  }

  return <Frame>{content}</Frame>;
}

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
      <LangProvider initial="id">
        <AuthProvider>
          <Root />
        </AuthProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}
