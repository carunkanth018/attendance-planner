import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  GraduationCap,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react';
import type { SemesterConfig } from '../types/attendance';
import { DEFAULT_SEMESTER_CONFIG } from '../utils/calendar';

interface SemesterSettingsModalProps {
  isOpen: boolean;
  semesterConfig: SemesterConfig;
  onSave: (updated: SemesterConfig) => void;
  onStartNewSemester: (newConfig: SemesterConfig) => void;
  onClose: () => void;
}

export const SemesterSettingsModal: React.FC<SemesterSettingsModalProps> = ({
  isOpen,
  semesterConfig,
  onSave,
  onStartNewSemester,
  onClose,
}) => {
  const [form, setForm] = useState<SemesterConfig>({ ...semesterConfig });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isStartingNew, setIsStartingNew] = useState<boolean>(false);
  const [newSemName, setNewSemName] = useState<string>('B.Tech II Year II Semester');

  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Sync form state when modal opens or semesterConfig prop changes
  useEffect(() => {
    if (isOpen) {
      setForm({ ...semesterConfig });
      setValidationError(null);
      setIsStartingNew(false);
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [isOpen, semesterConfig]);

  // Keyboard navigation: Escape key closes, Tab key trapped inside modal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const validateDates = (data: SemesterConfig): string | null => {
    if (!data.semesterName.trim()) {
      return 'Please enter a valid semester title.';
    }
    if (!data.academicYear.trim()) {
      return 'Please enter a valid academic year.';
    }
    if (!data.commencementDate) {
      return 'Please choose a semester commencement date.';
    }
    if (!data.lastTeachingDate) {
      return 'Please choose the last teaching day.';
    }
    if (!data.semesterEndDate) {
      return 'Please choose the semester end date.';
    }
    if (data.commencementDate > data.lastTeachingDate) {
      return 'Commencement date cannot be after the last teaching day.';
    }
    if (data.lastTeachingDate > data.semesterEndDate) {
      return 'Last teaching day cannot be after the semester end date.';
    }
    if (data.commencementDate > data.semesterEndDate) {
      return 'Commencement date cannot be after the semester end date.';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateDates(form);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onSave(form);
    onClose();
  };

  const handleConfirmStartNew = () => {
    const updated: SemesterConfig = {
      ...DEFAULT_SEMESTER_CONFIG,
      semesterName: newSemName.trim() || 'Next Semester',
      academicYear: form.academicYear,
    };
    onStartNewSemester(updated);
    setIsStartingNew(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="academic-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="academic-modal-title"
        aria-describedby="academic-modal-subtitle"
        className="academic-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Graduation-Cap Badge + Title & Subtitle + Top-Right Close Button */}
        <div className="academic-modal-header">
          <div className="academic-modal-header-left">
            <div className="academic-modal-icon-badge" aria-hidden="true">
              <GraduationCap size={22} strokeWidth={2.2} />
            </div>
            <div className="academic-modal-title-group">
              <h2 id="academic-modal-title" className="academic-modal-title">
                Academic Calendar Settings
              </h2>
              <p id="academic-modal-subtitle" className="academic-modal-subtitle">
                Configure your semester timeline and teaching dates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="academic-modal-close-btn"
            aria-label="Close dialog"
            title="Close dialog (Escape)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Wrapper */}
        <form onSubmit={handleSubmit} className="academic-modal-form-wrapper" noValidate>
          {/* Scrollable Modal Content Body */}
          <div className="academic-modal-body">
            {/* Reference-date warning notice */}
            <div className="academic-modal-warning-box">
              <AlertCircle className="academic-modal-warning-icon" aria-hidden="true" />
              <p className="academic-modal-warning-text">
                These dates are suggested references. Confirm them against your college's official academic calendar.
              </p>
            </div>

            {/* Inline validation error if any */}
            {validationError && (
              <div className="academic-modal-error-banner" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Semester Details: Row 1 (Title & Academic Year) */}
            <div className="academic-modal-grid-2">
              <div className="academic-modal-field">
                <label htmlFor="field-sem-title" className="academic-modal-label">
                  Semester Title
                </label>
                <input
                  id="field-sem-title"
                  type="text"
                  value={form.semesterName}
                  onChange={(e) => {
                    setForm({ ...form, semesterName: e.target.value });
                    if (validationError) setValidationError(null);
                  }}
                  className="academic-modal-input"
                  placeholder="e.g. B.Tech II Year I Semester"
                  required
                />
              </div>

              <div className="academic-modal-field">
                <label htmlFor="field-acad-year" className="academic-modal-label">
                  Academic Year
                </label>
                <input
                  id="field-acad-year"
                  type="text"
                  value={form.academicYear}
                  onChange={(e) => {
                    setForm({ ...form, academicYear: e.target.value });
                    if (validationError) setValidationError(null);
                  }}
                  className="academic-modal-input"
                  placeholder="e.g. 2026–27"
                  required
                />
              </div>
            </div>

            {/* Semester Details: Row 2 (Commencement, Last Teaching Day, Semester End) */}
            <div className="academic-modal-grid-3">
              <div className="academic-modal-field">
                <label htmlFor="field-commence-date" className="academic-modal-label">
                  Commencement Date
                </label>
                <input
                  id="field-commence-date"
                  type="date"
                  value={form.commencementDate}
                  onChange={(e) => {
                    setForm({ ...form, commencementDate: e.target.value });
                    if (validationError) setValidationError(null);
                  }}
                  className="academic-modal-input"
                  required
                />
              </div>

              <div className="academic-modal-field">
                <label htmlFor="field-last-teach-date" className="academic-modal-label">
                  <span className="academic-modal-label-highlight">Last Teaching Day *</span>
                </label>
                <input
                  id="field-last-teach-date"
                  type="date"
                  value={form.lastTeachingDate}
                  onChange={(e) => {
                    setForm({ ...form, lastTeachingDate: e.target.value });
                    if (validationError) setValidationError(null);
                  }}
                  className="academic-modal-input"
                  style={{ borderColor: 'rgba(0, 229, 160, 0.45)' }}
                  required
                />
                <span className="academic-modal-helper">Classes stop counting</span>
              </div>

              <div className="academic-modal-field">
                <label htmlFor="field-sem-end-date" className="academic-modal-label">
                  Semester End Date
                </label>
                <input
                  id="field-sem-end-date"
                  type="date"
                  value={form.semesterEndDate}
                  onChange={(e) => {
                    setForm({ ...form, semesterEndDate: e.target.value });
                    if (validationError) setValidationError(null);
                  }}
                  className="academic-modal-input"
                  required
                />
                <span className="academic-modal-helper">Exams completed</span>
              </div>
            </div>

            {/* Examination & Preparation Milestones Subsection */}
            <div className="academic-modal-milestones-box">
              <h3 className="academic-modal-milestones-title">
                Examination &amp; Preparation Milestones
              </h3>

              <div className="academic-modal-grid-2">
                <div className="academic-modal-field">
                  <label htmlFor="field-mid-exams" className="academic-modal-label">
                    Mid Examinations Period
                  </label>
                  <input
                    id="field-mid-exams"
                    type="text"
                    placeholder="e.g. 12–14 Nov 2026"
                    value={form.midExamDates || ''}
                    onChange={(e) => setForm({ ...form, midExamDates: e.target.value })}
                    className="academic-modal-input"
                  />
                </div>

                <div className="academic-modal-field">
                  <label htmlFor="field-practicals" className="academic-modal-label">
                    Preparation &amp; Practicals
                  </label>
                  <input
                    id="field-practicals"
                    type="text"
                    placeholder="e.g. 16–21 Nov 2026"
                    value={form.practicalExamDates || ''}
                    onChange={(e) => setForm({ ...form, practicalExamDates: e.target.value })}
                    className="academic-modal-input"
                  />
                </div>
              </div>
            </div>

            {/* Start New Semester Sub-Panel (Integrated workflow) */}
            {isStartingNew && (
              <div className="academic-modal-start-panel">
                <h4 className="academic-modal-start-panel-title">
                  Begin a New Semester
                </h4>
                <p className="academic-modal-start-panel-desc">
                  This initiates a fresh semester cycle. You will be prompted to enter your new semester's initial attendance figures so the previous semester's percentage is not automatically carried forward.
                </p>
                <div className="academic-modal-start-panel-row">
                  <input
                    type="text"
                    placeholder="New Semester Title (e.g. B.Tech II Year II Semester)"
                    value={newSemName}
                    onChange={(e) => setNewSemName(e.target.value)}
                    className="academic-modal-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmStartNew}
                    className="academic-modal-start-panel-confirm-btn"
                  >
                    Confirm &amp; Setup Baseline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer: Start Next Semester (Left) | Cancel & Save (Right) */}
          <div className="academic-modal-footer">
            <button
              type="button"
              onClick={() => setIsStartingNew((prev) => !prev)}
              className="academic-modal-start-btn"
              title="Transition to next semester"
            >
              <Sparkles size={15} />
              <span>{isStartingNew ? 'Hide Semester Setup' : 'Start Next Semester'}</span>
            </button>

            <div className="academic-modal-footer-right">
              <button
                type="button"
                onClick={onClose}
                className="academic-modal-cancel-btn"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="academic-modal-save-btn"
              >
                <Save size={15} />
                <span>Save Academic Dates</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
