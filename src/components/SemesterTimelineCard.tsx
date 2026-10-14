import React from 'react';
import {
  CalendarDays,
  GraduationCap,
  Clock,
  BookOpen,
  CalendarCheck2,
  TrendingUp,
} from 'lucide-react';
import type { SemesterMetrics } from '../types/attendance';
import { formatDisplayDate, parseDateKey } from '../utils/calendar';

interface SemesterTimelineCardProps {
  metrics: SemesterMetrics;
  targetPercentage: number;
  onEditSemester: () => void;
}

const SemesterTimelineCardComponent: React.FC<SemesterTimelineCardProps> = ({
  metrics,
  targetPercentage,
  onEditSemester,
}) => {
  const lastTeachingDateFormatted = formatDisplayDate(parseDateKey(metrics.lastTeachingDate));
  const semesterEndDateFormatted = formatDisplayDate(parseDateKey(metrics.semesterEndDate));

  const isFinalOnTrack = metrics.projectedFinalPercentage >= targetPercentage;

  return (
    <section id="semester" className="card semester-timeline-card">
      {/* 1. Boxed Header Card matching the metric cards below */}
      <div className="semester-timeline-header-card p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#080808] border border-[#202020] mb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <span className="section-eyebrow text-emerald flex items-center gap-1.5 font-bold tracking-wider mb-1">
              <GraduationCap size={15} className="text-[#00E5A0]" /> CURRENT SEMESTER TIMELINE
            </span>
            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-['Outfit'] break-words">
                {metrics.semesterName}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0C0C0C] text-[#A3A3A3] border border-[#202020] shrink-0">
                {metrics.academicYear}
              </span>
            </div>
            <p className="helper text-[#A3A3A3] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed break-words">
              Forecast bounded to your semester teaching end date. Reference calendar dates are editable.
            </p>
          </div>

          <button
            type="button"
            onClick={onEditSemester}
            className="btn btn-secondary text-xs flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#202020] hover:border-[#333333] transition-all cursor-pointer shrink-0 self-start"
            title="Edit academic calendar dates and exam schedules"
          >
            <CalendarDays size={13} className="text-[#00E5A0]" />
            <span>Edit Semester Dates</span>
          </button>
        </div>
      </div>

      {/* 2. Key Semester Metrics Grid (Side-by-side on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Days to Semester End */}
        <div className="stat-card p-4 rounded-xl bg-[#080808] border border-[#202020]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1">
              <Clock size={13} className="text-[#A3A3A3]" /> Days to Sem End
            </span>
            <span className="stat-pill text-[10px] text-[#A3A3A3] bg-[#141414] border border-[#202020] px-1.5 py-0.5 rounded">
              CALENDAR
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-['Outfit']">
            {metrics.calendarDaysRemaining}{' '}
            <span className="text-sm font-semibold text-[#A3A3A3]">days</span>
          </div>
          <div className="text-[11px] text-[#737373] mt-1 font-medium">
            Ends {semesterEndDateFormatted}
          </div>
        </div>

        {/* Metric 2: Scheduled Teaching Days Remaining */}
        <div className="stat-card p-4 rounded-xl bg-[#080808] border border-[#202020]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#00E5A0] uppercase tracking-wider flex items-center gap-1">
              <CalendarCheck2 size={13} className="text-[#00E5A0]" /> Teaching Days
            </span>
            <span className="stat-pill text-[10px] text-[#00E5A0] bg-[#00E5A0]/10 border border-[#00E5A0]/20 px-1.5 py-0.5 rounded font-bold">
              CLASSES
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-['Outfit']">
            {metrics.teachingDaysRemaining}{' '}
            <span className="text-sm font-semibold text-[#A3A3A3]">class days</span>
          </div>
          <div className="text-[11px] text-[#737373] mt-1 font-medium">
            Until {lastTeachingDateFormatted}
          </div>
        </div>

        {/* Metric 3: Scheduled Teaching Periods Remaining */}
        <div className="stat-card p-4 rounded-xl bg-[#080808] border border-[#202020]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1">
              <BookOpen size={13} className="text-[#A3A3A3]" /> Teaching Periods
            </span>
            <span className="stat-pill text-[10px] text-[#A3A3A3] bg-[#141414] border border-[#202020] px-1.5 py-0.5 rounded">
              PERIODS
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-['Outfit']">
            {metrics.teachingPeriodsRemaining}{' '}
            <span className="text-sm font-semibold text-[#A3A3A3]">periods</span>
          </div>
          <div className="text-[11px] text-[#737373] mt-1 font-medium">
            Scheduled instruction left
          </div>
        </div>

        {/* Metric 4: Projected Attendance on Last Teaching Day */}
        <div className="stat-card p-4 rounded-xl bg-[#080808] border border-[#202020]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={13} className={isFinalOnTrack ? 'text-[#00E5A0]' : 'text-[#FF5C70]'} /> Projected Final
            </span>
            <span
              className={`stat-pill text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isFinalOnTrack
                  ? 'text-[#00E5A0] bg-[#00E5A0]/10 border border-[#00E5A0]/20'
                  : 'text-[#FF5C70] bg-[#FF5C70]/10 border border-[#FF5C70]/20'
              }`}
            >
              {isFinalOnTrack ? 'ON TARGET' : 'BELOW GOAL'}
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold font-['Outfit'] ${
              isFinalOnTrack ? 'text-[#00E5A0]' : 'text-[#FF5C70]'
            }`}
          >
            {metrics.projectedFinalPercentage.toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#737373] mt-1 font-medium">
            {metrics.projectedFinalAttended} / {metrics.projectedFinalTotal} periods on {lastTeachingDateFormatted}
          </div>
        </div>
      </div>
    </section>
  );
};

export const SemesterTimelineCard = React.memo(SemesterTimelineCardComponent);
