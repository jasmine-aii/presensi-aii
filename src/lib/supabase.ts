import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * True once `.env` holds a real project URL + anon key. When false the app
 * shows a setup notice instead of crashing on an empty `createClient(...)`.
 */
export const isSupabaseConfigured =
  url.startsWith('https://') && !url.includes('YOUR-PROJECT') && anonKey.length > 20 && !anonKey.includes('YOUR-');

/**
 * Supabase client for React Native: sessions persist in AsyncStorage and refresh
 * automatically. `detectSessionInUrl` is off (no browser redirect flow here).
 * Falls back to placeholder strings when unconfigured so imports never throw —
 * guard real calls behind `isSupabaseConfigured`.
 */
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
