import React from 'react';
import { Badge, type BadgeTone } from './Badge';
import { useLang } from '../i18n/LangContext';
import type { RosterStatus } from '../lib/data';

const map: Record<RosterStatus, { tone: BadgeTone; id: string; en: string }> = {
  present: { tone: 'success', id: 'Hadir', en: 'Present' },
  leave: { tone: 'brand', id: 'Izin', en: 'Leave' },
  not: { tone: 'neutral', id: 'Belum', en: 'Not in' },
  late: { tone: 'danger', id: 'Terlambat', en: 'Late' },
};

/** Localized attendance status pill for the roster & dashboard lists. */
export function AdminStatusBadge({ status }: { status: RosterStatus }) {
  const { lang } = useLang();
  const m = map[status];
  return <Badge tone={m.tone} variant="soft" label={lang === 'id' ? m.id : m.en} />;
}

export default AdminStatusBadge;
