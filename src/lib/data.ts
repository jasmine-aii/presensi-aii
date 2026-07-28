import {
  Sun,
  Thermometer,
  FileText,
  Timer,
  Briefcase,
  History,
  Baby,
  Mail,
  CalendarDays,
  UserRound,
  MapPin,
  Clock,
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

/** Profile label→value rows. Email + join date come from the account; the rest are sample. */
export function profileRows(lang: Lang, email?: string, joined?: string): ProfileRow[] {
  const L =
    lang === 'id'
      ? { email: 'Email', joined: 'Bergabung', manager: 'Atasan', location: 'Lokasi' }
      : { email: 'Email', joined: 'Joined', manager: 'Manager', location: 'Location' };
  return [
    { icon: Mail, label: L.email, value: email ?? '—' },
    { icon: CalendarDays, label: L.joined, value: joined ?? '—' },
    { icon: UserRound, label: L.manager, value: 'Monthy' },
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

// ── HR / Admin ────────────────────────────────────────────────

export type RosterStatus = 'present' | 'leave' | 'not' | 'late';

export interface RosterMember {
  name: string;
  role: string;
  id: string;
  dept: string;
  st: RosterStatus;
  in: string;
  out: string;
  initials: string;
}

/** Employee directory (sample). */
export const roster: RosterMember[] = [
  { name: 'Andi Pratama', role: 'AI Engineer', id: 'AII-2481', dept: 'Engineering', st: 'present', in: '08:41', out: '17:22', initials: 'AP' },
  { name: 'Rina Wijaya', role: 'Engineering Manager', id: 'AII-1120', dept: 'Engineering', st: 'present', in: '08:29', out: '17:40', initials: 'RW' },
  { name: 'Siti Rahma', role: 'Product Designer', id: 'AII-2390', dept: 'Product', st: 'present', in: '08:52', out: '17:10', initials: 'SR' },
  { name: 'Bagus Prakoso', role: 'Backend Engineer', id: 'AII-2201', dept: 'Engineering', st: 'late', in: '09:14', out: '17:05', initials: 'BP' },
  { name: 'Dewi Lestari', role: 'Data Analyst', id: 'AII-2337', dept: 'Data', st: 'leave', in: '—', out: '—', initials: 'DL' },
  { name: 'Fajar Nugroho', role: 'ML Engineer', id: 'AII-2455', dept: 'Engineering', st: 'not', in: '—', out: '—', initials: 'FN' },
];

/** Department the head persona manages (used by the Department Head view). */
export const HEAD_DEPT = 'Engineering';

/** Members of a department. */
export function teamByDept(dept: string): RosterMember[] {
  return roster.filter((r) => r.dept === dept);
}

/** Dashboard headline counts (derived from the roster). */
export const adminStats = { present: 3, notyet: 1, late: 1, leave: 1, total: 6 };

/** Dashboard "not clocked in" list — roster rows that are late or absent. */
export const notInList: RosterMember[] = roster.filter((r) => r.st === 'not' || r.st === 'late');

export interface ApprItem {
  name: string;
  type: string;
  dates: string;
  days: number;
  icon: LucideIcon;
  initials: string;
}

/** Pending approval queue (sample). */
export function approvalQueue(lang: Lang, s: Dict): ApprItem[] {
  const may = lang === 'id' ? 'Mei' : 'May';
  const attFix = lang === 'id' ? 'Koreksi absen' : 'Attendance fix';
  return [
    { name: 'Dewi Lestari', type: s.leaveTypes[0], dates: `12–13 ${may}`, days: 2, icon: Sun, initials: 'DL' },
    { name: 'Fajar Nugroho', type: s.leaveTypes[1], dates: `8 ${may}`, days: 1, icon: Thermometer, initials: 'FN' },
    { name: 'Bagus Prakoso', type: attFix, dates: `7 ${may}`, days: 1, icon: Clock, initials: 'BP' },
  ];
}

/** Approval queue scoped to one department — the Department Head only approves their own team. */
export function approvalsByDept(dept: string, lang: Lang, s: Dict): ApprItem[] {
  const names = new Set(roster.filter((r) => r.dept === dept).map((r) => r.name));
  return approvalQueue(lang, s).filter((a) => names.has(a.name));
}
