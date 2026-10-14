import React, { useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Target,
  Coffee,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { DayPrediction, AttendanceInputs } from '../types/attendance';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface SwipeableForecastRowProps {
  day: DayPrediction;
  inputs: AttendanceInputs;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (dateKey: string) => void;
  onSelectDate: (dateKey: string) => void;
  onEditDate: (dateKey: string) => void;
  onMarkLeave: (day: DayPrediction) => void;
  onRequestHoliday: (day: DayPrediction) => void;
  activeSwipingDate?: string | null;
  setActiveSwipingDate?: (dateKey: string | null) => void;
}

const SwipeableForecastRowComponent: React.FC<SwipeableForecastRowProps> = ({
  day,
  inputs,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelectDate,
  onEditDate,
  onMarkLeave,
  onRequestHoliday,
  activeSwipingDate,
  setActiveSwipingDate,
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const cueLabelRef = useRef<HTMLSpanElement | null>(null);
  const cueContainerRef = useRef<HTMLSpanElement | null>(null);

  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const directionLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);
  const didSwipeRef = useRef<boolean>(false);
  const isSwipingRef = useRef<boolean>(false);
  const reachedThresholdRef = useRef<boolean>(false);
  const currentOffsetRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const isLeave = day.status === 'LEAVE';
  const isPartial = day.status === 'PARTIAL_LEAVE';
  const isHoliday = day.isHoliday || day.status === 'HOLIDAY';
  const isNoClass = day.status === 'NO_CLASS';
  const isManualHoliday = Boolean(
    day.isManualHoliday || (day.status === 'HOLIDAY' && !day.isOfficialHoliday)
  );
  const isMilestone = day.isRecoveryMilestone && !isLeave && !isHoliday;

  const isSwipeable =
    !isHoliday &&
    !isNoClass &&
    (day.scheduledPeriods > 0 || isLeave || isPartial);

  const isHolidayEligible =
    !day.isOfficialHoliday &&
    !day.isPastTeachingEnd &&
    !isNoClass &&
    (day.scheduledPeriods > 0 ||
      isLeave ||
      isPartial ||
      isManualHoliday ||
      (day.originalScheduledPeriods ?? 0) > 0);

  // Deliberate horizontal swipe activation threshold (~50px)
  const SWIPE_THRESHOLD = 50;

  // Direct DOM visual update scheduled once per display refresh frame
  const updateVisuals = () => {
    rafIdRef.current = null;
    const offset = currentOffsetRef.current;
    const surface = surfaceRef.current;
    const backdrop = backdropRef.current;
    const cueLabel = cueLabelRef.current;
    const cueContainer = cueContainerRef.current;

    if (surface) {
      surface.style.transform = `translate3d(${offset}px, 0, 0)`;
    }

    if (backdrop) {
      const absOffset = Math.abs(offset);
      const opacity = Math.min(1, Math.max(0, absOffset / 45));
      backdrop.style.opacity = String(opacity);

      const isReached = absOffset >= SWIPE_THRESHOLD;
      if (isReached !== reachedThresholdRef.current) {
        reachedThresholdRef.current = isReached;

        if (isLeave) {
          if (isReached) {
            backdrop.classList.add('bg-[#00E5A0]/25');
            backdrop.classList.remove('bg-[#00E5A0]/15');
          } else {
            backdrop.classList.remove('bg-[#00E5A0]/25');
            backdrop.classList.add('bg-[#00E5A0]/15');
          }
          if (cueLabel) {
            cueLabel.textContent = isReached
              ? 'Release to Restore Attendance'
              : 'Restore Attendance';
          }
        } else {
          if (isReached) {
            backdrop.classList.add('bg-[#FF5C70]/25');
            backdrop.classList.remove('bg-[#FF5C70]/15');
          } else {
            backdrop.classList.remove('bg-[#FF5C70]/25');
            backdrop.classList.add('bg-[#FF5C70]/15');
          }
          if (cueLabel) {
            cueLabel.textContent = isReached
              ? 'Release to Mark Planned Leave'
              : 'Mark Planned Leave';
          }
        }

        if (cueContainer) {
          if (isReached) {
            cueContainer.classList.add('opacity-100', 'font-extrabold');
            cueContainer.classList.remove('opacity-80');
          } else {
            cueContainer.classList.remove('opacity-100', 'font-extrabold');
            cueContainer.classList.add('opacity-80');
          }
        }
      }
    }
  };

  const cleanupGesture = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (pointerIdRef.current !== null && rowRef.current) {
      try {
        rowRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Ignore release failures
      }
    }
    const surface = surfaceRef.current;
    if (surface) {
      surface.style.transition =
        'transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1)';
      surface.style.transform = 'translate3d(0px, 0, 0)';
      surface.style.willChange = '';
      surface.classList.remove('cursor-grabbing', 'select-none');
      if (isSwipeable) {
        surface.classList.add('cursor-grab');
      }
    }
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.style.transition =
        'opacity 220ms cubic-bezier(0.2, 0.9, 0.3, 1), background-color 0.15s ease';
      backdrop.style.opacity = '0';
    }
    startPosRef.current = null;
    pointerIdRef.current = null;
    directionLockRef.current = null;
    isSwipingRef.current = false;
    currentOffsetRef.current = 0;
    reachedThresholdRef.current = false;
    if (activeSwipingDate === day.dateKey) {
      setActiveSwipingDate?.(null);
    }
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button (left mouse click or touch)
    if (e.button !== 0) return;

    // Ignore interactive controls
    if (
      (e.target as HTMLElement).closest(
        'button, a, input, select, textarea, [data-no-swipe="true"]'
      )
    ) {
      return;
    }
    if (!isSwipeable) return;

    // Cancel any in-flight snap animation or pending frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    startPosRef.current = { x: e.clientX, y: e.clientY };
    pointerIdRef.current = e.pointerId;
    directionLockRef.current = null;
    hasTriggeredRef.current = false;
    didSwipeRef.current = false;
    isSwipingRef.current = false;
    reachedThresholdRef.current = false;
    currentOffsetRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current || hasTriggeredRef.current || e.pointerId !== pointerIdRef.current) {
      return;
    }

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Detect gesture direction early: disambiguate vertical scrolling vs horizontal swipe
    if (directionLockRef.current === null) {
      // If movement is predominantly vertical, lock to vertical immediately
      // and NEVER capture pointer, allowing natural fluid vertical scrolling
      if (absY >= 8 && absY >= absX) {
        directionLockRef.current = 'vertical';
        return;
      }

      // If movement is deliberate and predominantly horizontal (>35 deg from vertical)
      if (absX >= 12 && absX >= absY * 1.4) {
        directionLockRef.current = 'horizontal';
        isSwipingRef.current = true;
        setActiveSwipingDate?.(day.dateKey);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture failures
        }

        const surface = surfaceRef.current;
        if (surface) {
          surface.style.transition = 'none';
          surface.style.willChange = 'transform';
          surface.classList.remove('cursor-grab');
          surface.classList.add('cursor-grabbing', 'select-none');
        }
        const backdrop = backdropRef.current;
        if (backdrop) {
          backdrop.style.transition = 'none';
        }
      } else {
        // Still within ambiguous deadzone, wait for clear gesture direction
        return;
      }
    }

    if (directionLockRef.current === 'horizontal') {
      let constrained = 0;
      if (!isLeave) {
        // Right swipe marks leave (positive dx)
        constrained = Math.max(0, Math.min(85, dx * 0.75));
      } else {
        // Left swipe restores attend (negative dx)
        constrained = Math.min(0, Math.max(-85, dx * 0.75));
      }

      currentOffsetRef.current = constrained;

      // Schedule visual update on next animation frame if not already scheduled
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(updateVisuals);
      }
    }
  };

  const handlePointerUp = (_e: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current) {
      cleanupGesture();
      return;
    }

    // Cancel pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const wasHorizontal = directionLockRef.current === 'horizontal';

    if (wasHorizontal) {
      didSwipeRef.current = true;

      const reached = Math.abs(currentOffsetRef.current) >= SWIPE_THRESHOLD;
      if (reached && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onMarkLeave(day);
      }
    }

    // Release pointer capture
    if (pointerIdRef.current !== null && rowRef.current) {
      try {
        rowRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Ignore release failures
      }
    }

    // Smoothly snap back to resting position with 220ms transition
    const surface = surfaceRef.current;
    if (surface) {
      surface.style.transition =
        'transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1)';
      surface.style.transform = 'translate3d(0px, 0, 0)';
      surface.style.willChange = '';
      surface.classList.remove('cursor-grabbing', 'select-none');
      if (isSwipeable) {
        surface.classList.add('cursor-grab');
      }
    }

    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.style.transition =
        'opacity 220ms cubic-bezier(0.2, 0.9, 0.3, 1), background-color 0.15s ease';
      backdrop.style.opacity = '0';
    }

    startPosRef.current = null;
    pointerIdRef.current = null;
    directionLockRef.current = null;
    isSwipingRef.current = false;
    currentOffsetRef.current = 0;
    reachedThresholdRef.current = false;
    if (activeSwipingDate === day.dateKey) {
      setActiveSwipingDate?.(null);
    }
  };

  const handlePointerCancel = () => {
    cleanupGesture();
  };

  const handleRowClick = () => {
    if (didSwipeRef.current || isSwipingRef.current) {
      didSwipeRef.current = false;
      return;
    }
    onSelectDate(day.dateKey);
    if (isHolidayEligible) {
      onToggleExpand(day.dateKey);
    } else {
      onToggleExpand('');
    }
  };

  const statusClass = isLeave
    ? 'row-leave'
    : isHoliday
    ? 'row-holiday'
    : isPartial
    ? 'row-partial'
    : isNoClass
    ? 'row-off'
    : isMilestone
    ? 'row-milestone'
    : isSelected
    ? 'row-selected'
    : 'row-attend';

  // Precomputed marker value directly from day prediction (zero re-render math)
  const markerValue = day.markerValue;

  const timelineDateFormatted = `${day.dateObj.getDate()} ${MONTHS_SHORT[day.dateObj.getMonth()]} ${day.dateObj.getFullYear()}`;

  let rowBg = '#03170D';
  let rowBorder = '#00E5A0';
  let badgeClass = 'bg-[#00E5A0] text-black';

  if (isLeave) {
    rowBg = '#190608';
    rowBorder = '#FF5C70';
    badgeClass = 'bg-[#FF5C70] text-black';
  } else if (isHoliday || isPartial) {
    rowBg = '#191304';
    rowBorder = '#F5B942';
    badgeClass = 'bg-[#F5B942] text-black';
  } else if (isNoClass) {
    rowBg = '#0A0E0C';
    rowBorder = '#1C2B22';
    badgeClass = 'bg-[#222E27] text-[#9EA8A2]';
  }

  return (
    <div
      ref={rowRef}
      className="swipeable-row-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Swipe Cue Backdrop with clear visual feedback */}
      {isSwipeable && (
        <div
          ref={backdropRef}
          className={`swipe-action-backdrop absolute inset-0 flex items-center px-4 transition-colors duration-200 ${
            isLeave
              ? 'justify-end bg-[#00E5A0]/15 text-[#00E5A0]'
              : 'justify-start bg-[#FF5C70]/15 text-[#FF5C70]'
          }`}
          style={{
            opacity: 0,
            transition: 'opacity 220ms cubic-bezier(0.2, 0.9, 0.3, 1), background-color 0.15s ease',
          }}
          aria-hidden="true"
        >
          <span
            ref={cueContainerRef}
            className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-all duration-150 opacity-80"
          >
            {isLeave ? (
              <>
                <span ref={cueLabelRef}>Restore Attendance</span>
                <CheckCircle2 size={16} />
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span ref={cueLabelRef}>Mark Planned Leave</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Main Row / Card Surface */}
      <div
        ref={surfaceRef}
        style={{
          transform: 'translate3d(0px, 0, 0)',
          transition: 'transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className={`timeline-row ${
          isSwipeable
            ? 'cursor-grab'
            : 'cursor-default'
        } ${statusClass}`}
        onClick={(e) => {
          if (
            (e.target as HTMLElement).closest(
              'button, a, input, select, textarea, [data-no-swipe="true"]'
            )
          ) {
            return;
          }
          if (didSwipeRef.current || isSwipingRef.current) {
            didSwipeRef.current = false;
            return;
          }
          handleRowClick();
        }}
      >
        {/* Recovery Milestone Banner */}
        {isMilestone && (
          <div className="milestone-badge-bar">
            <Target size={13} className="text-[#00E5A0]" />
            <span>Target Recovery Milestone (Crosses {inputs.targetPercentage}% Target!)</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DESKTOP VIEW (Tablet & Desktop: Aligned Horizontal Row)                   */}
        {/* ========================================================================= */}
        <div className="timeline-row-desktop timeline-row-grid">
          {/* Col 1: Date & Day */}
          <div className="col-date">
            <div className="flex items-center gap-2">
              {isSwipeable && (
                <span
                  className="swipe-hint-control inline-flex items-center justify-center text-[#555] hover:text-[#FF5C70] transition-colors cursor-grab"
                  title={isLeave ? 'Swipe LEFT or click Attend to restore class' : 'Swipe RIGHT to mark Planned Leave'}
                  data-no-swipe="true"
                >
                  {isLeave ? (
                    <ArrowLeft size={13} className="text-[#00E5A0] opacity-70" />
                  ) : (
                    <ArrowRight size={13} className="opacity-60" />
                  )}
                </span>
              )}
              <span className="font-bold text-white text-base font-['Outfit'] transition-opacity hover:opacity-90">
                {day.formattedDate}
              </span>
              <span className="text-xs text-[#A3A3A3] font-medium">
                {day.dayName}
              </span>
            </div>
          </div>

          {/* Col 2: Status Badge */}
          <div className="col-status">
            {isLeave ? (
              <span className="status-badge badge-leave">
                <XCircle size={13} className="text-[#FF5C70]" />
                <span className="font-bold tracking-wide">LEAVE PLANNED</span>
                <span className="text-[11px] opacity-80">({day.scheduledPeriods}p)</span>
              </span>
            ) : isHoliday ? (
              <span className="status-badge badge-holiday">
                <Coffee size={13} className="text-[#F5B942]" />
                <span className="font-bold tracking-wide">HOLIDAY</span>
                {day.holidayName ? (
                  <span className="text-[11px] opacity-80">({day.holidayName})</span>
                ) : (
                  <span className="text-[11px] opacity-80">(0p)</span>
                )}
              </span>
            ) : isPartial ? (
              <span className="status-badge badge-partial">
                <AlertTriangle size={13} className="text-[#D6A84F]" />
                <span className="font-bold tracking-wide">PARTIAL</span>
                <span className="text-[11px] opacity-80">
                  ({day.actualAttended}/{day.scheduledPeriods}p)
                </span>
              </span>
            ) : isNoClass ? (
              <span className="status-badge badge-off">
                <span className="font-bold tracking-wide">NO CLASS</span>
              </span>
            ) : (
              <span className="status-badge badge-attend">
                <CheckCircle2 size={13} className="text-[#00E5A0]" />
                <span className="font-bold tracking-wide">ATTEND</span>
                <span className="text-[11px] opacity-80">({day.scheduledPeriods}p)</span>
              </span>
            )}
          </div>

          {/* Col 3: Attended / Total Periods */}
          <div className="col-counts">
            <strong className="text-white font-mono font-bold">
              {day.runningAttended}
            </strong>
            <span className="text-slate-500 mx-1">/</span>
            <strong className="text-white font-mono font-bold">
              {day.runningTotal}
            </strong>
            <span className="text-xs text-[#737373] ml-1.5 font-medium">periods</span>
          </div>

          {/* Col 4: Projected % */}
          <div className="col-pct flex items-center justify-end">
            <span
              className={`font-['Outfit'] font-extrabold text-lg tabular-nums ${
                isLeave
                  ? 'text-rose'
                  : day.isTargetAchieved
                  ? 'text-emerald'
                  : 'text-rose'
              }`}
            >
              {day.projectedPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Desktop Expandable Action Drawer */}
        {isHolidayEligible && (
          <div
            className={`forecast-action-drawer-desktop ${isExpanded ? 'is-open' : ''}`}
            data-no-swipe="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="forecast-action-inner pt-2.5">
              <button
                type="button"
                data-no-swipe="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestHoliday(day);
                }}
                className={`h-8 px-5 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-[6px] border cursor-pointer transition-all ${
                  isManualHoliday
                    ? 'bg-[#211B0A] text-[#F5B942] border-[#F5B942]/50 hover:bg-[#2d240d]'
                    : 'bg-[#111111] text-[#F5B942] border-[#202020] hover:border-[#F5B942]/40 hover:bg-[#1a1608]'
                }`}
                aria-label={isManualHoliday ? 'Restore normal class' : 'Mark as holiday'}
                title={isManualHoliday ? 'Restore normal class' : 'Mark as holiday'}
              >
                <Coffee size={13} className="text-[#F5B942]" />
                <span>Holiday</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MOBILE VIEW (Screenshot 5 Compact Attendance Row Style)                   */}
        {/* ========================================================================= */}
        <div className="sm:hidden forecast-mobile-reference-wrapper w-full">
          <div
            className="timeline-reference-row flex items-center justify-between w-full h-[42px] px-3 rounded-[6px] border transition-all cursor-pointer select-none"
            style={{
              backgroundColor: rowBg,
              borderColor: rowBorder,
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onEditDate(day.dateKey);
            }}
          >
            <span className="timeline-ref-date font-bold text-white text-[13px] font-['Outfit'] shrink-0">
              {timelineDateFormatted}
            </span>
            <span className="timeline-ref-pct font-extrabold text-white text-[13px] font-['Outfit'] tabular-nums shrink-0">
              {day.projectedPercentage.toFixed(2)} %
            </span>
            <span className="timeline-ref-counts font-bold text-white text-[13px] font-mono shrink-0">
              {day.runningAttended} / {day.runningTotal}
            </span>
            <span
              className={`timeline-ref-badge px-2 min-w-[26px] h-[22px] rounded-[5px] flex items-center justify-center font-bold text-xs font-mono shrink-0 ${badgeClass}`}
            >
              {isHoliday ? 'H' : markerValue}
            </span>
          </div>

          {/* Mobile Expandable Action Drawer */}
          {isHolidayEligible && (
            <div
              className={`forecast-action-drawer ${isExpanded ? 'is-open' : ''}`}
              data-no-swipe="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="forecast-action-inner pt-1.5 pb-0.5 px-0.5">
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestHoliday(day);
                  }}
                  className={`h-8 px-5 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-[6px] border cursor-pointer transition-all ${
                    isManualHoliday
                      ? 'bg-[#211B0A] text-[#F5B942] border-[#F5B942]/50 hover:bg-[#2d240d]'
                      : 'bg-[#111111] text-[#F5B942] border-[#202020] hover:border-[#F5B942]/40 hover:bg-[#1a1608]'
                  }`}
                  aria-label={isManualHoliday ? 'Restore normal class' : 'Mark as holiday'}
                  title={isManualHoliday ? 'Restore normal class' : 'Mark as holiday'}
                >
                  <Coffee size={13} className="text-[#F5B942]" />
                  <span>Holiday</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SwipeableForecastRow = React.memo<SwipeableForecastRowProps>(
  SwipeableForecastRowComponent,
  (prev, next) => {
    return (
      prev.day === next.day &&
      prev.isSelected === next.isSelected &&
      prev.isExpanded === next.isExpanded &&
      prev.inputs.targetPercentage === next.inputs.targetPercentage &&
      prev.onToggleExpand === next.onToggleExpand &&
      prev.onSelectDate === next.onSelectDate &&
      prev.onEditDate === next.onEditDate &&
      prev.onMarkLeave === next.onMarkLeave &&
      prev.onRequestHoliday === next.onRequestHoliday
    );
  }
);
