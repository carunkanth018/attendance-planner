import type {
  AttendanceInputs,
  DayPrediction,
  DaySimulationStatus,
  PlannerCalculationSummary,
  SemesterConfig,
  SemesterMetrics,
  WeeklyTimetable,
} from '../types/attendance';
import { calculatePercentage, calculateRecoveryPlan, calculateSafeAbsences } from './attendance';

/**
 * Default editable suggested academic calendar dates for JNTUK-style B.Tech II Year I Semester (2026–27)
 */
export const DEFAULT_SEMESTER_CONFIG: SemesterConfig = {
  semesterName: 'B.Tech II Year I Semester',
  academicYear: '2026–27',
  commencementDate: '2026-07-13', // 13 July 2026
  lastTeachingDate: '2026-11-11', // 11 November 2026
  midExamDates: '12–14 Nov 2026',
  practicalExamDates: '16–21 Nov 2026',
  endExamStartDate: '2026-11-23',
  semesterEndDate: '2026-12-05', // 5 December 2026
};

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
}

const dateKeyCache = new Map<string, Date>();

/**
 * Parses a YYYY-MM-DD string into a local Date object at noon
 */
export function parseDateKey(key: string): Date {
  const cached = dateKeyCache.get(key);
  if (cached) return new Date(cached.getTime());
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7));
  const d = Number(key.slice(8, 10));
  const date = new Date(y, m - 1, d, 12, 0, 0);
  if (dateKeyCache.size < 500) {
    dateKeyCache.set(key, date);
  }
  return new Date(date.getTime());
}

/**
 * Formats a Date into "09 Oct 2026"
 */
export function formatDisplayDate(d: Date): string {
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day < 10 ? '0' + day : day} ${month} ${year}`;
}

/**
 * Formats a Date into "Fri, 09 Oct 2026"
 */
export function formatDayDisplayDate(d: Date): string {
  const weekday = WEEKDAYS_SHORT[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${weekday}, ${day < 10 ? '0' + day : day} ${month} ${year}`;
}

/**
 * Gets periods scheduled for a given day of the week (0 = Sun, 1 = Mon ... 6 = Sat)
 */
export function getWeekdayScheduledPeriods(timetable: WeeklyTimetable, dayOfWeek: number): number {
  switch (dayOfWeek) {
    case 0:
      return Math.max(0, timetable.sunday ?? 0);
    case 1:
      return Math.max(0, timetable.monday ?? 0);
    case 2:
      return Math.max(0, timetable.tuesday ?? 0);
    case 3:
      return Math.max(0, timetable.wednesday ?? 0);
    case 4:
      return Math.max(0, timetable.thursday ?? 0);
    case 5:
      return Math.max(0, timetable.friday ?? 0);
    case 6:
      return Math.max(0, timetable.saturday ?? 6);
    default:
      return 0;
  }
}

/**
 * Default timetable for users (Mon-Sat, Saturday is a normal working day with 6 periods)
 */
export const DEFAULT_TIMETABLE: WeeklyTimetable = {
  monday: 7,
  tuesday: 6,
  wednesday: 7,
  thursday: 6,
  friday: 7,
  saturday: 6,
  sunday: 0,
};

/**
 * Generates day-by-day sequential attendance predictions limited to the current semester's instructional period.
 * Stops counting normal scheduled periods after the Last Teaching Day.
 */
