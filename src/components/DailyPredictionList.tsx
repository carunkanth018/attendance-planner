import React, { useState, useMemo, useCallback } from 'react';
import {
  ListFilter,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react';
import type { DayPrediction, AttendanceInputs, DaySimulationStatus } from '../types/attendance';
import { SwipeableForecastRow } from './SwipeableForecastRow';
import { formatDisplayDate, parseDateKey } from '../utils/calendar';
import { calculatePercentage } from '../utils/attendance';

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface DailyPredictionListProps {
  days: DayPrediction[];
  inputs: AttendanceInputs;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onEditDate: (dateKey: string) => void;
  onSetStatus: (
    dateKey: string,
    status: DaySimulationStatus,
    attendedPeriods?: number,
    missedPeriods?: number,
    toastMessage?: string
  ) => void;
}

function formatToastDate(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

const DailyPredictionListComponent: React.FC<DailyPredictionListProps> = ({
  days,
  inputs,
  selectedDateKey,
  onSelectDate,
  onEditDate,
  onSetStatus,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'CLASSES_ONLY' | 'LEAVES_ONLY'>('ALL');
  const [displayCount, setDisplayCount] = useState<number>(35);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

  const handleToggleExpand = useCallback((dateKey: string) => {
    setExpandedDateKey((prev) => (!dateKey || prev === dateKey ? null : dateKey));
  }, []);

  const { classesCount, leavesCount } = useMemo(() => {
    let classes = 0;
    let leaves = 0;
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (d.scheduledPeriods > 0 && !d.isHoliday && d.status !== 'HOLIDAY') {
        classes++;
      }
      if (d.status === 'LEAVE' || d.status === 'PARTIAL_LEAVE') {
        leaves++;
      }
    }
    return { classesCount: classes, leavesCount: leaves };
  }, [days]);

  const filteredDays = useMemo(() => {
    if (filterMode === 'ALL') return days;
    return days.filter((d) => {
      if (filterMode === 'CLASSES_ONLY') {
        return d.scheduledPeriods > 0 && !d.isHoliday && d.status !== 'HOLIDAY';
      }
      if (filterMode === 'LEAVES_ONLY') {
        return d.status === 'LEAVE' || d.status === 'PARTIAL_LEAVE';
      }
      return true;
    });
  }, [days, filterMode]);

  const visibleDays = useMemo(() => {
    return filteredDays.slice(0, displayCount);
  }, [filteredDays, displayCount]);

  // Swipe RIGHT or Quick Action -> Mark Leave (or toggle back to attend if already leave)
  const handleMarkLeave = useCallback((day: DayPrediction) => {
    const toastDate = formatToastDate(day.dateObj);
    if (day.status === 'LEAVE') {
      onSetStatus(
        day.dateKey,
        'ATTEND',
        day.scheduledPeriods,
        0,
        `${toastDate} marked as Attended.`
      );
    } else {
      onSetStatus(
        day.dateKey,
        'LEAVE',
        0,
        day.scheduledPeriods,
        `${toastDate} marked as Planned Leave.`
      );
    }
  }, [onSetStatus]);

  // Immediate Holiday Toggle (NO confirmation modal or popup)
  const handleToggleHoliday = useCallback((day: DayPrediction) => {
    // Automatically collapse the action area so the Holiday button disappears
    setExpandedDateKey(null);

    const isManualHoliday = Boolean(
      day.isManualHoliday || (day.status === 'HOLIDAY' && !day.isOfficialHoliday)
    );

    // Official holidays, post-teaching dates, and genuine non-class days cannot be toggled
    if (
      day.isOfficialHoliday ||
      day.isPastTeachingEnd ||
      (!isManualHoliday && day.scheduledPeriods === 0 && (day.originalScheduledPeriods ?? 0) === 0)
    ) {
      return;
    }

    if (isManualHoliday) {
      // Second click: restore previous status or normal scheduled attendance
      onSetStatus(day.dateKey, 'ATTEND');
    } else {
      // First click: mark that date as a manually planned holiday
      onSetStatus(day.dateKey, 'HOLIDAY', 0, 0);
    }
  }, [onSetStatus]);

  const lastTeachingDateStr = inputs.semester?.lastTeachingDate || '2026-11-11';
  const lastTeachingDateFormatted = formatDisplayDate(parseDateKey(lastTeachingDateStr));

  // Present Attendance (Baseline today / current day before end of day)
  const presentAttended = inputs.attendedSlots;
  const presentTotal = inputs.totalSlots;
  const presentPct = calculatePercentage(presentAttended, presentTotal);
  const presentIsTargetAchieved = presentPct >= inputs.targetPercentage;
  const presentMarkerValue = presentIsTargetAchieved
    ? Math.max(
        0,
        Math.floor(
          (100 * presentAttended - inputs.targetPercentage * presentTotal) /
            inputs.targetPercentage
        )
      )
    : Math.max(
        0,
        Math.ceil(
          (inputs.targetPercentage * presentTotal - 100 * presentAttended) /
            (100 - inputs.targetPercentage)
        )
      );

  const presentDateKey = inputs.startDate || days[0]?.dateKey || '2026-07-13';
  const presentDateObj = parseDateKey(presentDateKey);
  const presentDateFormatted = `${presentDateObj.getDate()} ${MONTHS_SHORT[presentDateObj.getMonth()]} ${presentDateObj.getFullYear()}`;

  return (
    <section className="card daily-timeline-card">
      <div className="card-header">
        <div>
          <span className="section-eyebrow text-emerald flex items-center gap-1.5 font-bold tracking-wider">
            <ListFilter size={14} className="text-[#00E5A0]" /> FORECAST TIMELINE
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1 font-['Outfit']">
            Daily Attendance Forecast Timeline
          </h2>
          <p className="helper text-[#A3A3A3] text-sm mt-1 max-w-xl">
            Chronological date-by-date attendance forecast bounded to Last Teaching Day ({lastTeachingDateFormatted}).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="timeline-filter-pills">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`timeline-filter-btn ${
              filterMode === 'ALL' ? 'filter-active' : ''
            }`}
          >
            All Semester Days ({days.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('CLASSES_ONLY')}
            className={`timeline-filter-btn ${
              filterMode === 'CLASSES_ONLY' ? 'filter-active' : ''
            }`}
          >
            Classes Only ({classesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('LEAVES_ONLY')}
            className={`timeline-filter-btn ${
              filterMode === 'LEAVES_ONLY' ? 'filter-active' : ''
            }`}
          >
            Planned Leaves ({leavesCount})
          </button>
        </div>
      </div>

      {/* Forecast Table Header (Desktop Only) */}
      <div className="timeline-table-header">
        <span>Date &amp; Day</span>
        <span>Simulated Status</span>
        <span>Attended / Total</span>
        <span className="text-right">Projected % &amp; Actions</span>
      </div>

      {/* Mobile Screenshot 5 Section: Present Attendance Header & Row */}
      <div className="sm:hidden timeline-mobile-headings space-y-2 mb-3">
        <div className="text-center font-['Outfit'] font-bold text-sm text-[#00E5A0] tracking-wide">
          Present Attendance
        </div>

        <div
          className="timeline-reference-row w-full flex items-center justify-between px-3 h-[42px] rounded-[6px] border border-[#00E5A0] bg-[#03170D] transition-all cursor-pointer select-none"
          onClick={() => {
            if (presentDateKey) onEditDate(presentDateKey);
          }}
          title="Click to edit current attendance baseline"
        >
          <span className="timeline-ref-date font-bold text-white text-[13px] font-['Outfit'] shrink-0">
            {presentDateFormatted}
          </span>
          <span className="timeline-ref-pct font-extrabold text-white text-[13px] font-['Outfit'] tabular-nums">
            {presentPct.toFixed(2)} %
          </span>
          <span className="timeline-ref-counts font-bold text-white text-[13px] font-mono shrink-0">
            {inputs.attendedSlots} / {inputs.totalSlots}
          </span>
          <span className="timeline-ref-badge px-2 min-w-[26px] h-[22px] rounded-[5px] flex items-center justify-center font-bold text-xs font-mono shrink-0 bg-[#00E5A0] text-black shadow-sm">
            {presentMarkerValue}
          </span>
        </div>

        <div className="text-center font-['Outfit'] font-bold text-sm text-[#00E5A0] tracking-wide pt-3">
          End of the day attendance
        </div>
      </div>

      {/* Rows Container */}
      <div className="timeline-rows-list">
        {visibleDays.length === 0 ? (
          <div className="timeline-empty-state">
            <CalendarIcon size={24} className="text-slate-500 mb-1" />
            <p>No dates match the selected filter.</p>
          </div>
        ) : (
          visibleDays.map((day) => (
            <SwipeableForecastRow
              key={day.dateKey}
              day={day}
              inputs={inputs}
              isSelected={day.dateKey === selectedDateKey}
              isExpanded={day.dateKey === expandedDateKey}
              onToggleExpand={handleToggleExpand}
              onSelectDate={onSelectDate}
              onEditDate={onEditDate}
              onMarkLeave={handleMarkLeave}
              onRequestHoliday={handleToggleHoliday}
            />
          ))
        )}
      </div>

      {/* Show More Pagination if needed */}
      {displayCount < filteredDays.length && (
        <div className="timeline-footer">
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + 30)}
            className="btn btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            <span>Show More Dates</span>
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* Semester Instruction Concludes Milestone Footer Banner */}
      <div className="mt-4 p-3 rounded-xl bg-[#0D0D0D] border border-[#202020] flex items-center justify-between flex-wrap gap-2 text-xs text-[#737373]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
          <span>
            Instruction ends on <strong className="text-white">{lastTeachingDateFormatted}</strong>. Normal class periods stop counting after this date.
          </span>
        </div>
        <span className="text-[#A3A3A3]">
          Examination &amp; preparation days excluded from class attendance tallies.
        </span>
      </div>
    </section>
  );
};

export const DailyPredictionList = React.memo(DailyPredictionListComponent);
