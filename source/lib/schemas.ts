import {z} from 'zod';

/**
 * Parse a goal string like "4L", "30min", "2.5km" into value and unit
 */
export function parseGoal(goalStr: string): {
	value: number;
	unit: string | undefined;
} {
	const match = goalStr.match(/^([\d.]+)\s*(.*)$/);
	if (!match?.[1]) {
		throw new Error(
			`Invalid goal format: "${goalStr}". Expected format like "4L", "30min", "2.5km"`,
		);
	}
	const value = parseFloat(match[1]);
	const unit = match[2]?.trim() || undefined;
	return {value, unit};
}

// Days of the week (lowercase, 3-letter abbreviations)
export const DaySchema = z.enum([
	'mon',
	'tue',
	'wed',
	'thu',
	'fri',
	'sat',
	'sun',
]);
export type Day = z.infer<typeof DaySchema>;

// Schedule for habit: daily (default), weekdays, weekends, or custom day array
export const ScheduleSchema = z
	.union([
		z.literal('daily'),
		z.literal('weekdays'),
		z.literal('weekends'),
		z.array(DaySchema),
	])
	.default('daily');
export type Schedule = z.infer<typeof ScheduleSchema>;

// Default emoji for habits without custom emoji
export const DEFAULT_EMOJI = '🔹';

// Single habit definition in config (.foam/habits.yaml)
export const HabitConfigSchema = z.object({
	emoji: z.string().min(1).optional(),
	// Goal with unit, e.g., "4L", "30min", "2.5km" (optional for boolean habits)
	goal: z.string().optional(),
	// Threshold percentage to consider habit "done" (0.0 - 1.0, default 1.0 = 100%)
	threshold: z.number().min(0).max(1).default(1.0),
	// Start date for habit tracking (YYYY-MM-DD). Days before this show as blank.
	'start-date': z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	// Schedule for habit tracking: daily (default), weekdays, weekends, or custom day array
	schedule: ScheduleSchema,
});

// Global config section in habits.yaml
export const GlobalConfigSchema = z.object({
	// Use checkbox format "- [x] Habit" when logging via CLI (default: false = "- Habit")
	checkbox: z.boolean().default(false),
});

// Full habits.yaml config
export const ConfigSchema = z.object({
	// Global configuration options
	config: GlobalConfigSchema.optional(),
	// Habit definitions
	habits: z.record(z.string(), HabitConfigSchema),
});

// Parsed habit entry from a daily note
export const HabitEntrySchema = z.object({
	name: z.string().min(1),
	value: z.number().positive().optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Aggregated habit data for display
export const HabitDataSchema = z.object({
	name: z.string(),
	emoji: z.string(),
	goal: z.number().optional(),
	unit: z.string().optional(),
	threshold: z.number().default(1.0),
	// Start date for habit tracking (YYYY-MM-DD). Days before this show as blank.
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	// Schedule for habit tracking
	schedule: ScheduleSchema,
	// date (YYYY-MM-DD) -> value (undefined = not done, number = value or 1 for boolean, null = before start date or unscheduled)
	entries: z.record(z.string(), z.number().nullable().optional()),
	streak: z.number().int().nonnegative(),
});

// CLI args for view command
export const ViewArgsSchema = z.object({
	weeks: z.number().int().positive().default(4),
	currentMonth: z.boolean().default(false),
});

// Types inferred from schemas
export type HabitConfig = z.infer<typeof HabitConfigSchema>;
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type HabitEntry = z.infer<typeof HabitEntrySchema>;
export type HabitData = z.infer<typeof HabitDataSchema>;
export type ViewArgs = z.infer<typeof ViewArgsSchema>;
