import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Target,
} from 'lucide-react';
import type { PlannerCalculationSummary } from '../types/attendance';
import { formatDisplayDate, parseDateKey } from '../utils/calendar';

interface AttendanceRecoveryCardProps {
  summary: PlannerCalculationSummary;
}

const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatLongRecoveryDate(dateKey: string | null): string {
  if (!dateKey) return '';
  try {
    const d = parseDateKey(dateKey);
    const weekday = WEEKDAYS_LONG[d.getDay()];
    const day = d.getDate();
    const month = MONTHS_LONG[d.getMonth()];
    const year = d.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  } catch {
    return dateKey;
  }
}

const AttendanceRecoveryCardComponent: React.FC<AttendanceRecoveryCardProps> = ({ summary }) => {
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);

  const isTargetAchieved = summary.isOnTrack || summary.currentPercentage >= summary.targetPercentage;
  const is100TargetImpossible = summary.targetPercentage >= 100 && summary.currentPercentage < 100;
  const isReachable = summary.isTargetReachableThisSemester;
  const lastTeachingDateFormatted = formatDisplayDate(
    parseDateKey(summary.semesterMetrics.lastTeachingDate)
  );
  const recoveryDateFull = formatLongRecoveryDate(summary.recoveryDateKey);

  // Status and color classification
  const isCard3Caution =
    isReachable &&
    summary.projectedFinalPercentage >= summary.targetPercentage &&
    summary.projectedFinalPercentage < summary.targetPercentage + 2;

  const finalAttendanceColor = !isReachable
    ? '#FF5C70'
    : isCard3Caution
    ? '#F5B942'
    : '#00E5A0';

  return (
    <section id="recovery" className="card recovery-card rounded-2xl bg-[#080808] border border-[#202020]">
      {/* ========================================================================= */}
      {/* 1. SECTION TITLE & EXPLANATION                                            */}
      {/* ========================================================================= */}
      <div className="recovery-header pb-3.5 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-1.5 text-[#00E5A0] text-xs font-bold tracking-wider uppercase">
          <TrendingUp size={14} className="shrink-0" />
          <span>STRATEGIC RECOVERY PLAN</span>
        </div>
        <h2 className="recovery-title text-xl sm:text-2xl font-extrabold text-[#F5F5F5] tracking-tight mt-1.5 font-['Outfit'] break-words">
          Attendance Recovery Plan
        </h2>
        <p className="recovery-subtitle text-[#A3A3A3] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed break-words">
          Semester-aware attendance trajectory based on your remaining instructional timetable.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. RECOVERY STATUS BANNER & EXPECTED DATE                                 */}
      {/* ========================================================================= */}
      {!isReachable ? (
        /* Status: Target Not Reachable */
        <div className="recovery-status-banner mt-3.5 rounded-xl bg-[#FF5C70]/5 border border-[#FF5C70]/25 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="recovery-status-main flex items-start gap-3.5 flex-1 min-w-0 pr-0 lg:pr-3">
            <div className="recovery-status-icon w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#FF5C70]/12 border border-[#FF5C70]/25 flex items-center justify-center shrink-0 mt-0.5 text-[#FF5C70]">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF5C70]/15 text-[#FF5C70] border border-[#FF5C70]/25 whitespace-nowrap">
                  TARGET NOT REACHABLE
                </span>
                <span className="text-xs text-[#737373]">Teaching ends {lastTeachingDateFormatted}</span>
              </div>
              <h3 className="recovery-status-heading text-base sm:text-lg font-bold text-white font-['Outfit'] leading-snug tracking-tight break-words">
                Your target may not be reachable before teaching ends.
              </h3>
              <p className="recovery-status-text text-xs sm:text-sm text-[#A3A3A3] leading-relaxed pt-0.5 break-words">
                {is100TargetImpossible ? (
                  <>
                    Exact 100% attendance cannot be reached because you have missed{' '}
                    <strong className="text-[#FF5C70] font-semibold">{summary.missedSlots}</strong> class{' '}
                    {summary.missedSlots === 1 ? 'period' : 'periods'}.
                  </>
                ) : (
                  <>
                    You need to attend <strong className="text-white font-medium">{summary.periodsNeeded} more periods</strong> over{' '}
                    <strong className="text-white font-medium">{summary.classDaysNeeded} class days</strong>, but only{' '}
                    <strong className="text-[#FF5C70] font-semibold">{summary.classDaysRemaining} class days</strong> remain before teaching ends.
                  </>
                )}
              </p>
            </div>
          </div>

          {!is100TargetImpossible && summary.classDaysShortfall > 0 && (
            <div className="recovery-status-aside shrink-0 flex flex-col justify-center rounded-xl bg-[#040404] border border-[#FF5C70]/25 p-3.5 sm:p-4 w-full lg:w-[260px]">
              <div className="text-[10.5px] font-bold text-[#888888] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-[#FF5C70]" /> CURRENT SHORTFALL
              </div>
              <div className="recovery-status-aside-value text-lg lg:text-xl font-extrabold text-[#FF5C70] font-['Outfit'] tracking-tight leading-tight mb-1 break-words">
                {summary.classDaysShortfall} days & {summary.periodsShortfall} periods
              </div>
              <div className="text-xs text-[#737373] leading-normal break-words">
                Projected final: <strong className="text-white font-semibold">{summary.projectedFinalPercentage.toFixed(2)}%</strong> (target: {summary.targetPercentage}%)
              </div>
            </div>
          )}
        </div>
      ) : isTargetAchieved ? (
        /* Status: Target Already Achieved */
        <div className="recovery-status-banner mt-3.5 rounded-xl bg-[#00E5A0]/5 border border-[#00E5A0]/25 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="recovery-status-main flex items-start gap-3.5 flex-1 min-w-0 pr-0 lg:pr-3">
            <div className="recovery-status-icon w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#00E5A0]/12 border border-[#00E5A0]/25 flex items-center justify-center shrink-0 mt-0.5 text-[#00E5A0]">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/25 whitespace-nowrap">
                  TARGET ACHIEVED
                </span>
                <span className="text-xs text-[#737373]">No recovery required</span>
              </div>
              <h3 className="recovery-status-heading text-base sm:text-lg font-bold text-white font-['Outfit'] leading-snug tracking-tight break-words">
                You're already on track at {summary.currentPercentage.toFixed(2)}%!
              </h3>
              <p className="recovery-status-text text-xs sm:text-sm text-[#A3A3A3] leading-relaxed pt-0.5 break-words">
                You currently have <strong className="text-white font-medium">{summary.attendedSlots}</strong> out of{' '}
                <strong className="text-white font-medium">{summary.totalSlots}</strong> periods attended, exceeding your{' '}
                <strong className="text-[#00E5A0] font-semibold">{summary.targetPercentage}%</strong> target.
              </p>
            </div>
          </div>

          {summary.safeAbsenceAllowance > 0 && (
            <div className="recovery-status-aside shrink-0 flex flex-col justify-center rounded-xl bg-[#040404] border border-[#00E5A0]/25 p-3.5 sm:p-4 w-full lg:w-[260px]">
              <div className="text-[10.5px] font-bold text-[#888888] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#00E5A0]" /> SAFE ABSENCES REMAINING
              </div>
              <div className="recovery-status-aside-value text-lg lg:text-xl font-extrabold text-[#00E5A0] font-['Outfit'] tracking-tight leading-tight mb-1 break-words">
                {summary.safeAbsenceAllowance} periods
              </div>
              <div className="text-xs text-[#737373] leading-normal break-words">
                Can be missed safely without falling below target
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Status: Target Achievable */
        <div className="recovery-status-banner mt-3.5 rounded-xl bg-[#00E5A0]/5 border border-[#00E5A0]/25 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="recovery-status-main flex items-start gap-3.5 flex-1 min-w-0 pr-0 lg:pr-3">
            <div className="recovery-status-icon w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#00E5A0]/12 border border-[#00E5A0]/25 flex items-center justify-center shrink-0 mt-0.5 text-[#00E5A0]">
              <CheckCircle2 size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/25 whitespace-nowrap">
                  TARGET ACHIEVABLE
                </span>
                <span className="text-xs text-[#737373]">Before teaching ends</span>
              </div>
              <h3 className="recovery-status-heading text-base sm:text-lg font-bold text-white font-['Outfit'] leading-snug tracking-tight break-words">
                Your target is achievable before teaching ends.
              </h3>
              <p className="recovery-status-text text-xs sm:text-sm text-[#A3A3A3] leading-relaxed pt-0.5 break-words">
                Attend every scheduled class until <strong className="text-white font-semibold">{recoveryDateFull}</strong> ({summary.classDaysNeeded} class days, {summary.periodsNeeded} periods).
              </p>
            </div>
          </div>

          {summary.recoveryDateFormatted && (
            <div className="recovery-status-aside shrink-0 flex flex-col justify-center rounded-xl bg-[#040404] border border-[#00E5A0]/25 p-3.5 sm:p-4 w-full lg:w-[260px]">
              <div className="text-[10.5px] font-bold text-[#888888] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar size={12} className="text-[#00E5A0]" /> EXPECTED RECOVERY DATE
              </div>
              <div className="recovery-status-aside-value text-lg lg:text-xl font-extrabold text-[#00E5A0] font-['Outfit'] tracking-tight leading-tight mb-1 break-words">
                {summary.recoveryDateFormatted}
              </div>
              <div className="text-xs text-[#737373] leading-normal break-words">
                Projected attendance: <strong className="text-white font-semibold">{summary.projectedRecoveryPercentage?.toFixed(2)}%</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. THREE EQUAL-WIDTH METRIC CARDS                                         */}
      {/* ========================================================================= */}
      <div className="recovery-metrics-grid grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
        {/* CARD 1 — CLASS DAYS */}
        <div className="recovery-metric-card rounded-xl bg-[#080808] border border-[#202020] flex flex-col">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] flex items-center gap-1.5 shrink-0">
                <Calendar size={14} className={isReachable ? 'text-[#00E5A0]' : 'text-[#FF5C70]'} />
                CLASS DAYS
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  isReachable ? 'bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/20' : 'bg-[#FF5C70]/10 text-[#FF5C70] border border-[#FF5C70]/20'
                }`}
              >
                {isReachable ? (isTargetAchieved ? 'ON TRACK' : 'ACHIEVABLE') : 'SHORTFALL'}
              </span>
            </div>

            <div className="text-3xl sm:text-[34px] font-extrabold text-white font-['Outfit'] tracking-tight flex items-baseline gap-1.5 mb-1 leading-none">
              <span>{is100TargetImpossible ? '—' : summary.classDaysNeeded}</span>
              <span className="text-sm font-normal text-[#737373] font-sans">days needed</span>
            </div>

            <p className="text-xs sm:text-[13px] text-[#A3A3A3] leading-relaxed break-words mb-3">
              {isTargetAchieved
                ? 'No recovery class days needed.'
                : isReachable
                ? 'Attend every scheduled class on these days.'
                : 'Required class days exceed days remaining before teaching ends.'}
            </p>
          </div>

          <div className="recovery-metric-stats pt-3 border-t border-[#1C1C1C] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#737373] whitespace-nowrap">Class days remaining</span>
              <span className="font-semibold text-white font-mono-num shrink-0 text-right">{summary.classDaysRemaining} days</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#737373] whitespace-nowrap">Class-day shortfall</span>
              {summary.classDaysShortfall > 0 ? (
                <span className="font-bold text-[#FF5C70] font-mono-num shrink-0 text-right">
                  {summary.classDaysShortfall} days short
                </span>
              ) : (
                <span className="font-medium text-[#00E5A0] font-mono-num shrink-0 text-right">
                  0 days (No shortfall)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2 — PERIODS */}
        <div className="recovery-metric-card rounded-xl bg-[#080808] border border-[#202020] flex flex-col">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] flex items-center gap-1.5 shrink-0">
                <Layers size={14} className={isReachable ? 'text-[#00E5A0]' : 'text-[#FF5C70]'} />
                PERIODS
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  isReachable ? 'bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/20' : 'bg-[#FF5C70]/10 text-[#FF5C70] border border-[#FF5C70]/20'
                }`}
              >
                {isReachable ? (isTargetAchieved ? 'ON TRACK' : 'REQUIRED') : 'SHORTFALL'}
              </span>
            </div>

            <div className="text-3xl sm:text-[34px] font-extrabold text-white font-['Outfit'] tracking-tight flex items-baseline gap-1.5 mb-1 leading-none">
              <span>{is100TargetImpossible ? '—' : summary.periodsNeeded}</span>
              <span className="text-sm font-normal text-[#737373] font-sans">periods required</span>
            </div>

            <p className="text-xs sm:text-[13px] text-[#A3A3A3] leading-relaxed break-words mb-3">
              {isTargetAchieved
                ? 'No additional recovery periods required.'
                : 'Periods you need to attend to reach your target.'}
            </p>
          </div>

          <div className="recovery-metric-stats pt-3 border-t border-[#1C1C1C] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#737373] whitespace-nowrap">Scheduled periods remaining</span>
              <span className="font-semibold text-white font-mono-num shrink-0 text-right">{summary.periodsRemaining} periods</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#737373] whitespace-nowrap">Period shortfall</span>
              {summary.periodsShortfall > 0 ? (
                <span className="font-bold text-[#FF5C70] font-mono-num shrink-0 text-right">
                  {summary.periodsShortfall} periods short
                </span>
              ) : (
                <span className="font-medium text-[#00E5A0] font-mono-num shrink-0 text-right">
                  0 periods (No shortfall)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3 — FINAL ATTENDANCE */}
        <div className="recovery-metric-card rounded-xl bg-[#080808] border border-[#202020] flex flex-col">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3] flex items-center gap-1.5 shrink-0">
                <Target size={14} style={{ color: finalAttendanceColor }} />
                FINAL ATTENDANCE
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  !isReachable
                    ? 'bg-[#FF5C70]/10 text-[#FF5C70] border border-[#FF5C70]/20'
                    : isCard3Caution
                    ? 'bg-[#F5B942]/10 text-[#F5B942] border border-[#F5B942]/20'
                    : 'bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/20'
                }`}
              >
                {!isReachable ? 'UNREACHABLE' : isCard3Caution ? 'CAUTION' : 'ON TARGET'}
              </span>
            </div>

            <div
              className="text-3xl sm:text-[34px] font-extrabold font-['Outfit'] tracking-tight font-mono-num break-words mb-1 leading-none"
              style={{ color: finalAttendanceColor }}
            >
              {summary.projectedFinalPercentage.toFixed(2)}%
            </div>

            <p className="text-xs sm:text-[13px] text-[#A3A3A3] leading-relaxed break-words mb-3">
              If you attend every remaining scheduled period.
            </p>
          </div>

          <div className="recovery-metric-stats pt-3 border-t border-[#1C1C1C] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#737373] whitespace-nowrap">Required target</span>
              <span className="font-semibold text-white font-mono-num shrink-0 text-right">{summary.targetPercentage}%</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#737373] whitespace-nowrap">Percentage-point difference</span>
              {summary.percentagePointDiff >= 0 ? (
                <span className="font-bold text-[#00E5A0] font-mono-num shrink-0 text-right">
                  +{summary.percentagePointDiff.toFixed(2)}%
                </span>
              ) : (
                <span className="font-bold text-[#FF5C70] font-mono-num shrink-0 text-right">
                  {summary.percentagePointDiff.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CALCULATION RULES DISCLOSURE                                           */}
      {/* ========================================================================= */}
      <div className="recovery-footer mt-4 pt-3.5 border-t border-[#1C1C1C]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-[#737373] leading-relaxed">
            Calculated against your timetable schedule ending on {lastTeachingDateFormatted}.
          </p>
          <button
            type="button"
            onClick={() => setShowCalculationDetails((prev) => !prev)}
            className="recovery-rules-toggle-btn w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 py-1.5 px-3 rounded-lg sm:rounded-md bg-[#0E0E0E] sm:bg-transparent border border-[#222222] sm:border-transparent text-xs font-semibold text-[#00E5A0] hover:text-[#00c98d] transition-colors cursor-pointer select-none active:bg-[#161616] sm:active:bg-transparent min-h-[36px] sm:min-h-0"
            aria-expanded={showCalculationDetails}
          >
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle size={13} className="shrink-0" />
              <span>Calculation Rules</span>
            </span>
            {showCalculationDetails ? <ChevronUp size={13} className="shrink-0" /> : <ChevronDown size={13} className="shrink-0" />}
          </button>
        </div>

        {showCalculationDetails && (
          <div className="recovery-rules-panel mt-2.5 p-3 sm:p-3.5 rounded-lg bg-[#0C0C0C] border border-[#1C1C1C] text-xs text-[#A3A3A3] space-y-2 leading-relaxed break-words">
            <p>
              • <strong>Teaching Window Limit:</strong> Normal classes stop on the last instructional day ({lastTeachingDateFormatted}). Examinations, prep days, and holidays add zero periods.
            </p>
            <p>
              • <strong>Timetable Schedule:</strong> Daily periods are counted strictly based on your Monday–Saturday class schedule. Sundays and official holidays are excluded.
            </p>
            <p>
              • <strong>Independent Shortfalls:</strong> Both class day shortfalls and period shortfalls are computed independently against scheduled classes.
            </p>
            <p>
              • <strong>No False Recovery Dates:</strong> The planner will never display a recovery date beyond the configured semester teaching period.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export const AttendanceRecoveryCard = React.memo(AttendanceRecoveryCardComponent);
