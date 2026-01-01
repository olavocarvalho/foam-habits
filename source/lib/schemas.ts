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

// Single habit definition in config (.foam/habits.yaml)
export const HabitConfigSchema = z.object({
	emoji: z.string().min(1),
	// Goal with unit, e.g., "4L", "30min", "2.5km" (optional for boolean habits)
	goal: z.string().optional(),
	// Threshold percentage to consider habit "done" (0.0 - 1.0, default 1.0 = 100%)
	threshold: z.number().min(0).max(1).default(1.0),
});

// Full habits.yaml config
export const ConfigSchema = z.object({
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
	// date (YYYY-MM-DD) -> value (undefined = not done, number = value or 1 for boolean)
	entries: z.record(z.string(), z.number().optional()),
	streak: z.number().int().nonnegative(),
});

// CLI args for view command
export const ViewArgsSchema = z.object({
	weeks: z.number().int().positive().default(4),
	currentMonth: z.boolean().default(false),
});

// Types inferred from schemas
export type HabitConfig = z.infer<typeof HabitConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type HabitEntry = z.infer<typeof HabitEntrySchema>;
export type HabitData = z.infer<typeof HabitDataSchema>;
export type ViewArgs = z.infer<typeof ViewArgsSchema>;