export function generateDailyPredictions(
  inputs: AttendanceInputs,
  maxDays = 150
): DayPrediction[] {
  const result: DayPrediction[] = [];
  const semester = inputs.semester || DEFAULT_SEMESTER_CONFIG;
  const startDate = parseDateKey(inputs.startDate || formatDateKey(new Date()));
  const lastTeachingDate = parseDateKey(semester.lastTeachingDate);
  const holidayMap = new Map(inputs.holidays.map((h) => [h.date, h.name]));

  // Limit forecast horizon to Last Teaching Day (inclusive)
  const diffTime = lastTeachingDate.getTime() - startDate.getTime();
  const daysUntilTeachingEnd = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const daysCount = Math.min(maxDays, Math.max(daysUntilTeachingEnd, 1));

  let runningAttended = inputs.attendedSlots;
  let runningTotal = inputs.totalSlots;
  const target = inputs.targetPercentage;
  const initialPct = calculatePercentage(runningAttended, runningTotal);
  let milestoneFound = initialPct >= target;

  const todayKey = formatDateKey(new Date());

  for (let i = 0; i < daysCount; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    const dateKey = formatDateKey(currentDay);
    const dayOfWeek = currentDay.getDay();
    const dayName = WEEKDAYS_SHORT[dayOfWeek];
    const formattedDate = formatDisplayDate(currentDay);
    const formattedDayDate = formatDayDisplayDate(currentDay);

    const isPastTeachingEnd = dateKey > semester.lastTeachingDate;
    const isOfficialHoliday = holidayMap.has(dateKey);
    const holidayName = holidayMap.get(dateKey);

    // Normal teaching periods stop after last teaching day
    const defaultWeekdayPeriods =
      isOfficialHoliday || isPastTeachingEnd
        ? 0
        : getWeekdayScheduledPeriods(inputs.timetable, dayOfWeek);

    const override = inputs.overrides[dateKey];

    let status: DaySimulationStatus = 'ATTEND';
    let scheduledPeriods =
      override?.customScheduledPeriods !== undefined
        ? Math.max(0, override.customScheduledPeriods)
        : defaultWeekdayPeriods;
    let actualAttended = 0;
    let actualMissed = 0;

    if (override) {
      if (override.status === 'HOLIDAY' || isOfficialHoliday) {
        status = 'HOLIDAY';
        scheduledPeriods = 0;
        actualAttended = 0;
        actualMissed = 0;
      } else if (override.status === 'NO_CLASS') {
        status = 'NO_CLASS';
        scheduledPeriods = 0;
        actualAttended = 0;
        actualMissed = 0;
      } else if (override.status === 'LEAVE') {
        status = 'LEAVE';
        actualAttended = 0;
        actualMissed = scheduledPeriods;
      } else if (override.status === 'PARTIAL_LEAVE') {
        status = 'PARTIAL_LEAVE';
        actualAttended = Math.min(
          scheduledPeriods,
          Math.max(0, override.attendedPeriods ?? 0)
        );
        actualMissed = Math.max(0, scheduledPeriods - actualAttended);
      } else {
        // ATTEND override
        status = 'ATTEND';
        actualAttended = scheduledPeriods;
        actualMissed = 0;
      }
    } else {
      // Default behavior according to timetable & holidays
      if (isOfficialHoliday) {
        status = 'HOLIDAY';
        scheduledPeriods = 0;
        actualAttended = 0;
        actualMissed = 0;
      } else if (isPastTeachingEnd || scheduledPeriods === 0) {
        status = 'NO_CLASS';
        actualAttended = 0;
        actualMissed = 0;
      } else {
        status = 'ATTEND';
        actualAttended = scheduledPeriods;
        actualMissed = 0;
      }
    }

    // Cumulative running arithmetic:
    // Only instructional periods conducted add to total.
    // Holidays, weekends, and non-instructional days add 0.
    runningAttended += actualAttended;
    runningTotal += actualAttended + actualMissed;

    const projectedPercentage = calculatePercentage(runningAttended, runningTotal);
    const isTargetAchieved = projectedPercentage >= target;

    // Detect recovery milestone (first day crossing target with class attendance before teaching ends)
    let isRecoveryMilestone = false;
    if (
      !milestoneFound &&
      isTargetAchieved &&
      status !== 'NO_CLASS' &&
      status !== 'HOLIDAY' &&
      actualAttended > 0
    ) {
      isRecoveryMilestone = true;
      milestoneFound = true;
    }

    // Precompute marker value for instant rendering in rows & summaries
    const markerValue = isTargetAchieved
      ? Math.max(
          0,
          Math.floor(
            (100 * runningAttended - target * runningTotal) / target
          )
        )
      : Math.max(
          0,
          Math.ceil(
            (target * runningTotal - 100 * runningAttended) / (100 - target)
          )
        );

    result.push({
      dateKey,
      dateObj: currentDay,
      dayOfWeek,
      dayName,
      formattedDate,
      formattedDayDate,
      scheduledPeriods,
      actualAttended,
      actualMissed,
      status,
      isHoliday: isOfficialHoliday || status === 'HOLIDAY',
      isOfficialHoliday,
      isManualHoliday: !isOfficialHoliday && (override?.status === 'HOLIDAY' || status === 'HOLIDAY'),
      originalScheduledPeriods: override?.customScheduledPeriods ?? defaultWeekdayPeriods,
      holidayName,
      isPastOrToday: dateKey <= todayKey,
      runningAttended,
      runningTotal,
      projectedPercentage,
      isTargetAchieved,
      isRecoveryMilestone,
      isPastTeachingEnd,
      markerValue,
    });
  }

  return result;
}

