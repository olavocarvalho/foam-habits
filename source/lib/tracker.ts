import {
	format,
	subDays,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	parseISO,
	isAfter,
} from 'date-fns';
import {
	type Config,
	type HabitEntry,
	type HabitData,
	type ViewArgs,
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
 * Calculate current streak for a habit
 * Streak = consecutive days with completion, going backwards from reference date
 * @param referenceDate - Reference date for calculations (defaults to today, useful for testing)
 */
function calculateStreak(
	entries: Record<string, number | undefined>,
	goal: number | undefined,
	threshold: number,
	referenceDate?: Date,
): number {
	const today = referenceDate ?? new Date();
	let streak = 0;
	let currentDate = today;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		const dateStr = format(currentDate, 'yyyy-MM-dd');
		const value = entries[dateStr];

		// Check if habit was completed on this day
		const isComplete =
			value !== undefined && (goal === undefined || value >= goal * threshold);

		if (!isComplete) {
			break;
		}

		streak++;
		currentDate = subDays(currentDate, 1);

		// Safety limit
		if (streak > 365) break;
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
		const habitEntries: Record<string, number | undefined> = {};

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
		const displayEntries: Record<string, number | undefined> = {};
		for (const date of dateRange) {
			displayEntries[date] = habitEntries[date];
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
			entries: displayEntries,
			streak: calculateStreak(habitEntries, goalValue, threshold, today),
		});
	}

	return habits;
}

/**
 * Get completion level for a single cell (0-3)
 * 0 = not done (░), 1 = low (▒), 2 = partial (▓), 3 = complete (█)
 */
export function getCompletionLevel(
	value: number | undefined,
	goal: number | undefined,
	threshold: number = 1.0,
): 0 | 1 | 2 | 3 {
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
