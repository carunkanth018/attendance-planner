import type {
  AttendanceInputs,
  CalculationResults,
  RecoveryPlan,
  SafeAbsencesResult,
  ScenarioResult,
} from '../types/attendance';

/**
 * Calculates current attendance percentage: (attended / total) * 100
 */
export function calculatePercentage(attended: number, total: number): number {
  if (total <= 0) return 0;
  if (attended <= 0) return 0;
  if (attended >= total) return 100;
  return (attended / total) * 100;
}

export type AttendanceValidationResult =
  | { valid: true; message?: undefined }
  | { valid: false; message: string };

/**
 * Validates baseline attendance inputs entered by the user.
 */
export function validateAttendanceInputs(
  total: number,
  attended: number,
  target: number,
): AttendanceValidationResult {
  if (Number.isNaN(total) || total === null || total === undefined) {
    return { valid: false, message: 'Please enter the total periods conducted.' };
  }
  if (!Number.isInteger(total) || total <= 0) {
    return { valid: false, message: 'Total periods conducted must be a whole number greater than 0.' };
  }
  if (Number.isNaN(attended) || attended === null || attended === undefined) {
    return { valid: false, message: 'Please enter the number of periods attended.' };
  }
  if (!Number.isInteger(attended) || attended < 0) {
    return { valid: false, message: 'Periods attended must be 0 or a positive whole number.' };
  }
  if (attended > total) {
    return { valid: false, message: 'Periods attended cannot exceed total periods conducted.' };
  }
  if (Number.isNaN(target) || !Number.isFinite(target) || target <= 0 || target > 100) {
    return { valid: false, message: 'Required target attendance percentage must be between 1% and 100%.' };
  }
  return { valid: true };
}

/**
 * Calculates minimum consecutive attended periods required to reach target percentage.
 * Formula: (attended + x) / (total + x) >= target / 100
 * -> x = ceil((target * total - 100 * attended) / (100 - target))
 */
export function calculateRecoveryPlan(
  attended: number,
  total: number,
  targetPercentage: number,
): RecoveryPlan {
  const currentPct = calculatePercentage(attended, total);

  // If already meeting or exceeding target
  if (currentPct >= targetPercentage) {
    return {
      status: 'ACHIEVED',
      consecutiveNeeded: 0,
      projectedAttended: attended,
      projectedTotal: total,
      projectedPercentage: currentPct,
      targetPercentage,
    };
  }

  // If target is 100% and student has missed any class, it is mathematically impossible
  if (targetPercentage >= 100) {
    return {
      status: 'IMPOSSIBLE',
      consecutiveNeeded: Infinity,
      projectedAttended: attended,
      projectedTotal: total,
      projectedPercentage: currentPct,
      targetPercentage,
    };
  }

  const denominator = 100 - targetPercentage;
  const numerator = (targetPercentage * total) - (100 * attended);
  const consecutiveNeeded = Math.max(0, Math.ceil(numerator / denominator));

  const projectedAttended = attended + consecutiveNeeded;
  const projectedTotal = total + consecutiveNeeded;
  const projectedPercentage = calculatePercentage(projectedAttended, projectedTotal);

  return {
    status: 'NEEDS_RECOVERY',
    consecutiveNeeded,
    projectedAttended,
    projectedTotal,
    projectedPercentage,
    targetPercentage,
  };
}

/**
 * Calculates maximum additional consecutive absences allowed while keeping attendance >= target.
 * Formula: 100 * attended / (total + x) >= target
 * -> x = floor((100 * attended - target * total) / target)
 */
export function calculateSafeAbsences(
  attended: number,
  total: number,
  targetPercentage: number,
): SafeAbsencesResult {
  const currentPct = calculatePercentage(attended, total);

  if (currentPct < targetPercentage) {
    return {
      isBelowTarget: true,
      maxSafeAbsences: 0,
      projectedTotal: total,
      projectedPercentage: currentPct,
      targetPercentage,
    };
  }

  if (targetPercentage <= 0) {
    return {
      isBelowTarget: false,
      maxSafeAbsences: Infinity,
      projectedTotal: total,
      projectedPercentage: currentPct,
      targetPercentage,
    };
  }

  const numerator = (100 * attended) - (targetPercentage * total);
  const maxSafeAbsences = Math.max(0, Math.floor(numerator / targetPercentage));
  const projectedTotal = total + maxSafeAbsences;
  const projectedPercentage = calculatePercentage(attended, projectedTotal);

  return {
    isBelowTarget: false,
    maxSafeAbsences,
    projectedTotal,
    projectedPercentage,
    targetPercentage,
  };
}

/**
 * Simulates a future scenario with custom attend/miss numbers.
 * Projected attendance = ((current attended + future attended) / (current total + future attended + future missed)) * 100
 */
export function calculateScenario(
  attended: number,
  total: number,
  futureAttended: number,
  futureMissed: number,
  targetPercentage: number,
): ScenarioResult {
  const safeFutureAttended = Math.max(0, Math.floor(Number(futureAttended) || 0));
  const safeFutureMissed = Math.max(0, Math.floor(Number(futureMissed) || 0));

  const projectedAttended = attended + safeFutureAttended;
  const projectedTotal = total + safeFutureAttended + safeFutureMissed;
  const projectedPercentage = calculatePercentage(projectedAttended, projectedTotal);
  const reachesTarget = projectedPercentage >= targetPercentage;

  return {
    futureAttended: safeFutureAttended,
    futureMissed: safeFutureMissed,
    projectedAttended,
    projectedTotal,
    projectedPercentage,
    reachesTarget,
    targetPercentage,
  };
}

/**
 * Computes all calculator outputs for given valid inputs.
 */
export function computeAllResults(inputs: AttendanceInputs): CalculationResults {
  const { totalSlots, attendedSlots, targetPercentage } = inputs;
  const currentPercentage = calculatePercentage(attendedSlots, totalSlots);
  const missedSlots = Math.max(0, totalSlots - attendedSlots);
  const isOnTrack = currentPercentage >= targetPercentage;
  const recoveryPlan = calculateRecoveryPlan(attendedSlots, totalSlots, targetPercentage);
  const safeAbsences = calculateSafeAbsences(attendedSlots, totalSlots, targetPercentage);

  return {
    inputs,
    currentPercentage,
    totalSlots,
    attendedSlots,
    missedSlots,
    targetPercentage,
    isOnTrack,
    recoveryPlan,
    safeAbsences,
  };
}
