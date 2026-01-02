import {useState, useEffect} from 'react';
import {type HabitData, type ViewArgs} from '../lib/schemas.js';
import {loadConfig, getRootDir} from '../lib/config.js';
import {parseJournals} from '../lib/parser.js';
import {aggregateHabits, getDateRange} from '../lib/tracker.js';

export type UseHabitDataArgs = ViewArgs & {
	referenceDate?: Date;
	reloadTrigger?: boolean;
};

export type UseHabitDataResult = {
	habits: HabitData[];
	dates: string[];
	warnings: string[];
	loading: boolean;
	error: Error | undefined;
};

export function useHabitData(args: UseHabitDataArgs): UseHabitDataResult {
	const [habits, setHabits] = useState<HabitData[]>([]);
	const [dates, setDates] = useState<string[]>([]);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>();

	useEffect(() => {
		setLoading(true);
		setError(undefined);

		try {
			// Load config
			const config = loadConfig();
			const rootDir = getRootDir();

			// Parse journal files
			const {entries, warnings: parseWarnings} = parseJournals(rootDir, config);

			// Get date range for display
			const dateRange = getDateRange(args, args.referenceDate);

			// Aggregate habit data
			const habitData = aggregateHabits(entries, config, dateRange, args.referenceDate);

			setHabits(habitData);
			setDates(dateRange);
			setWarnings(parseWarnings);
			setLoading(false);
		} catch (err) {
			// Preserve the original error type for instanceof checks
			setError(err instanceof Error ? err : new Error(String(err)));
			setLoading(false);
		}
	}, [args.weeks, args.currentMonth, args.referenceDate, args.reloadTrigger]);

	return {habits, dates, warnings, loading, error};
}
