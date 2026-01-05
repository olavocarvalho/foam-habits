import {
	format,
	subDays,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	parseISO,
	isAfter,
	getDay,
} from 'date-fns';
import {
	type Config,
	type HabitEntry,
	type HabitData,
	type ViewArgs,
	type Schedule,
	type Day,
	parseGoal,
} from './schemas.js';

/**
 * Generate date range based on view args
 * @param args - View arguments (weeks, currentMonth)
 * @param referenceDate - Reference date for calculations (defaults to today, useful for testing)
 */
export function getDateRange(args: ViewArgs, referenceDate?: Date): string[] {
	const today = referenceDate ?? new Date();
	let startDate: Date;
	let endDate: Date = today;

	if (args.currentMonth) {
		startDate = startOfMonth(today);
		endDate = endOfMonth(today);
		// Don't show future dates
		if (isAfter(endDate, today)) {
			endDate = today;
		}
	} else {
		// Last N weeks (N * 7 days)
		startDate = subDays(today, args.weeks * 7 - 1);
	}

	return eachDayOfInterval({start: startDate, end: endDate}).map(date =>
		format(date, 'yyyy-MM-dd'),
	);
}

/**
 * Check if a date is before the habit's start date
 */
function isBeforeStartDate(dateStr: string, startDate?: string): boolean {
	if (!startDate) return false;
	return dateStr < startDate;
}

// Map date-fns getDay() result (0=Sun, 1=Mon, ..., 6=Sat) to our Day type
const DAY_INDEX_TO_DAY: Record<number, Day> = {
	0: 'sun',
	1: 'mon',
	2: 'tue',
	3: 'wed',
	4: 'thu',
	5: 'fri',
	6: 'sat',
};

const WEEKDAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKENDS: Day[] = ['sat', 'sun'];

/**
 * Check if a date is scheduled for the given schedule
 * Exported for testing
 */
export function isScheduledForDate(dateStr: string, schedule: Schedule): boolean {
	// 'daily' means every day
	if (schedule === 'daily') {
		return true;
	}

	const date = parseISO(dateStr);
	const dayIndex = getDay(date); // 0=Sun, 1=Mon, ..., 6=Sat
	const day = DAY_INDEX_TO_DAY[dayIndex]!;

	if (schedule === 'weekdays') {
		return WEEKDAYS.includes(day);
	}

	if (schedule === 'weekends') {
		return WEEKENDS.includes(day);
	}

	// Custom array of days
	return schedule.includes(day);
}

/**
 * Calculate current streak for a habit
 * Streak = consecutive days with completion, going backwards from reference date
 * Stops at startDate boundary (doesn't count days before startDate as missed)
 * Skips unscheduled days (doesn't break streak, doesn't count them)
 * @param referenceDate - Reference date for calculations (defaults to today, useful for testing)
 */
function calculateStreak(
	entries: Record<string, number | null | undefined>,
	goal: number | undefined,
	threshold: number,
	startDate?: string,
	schedule: Schedule = 'daily',
	referenceDate?: Date,
): number {
	const today = referenceDate ?? new Date();
	let streak = 0;
	let currentDate = today;
	let daysChecked = 0;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		const dateStr = format(currentDate, 'yyyy-MM-dd');

		// Stop at startDate boundary (don't break streak, just stop counting)
		if (isBeforeStartDate(dateStr, startDate)) {
			break;
		}

		// Skip unscheduled days (don't break streak, don't count)
		if (!isScheduledForDate(dateStr, schedule)) {
			currentDate = subDays(currentDate, 1);
			daysChecked++;
			// Safety limit for skipping
			if (daysChecked > 365) break;
			continue;
		}

		const value = entries[dateStr];

		// Check if habit was completed on this day
		const isComplete =
			value !== undefined &&
			value !== null &&
			(goal === undefined || value >= goal * threshold);

		if (!isComplete) {
			break;
		}

		streak++;
		currentDate = subDays(currentDate, 1);
		daysChecked++;

		// Safety limit
		if (daysChecked > 365) break;
	}

	return streak;
}

/**
 * Aggregate habit entries into HabitData for rendering
 * @param referenceDate - Reference date for calculations (defaults to today, useful for testing)
 */
export function aggregateHabits(
	entries: HabitEntry[],
	config: Config,
	dateRange: string[],
	referenceDate?: Date,
): HabitData[] {
	const habits: HabitData[] = [];
	const today = referenceDate ?? new Date();

	// Process each habit from config (maintains order)
	for (const [habitKey, habitConfig] of Object.entries(config.habits)) {
		const habitEntries: Record<string, number | null | undefined> = {};
		const startDate = habitConfig['start-date'];
		const schedule = habitConfig.schedule ?? 'daily';

		// Find all entries for this habit
		for (const entry of entries) {
			if (entry.name === habitKey.toLowerCase()) {
				const entryDate = parseISO(entry.date);
				// Skip future dates
				if (isAfter(entryDate, today)) continue;
				// Only include if in date range or needed for streak calculation
				habitEntries[entry.date] = entry.value;
			}
		}

		// Filter entries to only those in the display range
		// Mark dates before startDate or unscheduled as null
		const displayEntries: Record<string, number | null | undefined> = {};
		for (const date of dateRange) {
			if (isBeforeStartDate(date, startDate)) {
				displayEntries[date] = null; // Before start date - show as blank
			} else if (!isScheduledForDate(date, schedule)) {
				displayEntries[date] = null; // Not scheduled - show as blank
			} else {
				displayEntries[date] = habitEntries[date];
			}
		}

		const threshold = habitConfig.threshold ?? 1.0;

		// Parse goal string (e.g., "4L" -> {value: 4, unit: "L"})
		let goalValue: number | undefined;
		let goalUnit: string | undefined;
		if (habitConfig.goal) {
			const parsed = parseGoal(habitConfig.goal);
			goalValue = parsed.value;
			goalUnit = parsed.unit;
		}

		habits.push({
			name: habitKey,
			emoji: habitConfig.emoji,
			goal: goalValue,
			unit: goalUnit,
			threshold,
			startDate,
			schedule,
			entries: displayEntries,
			streak: calculateStreak(
				habitEntries,
				goalValue,
				threshold,
				startDate,
				schedule,
				today,
			),
		});
	}

	return habits;
}

/**
 * Get completion level for a single cell (0-3 or null)
 * null = before start date (show as blank)
 * 0 = not done (░), 1 = low (▒), 2 = partial (▓), 3 = complete (█)
 */
export function getCompletionLevel(
	value: number | null | undefined,
	goal: number | undefined,
	threshold: number = 1.0,
): 0 | 1 | 2 | 3 | null {
	// null = before start date, show as blank
	if (value === null) {
		return null;
	}

	if (value === undefined) {
		return 0; // Not done
	}

	if (goal === undefined) {
		// Boolean habit - present = complete
		return 3;
	}

	const percentage = value / goal;

	if (percentage >= threshold) {
		return 3; // Complete (meets threshold)
	}
	// Scale partial levels relative to threshold
	const partialThreshold = threshold * 0.625; // ~50% of the way to threshold
	if (percentage >= partialThreshold) {
		return 2; // Partial
	}
	if (percentage > 0) {
		return 1; // Low
	}

	return 0; // Not done
}
