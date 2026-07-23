import {
  Sun,
  Thermometer,
  FileText,
  Timer,
  Briefcase,
  History,
  Baby,
  Mail,
  Phone,
  CalendarDays,
  UserRound,
  MapPin,
  type LucideIcon,
} from 'lucide-react-native';
import type { Lang, Dict } from '../i18n/strings';

/** Icons for the Home quick-menu grid — parallel to `s.menu`. */
export const menuIcons: LucideIcon[] = [Sun, Thermometer, FileText, Timer, Briefcase, History];

/** Icons for the Leave-type grid — parallel to `s.leaveTypes`. */
export const leaveTypeIcons: LucideIcon[] = [Sun, Thermometer, FileText, Timer, Briefcase, Baby];

export type AttendanceStatus = 'ontime' | 'late' | 'leave';
export interface HistoryRow {
  dnum: string;
  day: string;
  cin: string;
  cout: string;
  st: AttendanceStatus;
}

/** Attendance history rows (sample). */
export function historyRows(s: Dict): HistoryRow[] {
  const raw: Array<Omit<HistoryRow, 'day'>> = [
    { dnum: '08', cin: '08:41', cout: '17:22', st: 'ontime' },
    { dnum: '07', cin: '09:12', cout: '17:30', st: 'late' },
    { dnum: '06', cin: '08:37', cout: '17:05', st: 'ontime' },
    { dnum: '05', cin: '—', cout: '—', st: 'leave' },
    { dnum: '02', cin: '08:29', cout: '17:48', st: 'ontime' },
  ];
  return raw.map((r, i) => ({ ...r, day: s.dayShort[i] ?? '' }));
}

export interface ProfileRow {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Profile label→value rows (sample). */
export function profileRows(lang: Lang): ProfileRow[] {
  const L =
    lang === 'id'
      ? { email: 'Email', phone: 'Telepon', joined: 'Bergabung', manager: 'Atasan', location: 'Lokasi' }
      : { email: 'Email', phone: 'Phone', joined: 'Joined', manager: 'Manager', location: 'Location' };
  return [
    { icon: Mail, label: L.email, value: 'andi.p@anugerah.ai' },
    { icon: Phone, label: L.phone, value: '+62 812 3456 7890' },
    { icon: CalendarDays, label: L.joined, value: '12 Jan 2023' },
    { icon: UserRound, label: L.manager, value: 'Rina Wijaya' },
    { icon: MapPin, label: L.location, value: lang === 'id' ? 'Kantor Pusat, Jakarta' : 'HQ, Jakarta' },
  ];
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export interface LeaveRequest {
  type: string;
  dates: string;
  days: number;
  st: RequestStatus;
  icon: LucideIcon;
}

/** Recent leave requests (sample). */
export function leaveRequests(lang: Lang, s: Dict): LeaveRequest[] {
  const may = lang === 'id' ? 'Mei' : 'May';
  return [
    { type: s.leaveTypes[0], dates: `12–13 ${may} 2025`, days: 2, st: 'pending', icon: Sun },
    { type: s.leaveTypes[1], dates: '28 Apr 2025', days: 1, st: 'approved', icon: Thermometer },
    { type: s.leaveTypes[2], dates: '15 Apr 2025', days: 1, st: 'rejected', icon: FileText },
  ];
}
