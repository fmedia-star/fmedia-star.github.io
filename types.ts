export enum AttendanceStatus {
  Present = 'Hadir',
  Excused = 'Izin',
  Sick = 'Sakit',
  Absent = 'Alpa',
}

export interface AttendanceRecord {
  status: AttendanceStatus | null;
  notes: string;
}

export type AttendanceState = Record<string, AttendanceRecord>;

export interface DailySchedule {
  dayIndex: number; // 0 for Sunday, 1 for Monday, etc.
  title: string;
  members: string[];
}

export interface SubmissionRecord {
  id: number; // using timestamp for simplicity
  submittedAt: string; // ISO date string
  scheduleTitle: string;
  attendance: AttendanceState;
  prelekResult: number;
}
