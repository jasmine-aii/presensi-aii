import React from 'react';
import { Badge, type BadgeTone } from './Badge';
import { useLang } from '../i18n/LangContext';
import type { AttendanceStatus, RequestStatus } from '../lib/data';

type Status = AttendanceStatus | RequestStatus;

const toneOf: Record<Status, BadgeTone> = {
  ontime: 'success',
  late: 'danger',
  leave: 'brand',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

/** Localized semantic status pill for attendance rows and leave requests. */
export function StatusBadge({ status }: { status: Status }) {
  const { s } = useLang();
  return <Badge tone={toneOf[status]} variant="soft" label={s.status[status]} />;
}

export default StatusBadge;