/**
 * Computes all semester-aware calendar & recovery metrics for the planner.
 */
export function computePlannerSummary(inputs: AttendanceInputs): PlannerCalculationSummary {
  const currentPercentage = calculatePercentage(inputs.attendedSlots, inputs.totalSlots);
  const missedSlots = Math.max(0, inputs.totalSlots - inputs.attendedSlots);
  const isOnTrack = currentPercentage >= inputs.targetPercentage;
  const semester = inputs.semester || DEFAULT_SEMESTER_CONFIG;

  const recoveryPlan = calculateRecoveryPlan(
    inputs.attendedSlots,
    inputs.totalSlots,
    inputs.targetPercentage
  );
  const safeAbsences = calculateSafeAbsences(
    inputs.attendedSlots,
    inputs.totalSlots,
    inputs.targetPercentage
  );

  // Generate days limited to semester's last teaching day
  const days = generateDailyPredictions(inputs);

  // Identify remaining teaching days and periods starting from planning date
  const planningDateKey = inputs.startDate || formatDateKey(new Date());
  const remainingTeachingDaysList = days.filter(
    (d) =>
      d.dateKey >= planningDateKey &&
      d.dateKey <= semester.lastTeachingDate &&
      d.scheduledPeriods > 0 &&
      d.status !== 'HOLIDAY' &&
      d.status !== 'NO_CLASS'
  );
  const teachingDaysRemaining = remainingTeachingDaysList.length;
  const teachingPeriodsRemaining = remainingTeachingDaysList.reduce(
    (sum, d) => sum + d.scheduledPeriods,
    0
  );

  // Final day projected results (at last teaching day)
  const finalDay = days.length > 0 ? days[days.length - 1] : null;
  const projectedFinalAttended = finalDay ? finalDay.runningAttended : inputs.attendedSlots;
  const projectedFinalTotal = finalDay ? finalDay.runningTotal : inputs.totalSlots;
  const projectedFinalPercentage = finalDay
    ? finalDay.projectedPercentage
    : currentPercentage;

  // Calendar dates countdown
  const todayKey = formatDateKey(new Date());
  const todayObj = parseDateKey(todayKey);
  const semesterEndObj = parseDateKey(semester.semesterEndDate);
  const commencementObj = parseDateKey(semester.commencementDate);

  const diffCalendarMs = semesterEndObj.getTime() - todayObj.getTime();
  const calendarDaysRemaining = Math.max(0, Math.ceil(diffCalendarMs / (1000 * 60 * 60 * 24)));

  const totalSemesterCalendarDays = Math.max(
    1,
    Math.round((semesterEndObj.getTime() - commencementObj.getTime()) / (1000 * 60 * 60 * 24))
  );
  const elapsedCalendarDays = Math.max(
    0,
    Math.round((todayObj.getTime() - commencementObj.getTime()) / (1000 * 60 * 60 * 24))
  );
  const calendarProgressPct = Math.min(
    100,
    Math.max(0, (elapsedCalendarDays / totalSemesterCalendarDays) * 100)
  );

  // Total teaching days across the generated semester window
  const totalTeachingDaysInSemester = days.filter(
    (d) => d.scheduledPeriods > 0 && d.status !== 'HOLIDAY'
  ).length;

  // Determine recovery feasibility and metrics using timetable
  const is100Impossible = inputs.targetPercentage >= 100 && inputs.attendedSlots < inputs.totalSlots;
  const consecutiveNeeded = recoveryPlan.consecutiveNeeded;
  const holidayMap = new Map(inputs.holidays.map((h) => [h.date, h.name]));

  let isTargetReachableThisSemester = false;
  let classDaysNeeded = 0;
  let classDaysShortfall = 0;
  let periodsNeeded = consecutiveNeeded;
  let periodsShortfall = 0;
  let recoveryDateKey: string | null = null;
  let recoveryDateFormatted: string | null = null;
  let projectedRecoveryAttended: number | null = null;
  let projectedRecoveryTotal: number | null = null;
  let projectedRecoveryPercentage: number | null = null;
  let finalDayScheduledPeriods: number | null = null;
  let totalScheduledPeriodsInRecoveryDays: number | null = null;

  if (isOnTrack) {
    isTargetReachableThisSemester = true;
    classDaysNeeded = 0;
    periodsNeeded = 0;
    classDaysShortfall = 0;
    periodsShortfall = 0;
    recoveryDateFormatted = 'Target Already Achieved';
    projectedRecoveryAttended = inputs.attendedSlots;
    projectedRecoveryTotal = inputs.totalSlots;
    projectedRecoveryPercentage = currentPercentage;
    finalDayScheduledPeriods = 0;
    totalScheduledPeriodsInRecoveryDays = 0;
  } else if (is100Impossible) {
    isTargetReachableThisSemester = false;
    classDaysNeeded = Infinity;
    periodsNeeded = Infinity;
    classDaysShortfall = Infinity;
    periodsShortfall = Infinity;
    recoveryDateKey = null;
    recoveryDateFormatted = null;
    projectedRecoveryAttended = null;
    projectedRecoveryTotal = null;
    projectedRecoveryPercentage = null;
    finalDayScheduledPeriods = null;
    totalScheduledPeriodsInRecoveryDays = null;
  } else {
    // Process remaining teaching days chronologically to find consecutive periods recovery
    let accumulatedPeriods = 0;
    let countedClassDays = 0;
    let reachedWithinSemester = false;

    for (const day of remainingTeachingDaysList) {
      countedClassDays += 1;
      accumulatedPeriods += day.scheduledPeriods;

      if (accumulatedPeriods >= consecutiveNeeded) {
        reachedWithinSemester = true;
        recoveryDateKey = day.dateKey;
        recoveryDateFormatted = day.formattedDayDate;
        finalDayScheduledPeriods = day.scheduledPeriods;
        totalScheduledPeriodsInRecoveryDays = accumulatedPeriods;
        projectedRecoveryAttended = inputs.attendedSlots + consecutiveNeeded;
        projectedRecoveryTotal = inputs.totalSlots + consecutiveNeeded;
        projectedRecoveryPercentage = calculatePercentage(
          projectedRecoveryAttended,
          projectedRecoveryTotal
        );
        break;
      }
    }

    if (reachedWithinSemester && projectedFinalPercentage >= inputs.targetPercentage) {
      // Reached on or before last teaching day
      isTargetReachableThisSemester = true;
      classDaysNeeded = countedClassDays;
      classDaysShortfall = 0;
      periodsShortfall = 0;
    } else {
      // Unreachable before teaching ends
      isTargetReachableThisSemester = false;
      recoveryDateKey = null;
      recoveryDateFormatted = null;
      projectedRecoveryAttended = null;
      projectedRecoveryTotal = null;
      projectedRecoveryPercentage = null;

      // Continue simulating past last teaching day to calculate required class days Y
      const lastTeachingDateObj = parseDateKey(semester.lastTeachingDate);
      const simDate = new Date(lastTeachingDateObj);
      simDate.setDate(simDate.getDate() + 1);
      let safetyCounter = 0;

      while (accumulatedPeriods < consecutiveNeeded && safetyCounter < 800) {
        safetyCounter++;
        const dateKey = formatDateKey(simDate);
        const dayOfWeek = simDate.getDay();
        const isHoliday = holidayMap.has(dateKey);
        const override = inputs.overrides[dateKey];

        let sched = 0;
        if (override?.status === 'HOLIDAY' || isHoliday || override?.status === 'NO_CLASS') {
          sched = 0;
        } else if (override?.customScheduledPeriods !== undefined) {
          sched = Math.max(0, override.customScheduledPeriods);
        } else {
          sched = getWeekdayScheduledPeriods(inputs.timetable, dayOfWeek);
        }

        if (sched > 0) {
          countedClassDays += 1;
          accumulatedPeriods += sched;
        }

        simDate.setDate(simDate.getDate() + 1);
      }

      classDaysNeeded = countedClassDays;
      classDaysShortfall = Math.max(0, classDaysNeeded - teachingDaysRemaining);
      periodsShortfall = Math.max(0, consecutiveNeeded - teachingPeriodsRemaining);
    }
  }

  // Count planned leaves in current semester
  let totalPlannedLeaveDays = 0;
  let totalPlannedLeavePeriods = 0;
  Object.entries(inputs.overrides).forEach(([dateKey, override]) => {
    if (override.status === 'LEAVE' || override.status === 'PARTIAL_LEAVE') {
      const day = days.find((d) => d.dateKey === dateKey);
      if (day) {
        totalPlannedLeaveDays += 1;
        totalPlannedLeavePeriods += day.actualMissed;
      }
    }
  });

  const percentagePointDiff = projectedFinalPercentage - inputs.targetPercentage;

  const semesterMetrics: SemesterMetrics = {
    semesterName: semester.semesterName,
    academicYear: semester.academicYear,
    commencementDate: semester.commencementDate,
    lastTeachingDate: semester.lastTeachingDate,
    semesterEndDate: semester.semesterEndDate,
    midExamDates: semester.midExamDates || '12–14 Nov 2026',
    practicalExamDates: semester.practicalExamDates || '16–21 Nov 2026',
    endExamDates: '23 Nov – 05 Dec 2026',
    calendarDaysRemaining,
    teachingDaysRemaining,
    teachingPeriodsRemaining,
    projectedFinalAttended,
    projectedFinalTotal,
    projectedFinalPercentage,
    isTargetReachableThisSemester,
    totalSemesterCalendarDays,
    calendarProgressPct,
    totalTeachingDaysInSemester,
  };

  return {
    inputs,
    currentPercentage,
    totalSlots: inputs.totalSlots,
    attendedSlots: inputs.attendedSlots,
    missedSlots,
    targetPercentage: inputs.targetPercentage,
    isOnTrack,
    baseConsecutivePeriodsNeeded: recoveryPlan.consecutiveNeeded,
    recoveryDaysNeeded: classDaysNeeded,
    recoveryDateKey,
    recoveryDateFormatted,
    projectedRecoveryAttended,
    projectedRecoveryTotal,
    projectedRecoveryPercentage,
    safeAbsenceAllowance: safeAbsences.maxSafeAbsences,
    totalPlannedLeaveDays,
    totalPlannedLeavePeriods,
    finalDayScheduledPeriods,
    totalScheduledPeriodsInRecoveryDays,
    days,
    semesterMetrics,
    isTargetReachableThisSemester,
    classDaysNeeded,
    classDaysRemaining: teachingDaysRemaining,
    classDaysShortfall,
    periodsNeeded,
    periodsRemaining: teachingPeriodsRemaining,
    periodsShortfall,
    projectedFinalPercentage,
    percentagePointDiff,
  };
}
