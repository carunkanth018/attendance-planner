import React, { useState } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Coffee,
} from 'lucide-react';
import type { DayPrediction, DaySimulationStatus } from '../types/attendance';
import { calculatePercentage } from '../utils/attendance';

interface DateDetailsModalProps {
  day: DayPrediction | null;
  onClose: () => void;
  onSetStatus: (
    dateKey: string,
    status: DaySimulationStatus,
    attendedPeriods?: number,
    missedPeriods?: number
  ) => void;
}

interface DateDetailsModalContentProps {
  day: DayPrediction;
  onClose: () => void;
  onSetStatus: (
    dateKey: string,
    status: DaySimulationStatus,
    attendedPeriods?: number,
    missedPeriods?: number
  ) => void;
}

const DateDetailsModalContent: React.FC<DateDetailsModalContentProps> = ({
  day,
  onClose,
  onSetStatus,
}) => {
  const defaultSlots =
    day.scheduledPeriods > 0
      ? day.scheduledPeriods
      : (day.originalScheduledPeriods ?? 0) > 0
      ? (day.originalScheduledPeriods ?? 0)
      : 6;
  const isPartial = day.status === 'PARTIAL_LEAVE';

  const [selectedStatus, setSelectedStatus] = useState<DaySimulationStatus>(day.status);
  const [partialAttended, setPartialAttended] = useState<number>(
    isPartial ? day.actualAttended : Math.max(0, defaultSlots - 1)
  );

  // Live calculation preview if modified
  const currentAttendedBase = day.runningAttended - day.actualAttended;
  const currentTotalBase = day.runningTotal - (day.actualAttended + day.actualMissed);

  // Projected if Attend
  const attendPct = calculatePercentage(
    currentAttendedBase + defaultSlots,
    currentTotalBase + defaultSlots
  );

  // Projected if Leave
  const leavePct = calculatePercentage(
    currentAttendedBase,
    currentTotalBase + defaultSlots
  );

  // Projected if Holiday/Off
  const holidayPct = calculatePercentage(currentAttendedBase, currentTotalBase);

  // Projected if Partial
  const safeAttended = Math.min(defaultSlots, Math.max(0, partialAttended));
  const partialPct = calculatePercentage(
    currentAttendedBase + safeAttended,
    currentTotalBase + defaultSlots
  );

  const handleApply = () => {
    if (selectedStatus === 'PARTIAL_LEAVE') {
      const att = Math.min(defaultSlots, Math.max(0, partialAttended));
      const miss = defaultSlots - att;
      onSetStatus(day.dateKey, 'PARTIAL_LEAVE', att, miss);
    } else {
      onSetStatus(day.dateKey, selectedStatus);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#080808] border border-[#202020] rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#202020] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0C0C0C] text-[#00E5A0] border border-[#202020]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Outfit'] text-white">
                Edit Schedule: {day.formattedDayDate}
              </h3>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                {day.scheduledPeriods > 0
                  ? `${day.scheduledPeriods} periods scheduled on this day`
                  : 'Zero periods scheduled (Non-class / Holiday)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#141414] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Option Radios */}
        <div className="mt-5">
          <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block mb-2.5">
            Select Status for this Day:
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Attend */}
            <button
              type="button"
              onClick={() => setSelectedStatus('ATTEND')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                selectedStatus === 'ATTEND'
                  ? 'bg-[#00E5A0]/10 border-[#00E5A0] text-white'
                  : 'bg-[#0C0C0C] border-[#202020] hover:border-[#333333] text-[#A3A3A3]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#00E5A0] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-white">Attend Full Day</strong>
                <span className="text-[11px] text-[#A3A3A3]">
                  Present for {defaultSlots} periods
                </span>
              </div>
            </button>

            {/* Leave / Absent */}
            <button
              type="button"
              onClick={() => setSelectedStatus('LEAVE')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                selectedStatus === 'LEAVE'
                  ? 'bg-[#FF5C70]/10 border-[#FF5C70] text-white'
                  : 'bg-[#0C0C0C] border-[#202020] hover:border-[#333333] text-[#A3A3A3]'
              }`}
            >
              <XCircle className="w-4 h-4 text-[#FF5C70] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-white">Absent / Leave</strong>
                <span className="text-[11px] text-[#A3A3A3]">
                  Miss all {defaultSlots} periods
                </span>
              </div>
            </button>

            {/* Partial Attendance */}
            <button
              type="button"
              onClick={() => setSelectedStatus('PARTIAL_LEAVE')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                selectedStatus === 'PARTIAL_LEAVE'
                  ? 'bg-[#F5B942]/10 border-[#F5B942] text-white'
                  : 'bg-[#0C0C0C] border-[#202020] hover:border-[#333333] text-[#A3A3A3]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-[#F5B942] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-white">Partial Attendance</strong>
                <span className="text-[11px] text-[#A3A3A3]">
                  Attend only some periods
                </span>
              </div>
            </button>

            {/* Holiday / No Classes */}
            <button
              type="button"
              onClick={() => setSelectedStatus('HOLIDAY')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                selectedStatus === 'HOLIDAY' || selectedStatus === 'NO_CLASS'
                  ? 'bg-[#181818] border-[#333333] text-white'
                  : 'bg-[#0C0C0C] border-[#202020] hover:border-[#333333] text-[#A3A3A3]'
              }`}
            >
              <Coffee className="w-4 h-4 text-[#A3A3A3] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-white">Holiday / No Class</strong>
                <span className="text-[11px] text-[#A3A3A3]">
                  0 periods conducted
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Partial Input (if selected) */}
        {selectedStatus === 'PARTIAL_LEAVE' && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#050505] border border-[#202020]">
            <span className="text-xs font-bold text-[#A3A3A3] block mb-2">
              Specify Attended Periods for this Day:
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A3A3A3]">Attended:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={partialAttended}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    const num =
                      clean === ''
                        ? 0
                        : Math.min(
                            defaultSlots,
                            Math.max(0, parseInt(clean, 10))
                          );
                    setPartialAttended(num);
                  }}
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                  className="w-16 h-8 text-center text-xs font-bold bg-[#0C0C0C] border border-[#202020] rounded-lg text-white"
                />
                <span className="text-xs text-[#A3A3A3]">
                  / {defaultSlots} periods
                </span>
              </div>
              <span className="text-xs text-[#FF5C70] ml-auto font-medium">
                ({defaultSlots - safeAttended} missed)
              </span>
            </div>
          </div>
        )}

        {/* Live Preview Impact */}
        <div className="mt-5 p-4 rounded-xl bg-[#050505] border border-[#202020]">
          <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00E5A0]" />
            Projected End-of-Day Impact for this selection:
          </span>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[#737373] block">Selected Outcome:</span>
              <strong className="text-sm font-semibold text-white">
                {selectedStatus === 'ATTEND'
                  ? `Attend all ${defaultSlots} periods`
                  : selectedStatus === 'LEAVE'
                  ? `Miss all ${defaultSlots} periods`
                  : selectedStatus === 'PARTIAL_LEAVE'
                  ? `Attend ${safeAttended} / ${defaultSlots} periods`
                  : 'Holiday (0 periods)'}
              </strong>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#737373] block">End-of-day %:</span>
              <span className="text-xl font-bold font-['Outfit'] text-[#00E5A0]">
                {selectedStatus === 'ATTEND'
                  ? `${attendPct.toFixed(2)}%`
                  : selectedStatus === 'LEAVE'
                  ? `${leavePct.toFixed(2)}%`
                  : selectedStatus === 'PARTIAL_LEAVE'
                  ? `${partialPct.toFixed(2)}%`
                  : `${holidayPct.toFixed(2)}%`}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#737373] mt-2 pt-2 border-t border-[#202020]">
            * Note: Saving this will automatically recalculate this date and all subsequent forecast days.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#202020]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A3A3A3] hover:text-white bg-[#0C0C0C] hover:bg-[#181818] border border-[#202020] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-bold text-[#050505] bg-[#00E5A0] hover:bg-[#00C98D] rounded-xl transition-all cursor-pointer"
          >
            Save &amp; Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};

export const DateDetailsModal: React.FC<DateDetailsModalProps> = ({
  day,
  onClose,
  onSetStatus,
}) => {
  if (!day) return null;

  return (
    <DateDetailsModalContent
      key={day.dateKey}
      day={day}
      onClose={onClose}
      onSetStatus={onSetStatus}
    />
  );
};
