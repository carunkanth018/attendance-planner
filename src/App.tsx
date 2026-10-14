import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Edit3,
  RotateCcw,
  ArrowRight,
  Info,
  Calendar as CalendarIcon,
  Settings2,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Compass,
  TrendingUp,
  TrendingDown,
  Target,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DateDetailsModal } from './components/DateDetailsModal';
import { DailyPredictionList } from './components/DailyPredictionList';
import { AttendanceRecoveryCard } from './components/AttendanceRecoveryCard';
import { SemesterTimelineCard } from './components/SemesterTimelineCard';
import { SemesterSettingsModal } from './components/SemesterSettingsModal';
import {
  computePlannerSummary,
  DEFAULT_TIMETABLE,
  DEFAULT_SEMESTER_CONFIG,
  formatDateKey,
} from './utils/calendar';
import { validateAttendanceInputs } from './utils/attendance';
import type {
  AttendanceInputs,
  WeeklyTimetable,
  PlannerCalculationSummary,
  DaySimulationStatus,
  DateOverride,
  SemesterConfig,
} from './types/attendance';

const STORAGE_KEY = 'niat_calendar_planner_v3';

function loadStoredInputs(): AttendanceInputs | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const validation = validateAttendanceInputs(
      parsed.totalSlots,
      parsed.attendedSlots,
      parsed.targetPercentage
    );
    if (validation.valid) {
      let timetable: WeeklyTimetable = parsed.timetable
        ? { ...DEFAULT_TIMETABLE, ...parsed.timetable }
        : DEFAULT_TIMETABLE;

      // If Saturday currently has zero periods only because it was previously treated as a weekend,
      // change its default to 6 periods, while keeping the value configurable.
      if (
        timetable.saturday === undefined ||
        (timetable.saturday === 0 && !parsed.saturdayConfigured)
      ) {
        timetable = { ...timetable, saturday: 6 };
      }

      return {
        totalSlots: Number(parsed.totalSlots),
        attendedSlots: Number(parsed.attendedSlots),
        targetPercentage: Number(parsed.targetPercentage),
        startDate: parsed.startDate || formatDateKey(new Date()),
        timetable,
        holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
        overrides: parsed.overrides || {},
        semester: parsed.semester || DEFAULT_SEMESTER_CONFIG,
        saturdayConfigured: parsed.saturdayConfigured,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [savedInputs, setSavedInputs] = useState<AttendanceInputs | null>(loadStoredInputs);
  const [isEditing, setIsEditing] = useState<boolean>(() => !loadStoredInputs());

  // Setup form fields
  const [totalInput, setTotalInput] = useState<string>(() =>
    savedInputs ? String(savedInputs.totalSlots) : ''
  );
  const [attendedInput, setAttendedInput] = useState<string>(() =>
    savedInputs ? String(savedInputs.attendedSlots) : ''
  );
  const [targetInput, setTargetInput] = useState<string>(() =>
    savedInputs ? String(savedInputs.targetPercentage) : '75'
  );
  const [startDateInput, setStartDateInput] = useState<string>(() =>
    savedInputs?.startDate || formatDateKey(new Date())
  );

  // Timetable configuration
  const [timetable, setTimetable] = useState<WeeklyTimetable>(() =>
    savedInputs?.timetable || DEFAULT_TIMETABLE
  );
  const [showTimetableSettings, setShowTimetableSettings] = useState<boolean>(false);

  // Form error
  const [formError, setFormError] = useState<string | null>(null);

  // Currently selected date for Calendar Inspector & Timeline
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Active editing modal dateKey (null if modal closed)
  const [editingModalDateKey, setEditingModalDateKey] = useState<string | null>(null);

  // Reset modal state
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);

  // Semester settings modal state
  const [semesterModalOpen, setSemesterModalOpen] = useState<boolean>(false);

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Planner summary computation: always starts from immutable baseline + date overrides
  const summary: PlannerCalculationSummary | null = useMemo(() => {
    if (!savedInputs) return null;
    return computePlannerSummary(savedInputs);
  }, [savedInputs]);

  // Sync to localStorage
  useEffect(() => {
    if (savedInputs) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedInputs));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [savedInputs]);

  // Form submit handler
  const handleGeneratePlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const total = totalInput.trim() === '' ? NaN : Number(totalInput);
    const attended = attendedInput.trim() === '' ? NaN : Number(attendedInput);
    const target = targetInput.trim() === '' ? NaN : Number(targetInput);

    const validation = validateAttendanceInputs(total, attended, target);
    if (!validation.valid) {
      setFormError(validation.message || 'Invalid inputs provided.');
      return;
    }

    const newInputs: AttendanceInputs = {
      totalSlots: total,
      attendedSlots: attended,
      targetPercentage: target,
      startDate: startDateInput || formatDateKey(new Date()),
      timetable,
      holidays: savedInputs?.holidays || [],
      overrides: savedInputs?.overrides || {},
      semester: savedInputs?.semester || DEFAULT_SEMESTER_CONFIG,
      saturdayConfigured: true,
    };

    setSavedInputs(newInputs);
    setIsEditing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = () => {
    if (savedInputs) {
      setTotalInput(String(savedInputs.totalSlots));
      setAttendedInput(String(savedInputs.attendedSlots));
      setTargetInput(String(savedInputs.targetPercentage));
      setStartDateInput(savedInputs.startDate);
      setTimetable(savedInputs.timetable);
    }
    setFormError(null);
    setIsEditing(true);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSemester = (updatedSemester: SemesterConfig) => {
    if (!savedInputs) return;
    setSavedInputs({
      ...savedInputs,
      semester: updatedSemester,
    });
  };

  const handleStartNewSemester = (newSemester: SemesterConfig) => {
    if (!savedInputs) return;
    const updated: AttendanceInputs = {
      ...savedInputs,
      totalSlots: 0,
      attendedSlots: 0,
      startDate: formatDateKey(new Date()),
      overrides: {},
      semester: newSemester,
    };
    setSavedInputs(updated);
    setTotalInput('');
    setAttendedInput('');
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetConfirm = () => {
    setSavedInputs(null);
    setTotalInput('');
    setAttendedInput('');
    setTargetInput('75');
    setStartDateInput(formatDateKey(new Date()));
    setTimetable(DEFAULT_TIMETABLE);
    setFormError(null);
    setIsEditing(true);
    setResetModalOpen(false);
    setSelectedDateKey(null);
    setEditingModalDateKey(null);
    setMobileMenuOpen(false);
    localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Undo Toast state and timer
  const [undoToast, setUndoToast] = useState<{
    message: string;
    dateKey: string;
    previousOverride: DateOverride | undefined;
  } | null>(null);
  const [isDismissingToast, setIsDismissingToast] = useState<boolean>(false);
  const undoTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setIsDismissingToast(true);
    window.setTimeout(() => {
      setUndoToast(null);
      setIsDismissingToast(false);
    }, 180);
  }, []);

  // Date Simulation Actions: Updates override map, triggers sequential recalculation, and manages Undo feedback
  const handleSetStatus = useCallback((
    dateKey: string,
    status: DaySimulationStatus,
    attendedPeriods?: number,
    missedPeriods?: number,
    toastMessage?: string
  ) => {
    setSavedInputs((prev) => {
      if (!prev) return null;

      const previousOverride = prev.overrides[dateKey];
      const updatedOverrides = { ...prev.overrides };

      if (status === 'ATTEND') {
        if (previousOverride?.status === 'HOLIDAY' && previousOverride.previousOverride) {
          updatedOverrides[dateKey] = previousOverride.previousOverride;
        } else {
          delete updatedOverrides[dateKey];
        }
      } else if (status === 'PARTIAL_LEAVE') {
        updatedOverrides[dateKey] = {
          status: 'PARTIAL_LEAVE',
          attendedPeriods: attendedPeriods ?? 0,
          missedPeriods: missedPeriods ?? 0,
        };
      } else if (status === 'HOLIDAY') {
        const prevStatusOverride =
          previousOverride?.status === 'HOLIDAY'
            ? previousOverride.previousOverride
            : previousOverride;
        updatedOverrides[dateKey] = {
          status: 'HOLIDAY',
          previousOverride: prevStatusOverride,
        };
      } else {
        updatedOverrides[dateKey] = { status };
      }

      if (toastMessage) {
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
        }
        setIsDismissingToast(false);
        setUndoToast({
          message: toastMessage,
          dateKey,
          previousOverride,
        });
        undoTimerRef.current = window.setTimeout(() => {
          dismissToast();
        }, 6000);
      }

      return { ...prev, overrides: updatedOverrides };
    });
  }, [dismissToast]);

  const handleUndo = useCallback(() => {
    setUndoToast((current) => {
      if (!current) return null;
      const { dateKey, previousOverride } = current;

      setSavedInputs((prev) => {
        if (!prev) return null;
        const updatedOverrides = { ...prev.overrides };
        if (previousOverride !== undefined) {
          updatedOverrides[dateKey] = previousOverride;
        } else {
          delete updatedOverrides[dateKey];
        }
        return { ...prev, overrides: updatedOverrides };
      });

      return null;
    });
    dismissToast();
  }, [dismissToast]);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey((prev) => (prev === dateKey ? null : dateKey));
  }, []);

  const handleEditDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setEditingModalDateKey(dateKey);
  }, []);

  const handleOpenSemesterModal = useCallback(() => {
    setSemesterModalOpen(true);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const editingDayPrediction = useMemo(() => {
    if (!summary || !editingModalDateKey) return null;
    return summary.days.find((d) => d.dateKey === editingModalDateKey) || null;
  }, [summary, editingModalDateKey]);

  return (
    <main className="app-shell">
      <div className="app-container">
        {/* ========================================================================= */}
        {/* 2. FLOATING ROUNDED NAVIGATION BAR */}
        {/* ========================================================================= */}
        <header className="floating-nav-wrapper">
          <nav className="floating-navbar">
            <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="nav-logo-box">
                <Compass size={18} className="nav-logo-icon" />
                <span className="live-status-dot" />
              </div>
              <div className="nav-brand-text">
                <span className="nav-title">Attendance Planner</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            {savedInputs && !isEditing && (
              <div className="nav-links-desktop">
                <button type="button" onClick={() => scrollToSection('overview')} className="nav-link">
                  Overview
                </button>
                <button type="button" onClick={() => scrollToSection('semester')} className="nav-link">
                  Semester
                </button>
                <button type="button" onClick={() => scrollToSection('recovery')} className="nav-link">
                  Recovery Plan
                </button>
                <button type="button" onClick={() => scrollToSection('forecast')} className="nav-link">
                  Daily Forecast
                </button>
              </div>
            )}

            {/* Right Action Controls */}
            {savedInputs && !isEditing ? (
              <div className="nav-actions-wrapper">
                <div className="nav-actions-desktop">
                  <button
                    type="button"
                    className="btn btn-nav-edit"
                    onClick={() => setSemesterModalOpen(true)}
                    title="Configure academic semester dates"
                  >
                    <CalendarDays size={14} />
                    <span>Semester</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-nav-edit"
                    onClick={handleEdit}
                    title="Edit baseline & timetable"
                  >
                    <Edit3 size={14} />
                    <span>Edit Baseline</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-nav-reset"
                    onClick={() => setResetModalOpen(true)}
                    title="Reset planner"
                    aria-label="Reset planner"
                  >
                    <RotateCcw size={13} />
                    <span className="reset-btn-label">Reset</span>
                  </button>
                </div>

                <div className="nav-actions-mobile">
                  <button
                    type="button"
                    className="btn-nav-mobile-action"
                    onClick={handleEdit}
                    title="Edit baseline"
                    aria-label="Edit baseline"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn-nav-mobile-action btn-nav-mobile-reset"
                    onClick={() => setResetModalOpen(true)}
                    title="Reset planner"
                    aria-label="Reset planner"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-mobile-toggle"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    aria-label="Toggle mobile menu"
                  >
                    {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-badge-pill">
                <span className="pulse-indicator" />
                <span>Prediction Engine</span>
              </div>
            )}
          </nav>

          {/* Mobile Collapsible Menu */}
          {mobileMenuOpen && savedInputs && !isEditing && (
            <div className="mobile-nav-dropdown animate-in fade-in duration-150">
              <button type="button" onClick={() => scrollToSection('overview')} className="mobile-nav-item">
                Overview
              </button>
              <button type="button" onClick={() => scrollToSection('semester')} className="mobile-nav-item">
                Semester Timeline
              </button>
              <button type="button" onClick={() => scrollToSection('recovery')} className="mobile-nav-item">
                Recovery Plan
              </button>
              <button type="button" onClick={() => scrollToSection('forecast')} className="mobile-nav-item">
                Daily Forecast Timeline
              </button>
              <div className="mobile-nav-actions">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSemesterModalOpen(true);
                  }}
                  className="btn btn-secondary w-full py-2.5 text-xs"
                >
                  <CalendarDays size={14} />
                  <span>Edit Semester Dates</span>
                </button>
                <button type="button" onClick={handleEdit} className="btn btn-secondary w-full py-2.5 text-xs">
                  <Edit3 size={14} />
                  <span>Edit Baseline &amp; Timetable</span>
                </button>
                <button type="button" onClick={() => { setMobileMenuOpen(false); setResetModalOpen(true); }} className="btn btn-ghost w-full py-2 text-xs text-rose-400">
                  <RotateCcw size={14} />
                  <span>Reset Planner</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* SETUP / INPUT FORM VIEW */}
        {/* ========================================================================= */}
        {(isEditing || !summary) && (
          <section className="card welcome-card glass-panel-glow">
            <div className="welcome-header">
              <div className="welcome-badge">
                <span className="welcome-badge-dot" />
                <span>Futuristic Academic Utility</span>
              </div>
              <h2 className="welcome-title">
                Setup Your Attendance Planner
              </h2>
              <p className="welcome-subtitle">
                Enter your total periods conducted, periods attended, and target attendance percentage to unlock date-wise predictions and recovery plans.
              </p>
            </div>

            {formError && (
              <div className="alert-banner alert-danger" role="alert">
                <AlertCircle size={20} className="alert-icon" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleGeneratePlan} className="main-form" noValidate>
              {/* Baseline Attendance Inputs: Responsive 3-Column Grid */}
              <div className="attendance-form-grid">
                {/* Field 1: Total Periods Conducted */}
                <div className="form-field-group">
                  <div className="field-header">
                    <label htmlFor="totalSlots" className="field-label">
                      Total Periods Conducted <span className="required-star">*</span>
                    </label>
                  </div>
                  <div className="field-input-wrapper">
                    <input
                      id="totalSlots"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 222"
                      value={totalInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setTotalInput(val);
                        if (formError) setFormError(null);
                      }}
                      onBlur={() => {
                        const total = Number(totalInput);
                        const attended = Number(attendedInput);
                        if (
                          totalInput.trim() !== '' &&
                          attendedInput.trim() !== '' &&
                          !Number.isNaN(total) &&
                          !Number.isNaN(attended) &&
                          attended > total
                        ) {
                          setFormError('Periods attended cannot exceed total periods conducted.');
                        }
                      }}
                      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                      autoFocus
                      required
                      className="form-input"
                    />
                  </div>
                  <span className="field-helper">Total classes held so far.</span>
                </div>

                {/* Field 2: Periods Attended */}
                <div className="form-field-group">
                  <div className="field-header">
                    <label htmlFor="attendedSlots" className="field-label">
                      Periods Attended <span className="required-star">*</span>
                    </label>
                  </div>
                  <div className="field-input-wrapper">
                    <input
                      id="attendedSlots"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 147"
                      value={attendedInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setAttendedInput(val);
                        if (formError) setFormError(null);
                      }}
                      onBlur={() => {
                        const total = Number(totalInput);
                        const attended = Number(attendedInput);
                        if (
                          totalInput.trim() !== '' &&
                          attendedInput.trim() !== '' &&
                          !Number.isNaN(total) &&
                          !Number.isNaN(attended) &&
                          attended > total
                        ) {
                          setFormError('Periods attended cannot exceed total periods conducted.');
                        }
                      }}
                      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                      required
                      className="form-input"
                    />
                  </div>
                  <span className="field-helper">Classes you attended.</span>
                </div>

                {/* Field 3: Target Attendance */}
                <div className="form-field-group form-field-target">
                  <div className="field-header field-header-target">
                    <label htmlFor="targetPercentage" className="field-label">
                      Target Attendance <span className="required-star">*</span>
                    </label>
                    {/* Shortcuts in their own row below the label */}
                    <div className="target-shortcuts-row" role="group" aria-label="Target attendance shortcuts">
                      {[75, 80, 85].map((preset) => {
                        const isSelected = Number(targetInput) === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            className={`shortcut-pill ${isSelected ? 'shortcut-pill-active' : ''}`}
                            onClick={() => {
                              setTargetInput(String(preset));
                              if (formError) setFormError(null);
                            }}
                            aria-pressed={isSelected}
                          >
                            {preset}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="field-input-wrapper input-with-suffix">
                    <input
                      id="targetPercentage"
                      type="text"
                      inputMode="decimal"
                      placeholder="75"
                      value={targetInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*(\.\d*)?$/.test(val)) {
                          setTargetInput(val);
                          if (formError) setFormError(null);
                        }
                      }}
                      onBlur={() => {
                        const target = Number(targetInput);
                        if (
                          targetInput.trim() !== '' &&
                          (Number.isNaN(target) || target <= 0 || target > 100)
                        ) {
                          setFormError('Required target attendance percentage must be between 1% and 100%.');
                        }
                      }}
                      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                      required
                      className="form-input has-suffix"
                    />
                    <span className="input-suffix-badge" aria-hidden="true">%</span>
                  </div>
                  <span className="field-helper">Choose your required attendance target.</span>
                </div>
              </div>

              {/* Start Date & Timetable Settings (Omitted in the start screen, accessible when editing) */}
              {savedInputs && (
                <div className="timetable-config-box">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={18} className="text-[#00E5A0]" />
                      <span className="text-sm font-bold text-white">
                        Planner Start Date:
                      </span>
                      <input
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        className="input-date-picker"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTimetableSettings((prev) => !prev)}
                      className="btn btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <Settings2 size={14} className="text-[#00E5A0]" />
                      <span>
                        {showTimetableSettings ? 'Hide Weekly Timetable' : 'Configure Weekly Timetable'}
                      </span>
                      {showTimetableSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Weekly Periods Inputs */}
                  {showTimetableSettings && (
                    <div className="pt-3 border-t border-[#262626]">
                      <span className="text-xs font-bold text-slate-300 block mb-2.5">
                        Scheduled Class Periods per Weekday:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
                        {[
                          { day: 'Mon', key: 'monday' as const },
                          { day: 'Tue', key: 'tuesday' as const },
                          { day: 'Wed', key: 'wednesday' as const },
                          { day: 'Thu', key: 'thursday' as const },
                          { day: 'Fri', key: 'friday' as const },
                          { day: 'Sat', key: 'saturday' as const },
                          { day: 'Sun', key: 'sunday' as const },
                        ].map((item) => (
                          <div key={item.key} className="timetable-day-box">
                            <span className="text-xs font-bold text-slate-400 mb-1.5">
                              {item.day}
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={timetable[item.key]}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/[^0-9]/g, '');
                                const num = clean === '' ? 0 : Math.min(12, Math.max(0, parseInt(clean, 10)));
                                setTimetable((prev) => ({
                                  ...prev,
                                  [item.key]: num,
                                }));
                              }}
                              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                              className="timetable-mini-input"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Academic Semester Configuration */}
                  <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-[#00E5A0]" />
                      <span className="text-xs text-[#A3A3A3]">
                        Semester Timeline: <strong className="text-white font-medium">{savedInputs.semester?.semesterName || 'B.Tech II Year I Semester'}</strong> ({savedInputs.semester?.academicYear || '2026–27'})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSemesterModalOpen(true)}
                      className="text-xs text-[#00E5A0] hover:text-[#00c98d] font-semibold underline underline-offset-4 cursor-pointer"
                    >
                      Edit Semester Dates &rarr;
                    </button>
                  </div>
                </div>
              )}

              <div className="form-footer">
                <button type="submit" className="btn btn-primary btn-submit">
                  <Calculator size={18} />
                  <span>Generate My Attendance Plan</span>
                  <ArrowRight size={17} />
                </button>

                {savedInputs && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="portal-note">
              <Info size={17} className="note-icon" />
              <span>
                Enter the numbers shown in your student portal. The calculation engine steps through your timetable day-by-day.
              </span>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* DASHBOARD RESULTS VIEW */}
        {/* ========================================================================= */}
        {!isEditing && summary && (
          <div className="dashboard-layout">
            {/* ------------------------------------------------------------------- */}
            {/* 3. ATTENDANCE OVERVIEW */}
            {/* ------------------------------------------------------------------- */}
            <section id="overview" className="card current-status-card animate-fade-slide-up">
              <div className="card-header">
                <div>
                  <span className="section-eyebrow text-emerald">
                    <span className="live-status-dot-inline" /> Live Metric
                  </span>
                  <h2>Attendance Overview</h2>
                </div>
                <div
                  className={`status-pill ${
                    summary.currentPercentage > summary.targetPercentage
                      ? 'status-pill-above'
                      : summary.currentPercentage === summary.targetPercentage
                      ? 'status-pill-target'
                      : 'status-pill-below'
                  }`}
                >
                  {summary.currentPercentage > summary.targetPercentage ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Above your target</span>
                    </>
                  ) : summary.currentPercentage === summary.targetPercentage ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Target achieved</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={15} />
                      <span>Below your target</span>
                    </>
                  )}
                </div>
              </div>

              <div className="status-hero-row">
                <div className="percentage-display">
                  <div className="percentage-header-sub">
                    <span className="hero-pct-label">Current Attendance</span>
                    <span
                      className={`hero-variance-chip ${
                        summary.isOnTrack ? 'variance-chip-positive' : 'variance-chip-negative'
                      }`}
                    >
                      {summary.isOnTrack ? (
                        <>
                          <TrendingUp size={11} />
                          <span>+{(summary.currentPercentage - summary.targetPercentage).toFixed(2)}% vs target</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown size={11} />
                          <span>-{(summary.targetPercentage - summary.currentPercentage).toFixed(2)}% to target</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="percentage-number-block">
                    <span
                      className={`hero-pct font-['Outfit'] ${
                        summary.isOnTrack ? 'text-emerald' : 'text-rose'
                      }`}
                    >
                      {summary.currentPercentage.toFixed(2)}%
                    </span>
                  </div>

                  <p className="hero-pct-footnote">
                    <strong className="text-white font-semibold">{summary.attendedSlots}</strong> of{' '}
                    <strong className="text-white font-semibold">{summary.totalSlots}</strong> periods marked present
                  </p>
                </div>

                <div className="stats-cards-grid">
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">Attended</span>
                      <span className="stat-pill-tag stat-pill-emerald">Present</span>
                    </div>
                    <strong className="stat-value text-emerald font-['Outfit']">
                      {summary.attendedSlots}
                    </strong>
                    <span className="stat-subtext">Verified present periods</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">Total Conducted</span>
                      <span className="stat-pill-tag">Conducted</span>
                    </div>
                    <strong className="stat-value text-white font-['Outfit']">
                      {summary.totalSlots}
                    </strong>
                    <span className="stat-subtext">Total periods held</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">Missed Periods</span>
                      <span className="stat-pill-tag stat-pill-rose">Absences</span>
                    </div>
                    <strong className="stat-value text-rose font-['Outfit']">
                      {summary.missedSlots}
                    </strong>
                    <span className="stat-subtext">Total missed periods</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-label">Required Target</span>
                      <span className="stat-pill-tag stat-pill-target">Goal</span>
                    </div>
                    <strong className="stat-value text-white font-['Outfit']">
                      {summary.targetPercentage}%
                    </strong>
                    <span className="stat-subtext">Minimum threshold</span>
                  </div>
                </div>
              </div>

              {/* Refined Progress Bar with Precision Target Indicator */}
              <div className="progress-section">
                <div className="progress-labels">
                  <span className="progress-label-edge">0%</span>
                  <div
                    className="progress-target-pinned"
                    style={{ left: `clamp(45px, ${summary.targetPercentage}%, calc(100% - 48px))` }}
                  >
                    <Target size={12} className="text-[#00E5A0]" />
                    <span>Target: {summary.targetPercentage}%</span>
                  </div>
                  <span className="progress-label-edge">100%</span>
                </div>

                <div className="progress-track-wrapper">
                  <div className="progress-track">
                    <div
                      className={`progress-bar-fill ${
                        summary.isOnTrack ? 'bar-emerald' : 'bar-rose'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, summary.currentPercentage))}%`,
                      }}
                    />
                    <div
                      className="target-line"
                      style={{ left: `${Math.min(100, summary.targetPercentage)}%` }}
                    >
                      <span className="target-line-glow" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------------------------- */}
            {/* 4. CURRENT SEMESTER TIMELINE & PROGRESS */}
            {/* ------------------------------------------------------------------- */}
            <div id="semester">
              <SemesterTimelineCard
                metrics={summary.semesterMetrics}
                targetPercentage={summary.targetPercentage}
                onEditSemester={handleOpenSemesterModal}
              />
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* 5. ATTENDANCE RECOVERY RECOMMENDATION */}
            {/* ------------------------------------------------------------------- */}
            <div id="recovery">
              <AttendanceRecoveryCard summary={summary} />
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* 6. DAILY ATTENDANCE TIMELINE */}
            {/* ------------------------------------------------------------------- */}
            <div id="forecast">
              <DailyPredictionList
                days={summary.days}
                inputs={summary.inputs}
                selectedDateKey={selectedDateKey}
                onSelectDate={handleSelectDate}
                onEditDate={handleEditDate}
                onSetStatus={handleSetStatus}
              />
            </div>

            {/* Bottom Edit Bar */}
            <div className="bottom-edit-bar">
              <button
                type="button"
                className="btn btn-secondary btn-large-edit"
                onClick={handleEdit}
              >
                <Edit3 size={16} />
                <span>Edit Baseline Details &amp; Timetable</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Footer */}
        <footer className="app-footer">
          <p>
            Attendance Planner • Designed with Precision • 100% Client-Side &amp; Private
          </p>
        </footer>
      </div>

      {/* Date Details / Edit Modal */}
      {summary && editingDayPrediction && (
        <DateDetailsModal
          day={editingDayPrediction}
          onClose={() => setEditingModalDateKey(null)}
          onSetStatus={handleSetStatus}
        />
      )}

      {/* Semester Settings Modal */}
      <SemesterSettingsModal
        isOpen={semesterModalOpen}
        semesterConfig={savedInputs?.semester || DEFAULT_SEMESTER_CONFIG}
        onSave={handleUpdateSemester}
        onStartNewSemester={handleStartNewSemester}
        onClose={() => setSemesterModalOpen(false)}
      />

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        title="Reset your planner?"
        message="This will clear your saved attendance numbers, weekly timetable, and planned leaves from this device."
        supportingNote="Your planner data will be removed. This action cannot be undone."
        confirmLabel="Reset planner"
        cancelLabel="Cancel"
        onConfirm={handleResetConfirm}
        onCancel={() => setResetModalOpen(false)}
      />

      {/* Floating Undo Confirmation Toast */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className={`confirmation-toast ${
            isDismissingToast ? 'toast-exiting' : 'toast-entering'
          }`}
        >
          <CheckCircle2 size={22} className="text-[#00E5A0] shrink-0" strokeWidth={2.2} />
          <span className="toast-message">
            {undoToast.message}
          </span>
          <div className="toast-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={handleUndo}
            className="toast-undo-btn"
            title="Undo this attendance change"
            aria-label="Undo attendance change"
          >
            <RotateCcw size={15} strokeWidth={2.4} className="shrink-0" />
            <span>Undo</span>
          </button>
          <div className="toast-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={dismissToast}
            className="toast-close-btn"
            aria-label="Close notification"
            title="Close notification"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </main>
  );
}
