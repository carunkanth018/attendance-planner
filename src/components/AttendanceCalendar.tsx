import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Coffee,
  Minus,
  Plus,
} from 'lucide-react';
import type { DayPrediction, AttendanceInputs, DaySimulationStatus } from '../types/attendance';
import { formatDateKey, parseDateKey } from '../utils/calendar';

interface AttendanceCalendarProps {
  days: DayPrediction[];
  inputs: AttendanceInputs;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onSetStatus: (
    dateKey: string,
    status: DaySimulationStatus,
    attendedPeriods?: number,
    missedPeriods?: number
  ) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  days,
  inputs,
  selectedDateKey,
  onSelectDate,
  onSetStatus,
}) => {
  // Map dateKey to DayPrediction for fast lookup
  const dayMap = React.useMemo(() => {
    const map = new Map<string, DayPrediction>();
    days.forEach((d) => map.set(d.dateKey, d));
    return map;
  }, [days]);

  // Initial month based on start date or today
  const initialDate = React.useMemo(() => {
    return parseDateKey(inputs.startDate || formatDateKey(new Date()));
  }, [inputs.startDate]);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const prevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const resetToStartMonth = () => {
    setCurrentMonthDate(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthTitle = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate calendar cells for this month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const calendarCells: {
    dateKey: string;
    dayNum: number;
    isCurrentMonth: boolean;
    dayPrediction?: DayPrediction;
  }[] = [];

  // Preceding days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDaysCount - i;
    const d = new Date(year, month - 1, dayNum);
    const dateKey = formatDateKey(d);
    calendarCells.push({
      dateKey,
      dayNum,
      isCurrentMonth: false,
      dayPrediction: dayMap.get(dateKey),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateKey = formatDateKey(d);
    calendarCells.push({
      dateKey,
      dayNum: i,
      isCurrentMonth: true,
      dayPrediction: dayMap.get(dateKey),
    });
  }

  // Remaining days to fill grid
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining > 0 && remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = formatDateKey(d);
      calendarCells.push({
        dateKey,
        dayNum: i,
        isCurrentMonth: false,
        dayPrediction: dayMap.get(dateKey),
      });
    }
  }

  const todayKey = formatDateKey(new Date());

  // Default selected day to selectedDateKey or first class day
  const effectiveSelectedKey =
    selectedDateKey || days.find((d) => d.scheduledPeriods > 0)?.dateKey || days[0]?.dateKey;
  const activeDay = effectiveSelectedKey ? dayMap.get(effectiveSelectedKey) : null;

  const activeIndex = days.findIndex((d) => d.dateKey === activeDay?.dateKey);
  const prevDay = activeIndex > 0 ? days[activeIndex - 1] : null;
  const nextDay = activeIndex >= 0 && activeIndex < days.length - 1 ? days[activeIndex + 1] : null;

  const selectAndSyncMonth = (targetDateKey: string) => {
    onSelectDate(targetDateKey);
    const targetDate = parseDateKey(targetDateKey);
    if (
      targetDate.getMonth() !== currentMonthDate.getMonth() ||
      targetDate.getFullYear() !== currentMonthDate.getFullYear()
    ) {
      setCurrentMonthDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    }
  };

  const defaultSlots =
    activeDay?.scheduledPeriods && activeDay.scheduledPeriods > 0 ? activeDay.scheduledPeriods : 7;

  // Partial leave local state
  const [partialAttended, setPartialAttended] = useState<number>(() =>
    activeDay?.status === 'PARTIAL_LEAVE'
      ? activeDay.actualAttended
      : Math.max(0, defaultSlots - 1)
  );

  React.useEffect(() => {
    if (activeDay) {
      setPartialAttended(
        activeDay.status === 'PARTIAL_LEAVE'
          ? activeDay.actualAttended
          : Math.max(0, defaultSlots - 1)
      );
    }
  }, [activeDay?.dateKey, activeDay?.status, activeDay?.actualAttended, defaultSlots]);

  const isCurrentlyAttending = activeDay?.status === 'ATTEND';
  const isCurrentlyLeave = activeDay?.status === 'LEAVE';
  const isCurrentlyPartial = activeDay?.status === 'PARTIAL_LEAVE';
  const isCurrentlyOff = activeDay?.status === 'HOLIDAY' || activeDay?.status === 'NO_CLASS';

  return (
    <section className="card calendar-planner-card">
      {/* 2. Redesigned Calendar Header */}
      <div className="card-header calendar-custom-header">
        <div>
          <span className="section-eyebrow text-emerald flex items-center gap-1.5 font-bold tracking-wider">
            <Sparkles size={14} className="text-[#00E5A0]" /> ATTENDANCE PLANNER
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1 font-['Outfit']">
            Plan Your Attendance
          </h2>
          <p className="helper text-[#A3A3A3] text-sm mt-1 max-w-xl">
            Choose a class day to plan your schedule, mark leave, or record partial attendance.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            className="btn btn-secondary py-1.5 px-3 text-xs font-semibold"
            onClick={resetToStartMonth}
            title="Jump back to the planner start month"
          >
            Start Month
          </button>
          <div className="flex items-center bg-[#101010] border border-[#262626] rounded-xl overflow-hidden shadow-inner">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#1A1A1A] transition-colors"
              aria-label="Previous month"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-3.5 text-sm font-bold font-['Outfit'] text-white min-w-[130px] text-center tracking-wide">
              {monthTitle}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#1A1A1A] transition-colors"
              aria-label="Next month"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Split-Pane Layout: Calendar on Left, Date Inspector on Right */}
      <div className="calendar-split-layout">
        {/* Left Column: Monthly Calendar Grid */}
        <div className="calendar-main-pane">
          {/* Simple Legend: 4 Clear Labels */}
          <div className="calendar-legend-bar">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5A0] shadow-[0_0_8px_rgba(0,229,160,0.5)]" />
              <span className="text-[#E0E0E0] font-semibold">🟢 Class</span>
              <span className="text-[#737373] text-[11px] hidden sm:inline">(Class scheduled)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C70] shadow-[0_0_8px_rgba(255,92,112,0.5)]" />
              <span className="text-[#E0E0E0] font-semibold">🔴 Leave</span>
              <span className="text-[#737373] text-[11px] hidden sm:inline">(Day off)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5B942] shadow-[0_0_8px_rgba(245,185,66,0.5)]" />
              <span className="text-[#E0E0E0] font-semibold">🟡 Partial</span>
              <span className="text-[#737373] text-[11px] hidden sm:inline">(Some classes)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
              <span className="text-[#E0E0E0] font-semibold">⚪ No Class</span>
              <span className="text-[#737373] text-[11px] hidden sm:inline">(Weekend/Holiday)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium ml-auto">
              <Target size={13} className="text-[#00E5A0]" />
              <span className="text-[#00E5A0] font-bold">🎯 Target Reached</span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="calendar-grid-header">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Date cells */}
          <div className="calendar-grid-body">
            {calendarCells.map((cell) => {
              const pred = cell.dayPrediction;
              const isSelected = cell.dateKey === effectiveSelectedKey;
              const isToday = cell.dateKey === todayKey;
              const isLeave = pred?.status === 'LEAVE';
              const isPartial = pred?.status === 'PARTIAL_LEAVE';
              const isHoliday = pred?.isHoliday;
              const isNoClass = pred?.status === 'NO_CLASS';
              const isMilestone = pred?.isRecoveryMilestone;
              const hasClasses = (pred?.scheduledPeriods ?? 0) > 0 && !isHoliday;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => pred && selectAndSyncMonth(cell.dateKey)}
                  disabled={!pred}
                  className={`cal-date-cell ${
                    !cell.isCurrentMonth
                      ? 'cell-out-month'
                      : isSelected
                      ? 'cell-selected'
                      : isLeave
                      ? 'cell-leave'
                      : isPartial
                      ? 'cell-partial'
                      : isMilestone
                      ? 'cell-milestone'
                      : isHoliday || isNoClass
                      ? 'cell-noclass'
                      : 'cell-attend'
                  }`}
                >
                  <div className="cell-top-row">
                    <span
                      className={`cell-day-num ${
                        isToday ? 'today-pill' : isMilestone ? 'milestone-num' : ''
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <div className="flex items-center gap-1">
                      {isToday && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30">
                          Today
                        </span>
                      )}
                      {isMilestone && (
                        <span className="cell-milestone-icon" title="Goal reached on this day!">
                          <Target size={12} className="stroke-[3] text-[#00E5A0]" />
                        </span>
                      )}
                      {isLeave && (
                        <span className="cell-leave-tag">
                          Leave
                        </span>
                      )}
                      {isPartial && (
                        <span className="cell-partial-tag">
                          Part
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="cell-content-row">
                    {hasClasses ? (
                      <div className="w-full flex flex-col justify-between">
                        <div className="cell-period-text">
                          {isLeave ? (
                            <span className="text-[#FF5C70] font-semibold">Missed {pred?.scheduledPeriods}</span>
                          ) : isPartial ? (
                            <span className="text-[#F5B942] font-semibold">{pred?.actualAttended}/{pred?.scheduledPeriods} classes</span>
                          ) : (
                            <span className="text-[#A3A3A3] font-medium">{pred?.scheduledPeriods} classes</span>
                          )}
                        </div>

                        {pred?.projectedPercentage !== undefined && (
                          <div className="cell-forecast-row" title="Total overall attendance after this day">
                            <span className="cell-forecast-lbl">Total:</span>
                            <span
                              className={`cell-forecast-val ${
                                pred.isTargetAchieved ? 'text-emerald' : 'text-rose'
                              }`}
                            >
                              {pred.projectedPercentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : isHoliday ? (
                      <div className="cell-off-text text-[#737373]">Holiday</div>
                    ) : (
                      <div className="cell-off-text text-[#525252]">No class</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Date Inspector */}
        <div className="calendar-inspector-pane">
          {activeDay ? (
            <div className="inspector-card">
              {/* Header with Day Navigator */}
              <div className="inspector-header">
                <div className="flex items-center justify-between mb-2">
                  <span className="inspector-eyebrow">
                    Plan for This Day
                  </span>
                  {/* Previous / Next Day Stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!prevDay}
                      onClick={() => prevDay && selectAndSyncMonth(prevDay.dateKey)}
                      className="p-1 rounded-md text-[#A3A3A3] hover:text-white hover:bg-[#202020] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Previous day"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={!nextDay}
                      onClick={() => nextDay && selectAndSyncMonth(nextDay.dateKey)}
                      className="p-1 rounded-md text-[#A3A3A3] hover:text-white hover:bg-[#202020] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Next day"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="inspector-title font-['Outfit']">
                  {activeDay.formattedDayDate}
                </h3>
                <p className="inspector-subtitle">
                  {activeDay.isHoliday
                    ? `🎉 Official Holiday: ${activeDay.holidayName || 'Holiday'}`
                    : activeDay.scheduledPeriods === 0
                    ? '☕ No classes scheduled on this day (Weekend/Off)'
                    : `📘 ${activeDay.scheduledPeriods} class periods scheduled for this day`}
                </p>
              </div>

              {/* Current Status Banner (Plain English) */}
              <div className="inspector-status-banner">
                {activeDay.isHoliday ? (
                  <div className="status-note note-gray">
                    <Coffee size={16} className="text-slate-400 shrink-0" />
                    <span>Official holiday. No attendance recorded today.</span>
                  </div>
                ) : activeDay.scheduledPeriods === 0 ? (
                  <div className="status-note note-gray">
                    <Coffee size={16} className="text-slate-400 shrink-0" />
                    <span>No classes today. Your attendance will not change.</span>
                  </div>
                ) : isCurrentlyLeave ? (
                  <div className="status-note note-rose">
                    <XCircle size={16} className="text-[#FF5C70] shrink-0" />
                    <span>
                      You are marked as <strong>Taking Leave</strong> (missing all {activeDay.scheduledPeriods} classes).
                    </span>
                  </div>
                ) : isCurrentlyPartial ? (
                  <div className="status-note note-amber">
                    <AlertTriangle size={16} className="text-[#F5B942] shrink-0" />
                    <span>
                      Attending <strong>{activeDay.actualAttended} of {activeDay.scheduledPeriods} classes</strong> (missing {activeDay.actualMissed}).
                    </span>
                  </div>
                ) : (
                  <div className="status-note note-emerald">
                    <CheckCircle2 size={16} className="text-[#00E5A0] shrink-0" />
                    <span>
                      You are marked as <strong>Attending All {activeDay.scheduledPeriods} Classes</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Status Selector: Plain English Choice Buttons */}
              <div className="pt-1">
                <span className="text-xs font-bold text-white block mb-2">
                  Choose what you want to do on this day:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* Attend All */}
                  <button
                    type="button"
                    onClick={() => onSetStatus(activeDay.dateKey, 'ATTEND')}
                    className={`status-choice-btn ${
                      isCurrentlyAttending ? 'status-choice-attend-active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className={isCurrentlyAttending ? 'text-[#00E5A0]' : 'text-[#737373]'} />
                      <span className="font-bold text-xs text-white">Attend All</span>
                    </div>
                    <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                      Present for {defaultSlots} classes
                    </span>
                  </button>

                  {/* Take Leave */}
                  <button
                    type="button"
                    onClick={() => onSetStatus(activeDay.dateKey, 'LEAVE')}
                    className={`status-choice-btn ${
                      isCurrentlyLeave ? 'status-choice-leave-active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle size={15} className={isCurrentlyLeave ? 'text-[#FF5C70]' : 'text-[#737373]'} />
                      <span className="font-bold text-xs text-white">Take Leave</span>
                    </div>
                    <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                      Miss all {defaultSlots} classes
                    </span>
                  </button>

                  {/* Partial Leave */}
                  <button
                    type="button"
                    onClick={() => {
                      const att = Math.min(defaultSlots, Math.max(0, partialAttended));
                      const miss = defaultSlots - att;
                      onSetStatus(activeDay.dateKey, 'PARTIAL_LEAVE', att, miss);
                    }}
                    className={`status-choice-btn ${
                      isCurrentlyPartial ? 'status-choice-partial-active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className={isCurrentlyPartial ? 'text-[#F5B942]' : 'text-[#737373]'} />
                      <span className="font-bold text-xs text-white">Partial Leave</span>
                    </div>
                    <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                      Attend some classes
                    </span>
                  </button>

                  {/* Holiday / Off */}
                  <button
                    type="button"
                    onClick={() => onSetStatus(activeDay.dateKey, 'HOLIDAY')}
                    className={`status-choice-btn ${
                      isCurrentlyOff ? 'status-choice-off-active' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Coffee size={15} className={isCurrentlyOff ? 'text-white' : 'text-[#737373]'} />
                      <span className="font-bold text-xs text-white">Holiday / Off</span>
                    </div>
                    <span className="text-[11px] text-[#A3A3A3] block mt-0.5">
                      No classes held
                    </span>
                  </button>
                </div>
              </div>

              {/* Partial Attendance Stepper */}
              {isCurrentlyPartial && (
                <div className="partial-stepper-container">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">
                      How many classes will you attend?
                    </span>
                    <span className="text-xs font-bold text-[#F5B942]">
                      {partialAttended} of {defaultSlots} classes
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={partialAttended <= 0}
                      onClick={() => {
                        const newVal = Math.max(0, partialAttended - 1);
                        setPartialAttended(newVal);
                        onSetStatus(activeDay.dateKey, 'PARTIAL_LEAVE', newVal, defaultSlots - newVal);
                      }}
                      className="stepper-btn"
                      aria-label="Decrease attended classes"
                    >
                      <Minus size={14} />
                    </button>

                    <div className="flex-1 text-center py-2 px-3 rounded-lg bg-[#141414] border border-[#262626]">
                      <span className="text-lg font-black text-white font-['Outfit']">{partialAttended}</span>
                      <span className="text-xs text-[#A3A3A3] ml-1">/ {defaultSlots} attended</span>
                    </div>

                    <button
                      type="button"
                      disabled={partialAttended >= defaultSlots}
                      onClick={() => {
                        const newVal = Math.min(defaultSlots, partialAttended + 1);
                        setPartialAttended(newVal);
                        onSetStatus(activeDay.dateKey, 'PARTIAL_LEAVE', newVal, defaultSlots - newVal);
                      }}
                      className="stepper-btn"
                      aria-label="Increase attended classes"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#A3A3A3] mt-2 text-center">
                    You will attend <strong className="text-white">{partialAttended}</strong> classes and miss{' '}
                    <strong className="text-[#FF5C70]">{defaultSlots - partialAttended}</strong> classes.
                  </p>
                </div>
              )}

              {/* Selected Date Cumulative Forecast */}
              {activeDay.scheduledPeriods > 0 && !activeDay.isHoliday && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] block">
                      Projected Cumulative Attendance
                    </span>
                    <span className="text-xs text-[#A3A3A3] mt-0.5">
                      {activeDay.runningAttended} of {activeDay.runningTotal} total classes attended
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xl font-black font-['Outfit'] ${
                        activeDay.isTargetAchieved ? 'text-[#00E5A0]' : 'text-[#FF5C70]'
                      }`}
                    >
                      {activeDay.projectedPercentage.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-[#737373] block mt-0.5">
                      {activeDay.isTargetAchieved ? (
                        <span className="text-[#00E5A0] font-semibold">At or above target</span>
                      ) : (
                        `Target: ${inputs.targetPercentage}%`
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="inspector-empty-state">
              <Sparkles size={28} className="text-[#00E5A0] mb-2" />
              <p className="text-sm font-bold text-white">Choose Any Date on the Calendar</p>
              <p className="text-xs text-[#A3A3A3] mt-1 max-w-[240px]">
                Click a class day to set your attendance status or mark leave.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
