import { supabase } from './supabase';

export type HomeFeedKind = 'welcome' | 'birthday' | 'leave';

export interface HomeFeedItem {
  kind: HomeFeedKind;
  name: string;
  role: string | null; // job title, only for 'welcome'
}

/**
 * Team highlights for the employee home carousel — new joiners (first 3 days),
 * birthdays today, and who's on leave today. Backed by the SECURITY DEFINER
 * `home_feed()` RPC so a regular employee sees these without broad profile read.
 */
export async function fetchHomeFeed(): Promise<HomeFeedItem[]> {
  const { data, error } = await supabase.rpc('home_feed');
  if (error) {
    console.warn('[home_feed]', error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    kind: r.kind as HomeFeedKind,
    name: (r.name as string) || '—',
    role: (r.role as string) ?? null,
  }));
}
