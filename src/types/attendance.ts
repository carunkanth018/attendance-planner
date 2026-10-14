export interface WeeklyTimetable {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  name: string;
}

export type DaySimulationStatus = 'ATTEND' | 'LEAVE' | 'PARTIAL_LEAVE' | 'HOLIDAY' | 'NO_CLASS';

export interface DateOverride {
  status: DaySimulationStatus;
  attendedPeriods?: number;
  missedPeriods?: number;
  customScheduledPeriods?: number;
  note?: string;
  previousOverride?: DateOverride | null;
}

export interface SemesterConfig {
  semesterName: string; // e.g. "B.Tech II Year I Semester"
  academicYear: string; // e.g. "2026–27"
  commencementDate: string; // e.g. "2026-07-13" (13 July 2026)
  lastTeachingDate: string; // e.g. "2026-11-11" (11 November 2026)
  midExamDates?: string; // e.g. "12–14 Nov 2026"
  practicalExamDates?: string; // e.g. "16–21 Nov 2026"
  endExamStartDate?: string; // e.g. "2026-11-23"
  semesterEndDate: string; // e.g. "2026-12-05" (5 December 2026)
}

export interface SemesterMetrics {
  semesterName: string;
  academicYear: string;
  commencementDate: string;
  lastTeachingDate: string;
  semesterEndDate: string;
  midExamDates: string;
  practicalExamDates: string;
  endExamDates: string;
  calendarDaysRemaining: number;
  teachingDaysRemaining: number;
  teachingPeriodsRemaining: number;
  projectedFinalAttended: number;
  projectedFinalTotal: number;
  projectedFinalPercentage: number;
  isTargetReachableThisSemester: boolean;
  totalSemesterCalendarDays: number;
  calendarProgressPct: number;
  totalTeachingDaysInSemester: number;
}

export interface AttendanceInputs {
  totalSlots: number;
  attendedSlots: number;
  targetPercentage: number;
  startDate: string; // YYYY-MM-DD
  timetable: WeeklyTimetable;
  holidays: HolidayEntry[];
  overrides: Record<string, DateOverride>;
  semester?: SemesterConfig;
  saturdayConfigured?: boolean;
}

export type RecoveryStatus = 'ACHIEVED' | 'NEEDS_RECOVERY' | 'IMPOSSIBLE';

export interface RecoveryPlan {
  status: RecoveryStatus;
  consecutiveNeeded: number;
  projectedAttended: number;
  projectedTotal: number;
  projectedPercentage: number;
  targetPercentage: number;
}

export interface SafeAbsencesResult {
  isBelowTarget: boolean;
  maxSafeAbsences: number;
  projectedTotal: number;
  projectedPercentage: number;
  targetPercentage: number;
}

export interface ScenarioResult {
  futureAttended: number;
  futureMissed: number;
  projectedAttended: number;
  projectedTotal: number;
  projectedPercentage: number;
  reachesTarget: boolean;
  targetPercentage: number;
}

export interface CalculationResults {
  inputs: AttendanceInputs;
  currentPercentage: number;
  totalSlots: number;
  attendedSlots: number;
  missedSlots: number;
  targetPercentage: number;
  isOnTrack: boolean;
  recoveryPlan: RecoveryPlan;
  safeAbsences: SafeAbsencesResult;
}

export interface DayPrediction {
  dateKey: string; // YYYY-MM-DD
  dateObj: Date;
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  dayName: string; // "Mon", "Tue" ...
  formattedDate: string; // "09 Oct 2026"
  formattedDayDate: string; // "Fri, 09 Oct 2026"
  scheduledPeriods: number;
  actualAttended: number;
  actualMissed: number;
  status: DaySimulationStatus;
  isHoliday: boolean;
  isOfficialHoliday?: boolean;
  isManualHoliday?: boolean;
  originalScheduledPeriods?: number;
  holidayName?: string;
  isPastOrToday: boolean;
  runningAttended: number;
  runningTotal: number;
  projectedPercentage: number;
  isTargetAchieved: boolean;
  isRecoveryMilestone: boolean;
  isPastTeachingEnd?: boolean;
  markerValue: number;
}

export interface PlannerCalculationSummary {
  inputs: AttendanceInputs;
  currentPercentage: number;
  totalSlots: number;
  attendedSlots: number;
  missedSlots: number;
  targetPercentage: number;
  isOnTrack: boolean;
  baseConsecutivePeriodsNeeded: number;
  recoveryDaysNeeded: number | null;
  recoveryDateKey: string | null;
  recoveryDateFormatted: string | null;
  projectedRecoveryAttended: number | null;
  projectedRecoveryTotal: number | null;
  projectedRecoveryPercentage: number | null;
  safeAbsenceAllowance: number;
  totalPlannedLeaveDays: number;
  totalPlannedLeavePeriods: number;
  finalDayScheduledPeriods?: number | null;
  totalScheduledPeriodsInRecoveryDays?: number | null;
  days: DayPrediction[];
  semesterMetrics: SemesterMetrics;
  isTargetReachableThisSemester: boolean;
  classDaysNeeded: number;
  classDaysRemaining: number;
  classDaysShortfall: number;
  periodsNeeded: number;
  periodsRemaining: number;
  periodsShortfall: number;
  projectedFinalPercentage: number;
  percentagePointDiff: number;
}
