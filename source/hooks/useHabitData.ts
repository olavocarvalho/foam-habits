import {useState, useEffect} from 'react';
import {type HabitData, type ViewArgs} from '../lib/schemas.js';
import {loadConfig, getRootDir} from '../lib/config.js';
import {parseJournals} from '../lib/parser.js';
import {aggregateHabits, getDateRange} from '../lib/tracker.js';

export type UseHabitDataResult = {
	habits: HabitData[];
	dates: string[];
	warnings: string[];
	loading: boolean;
	error: Error | undefined;
};

export function useHabitData(args: ViewArgs): UseHabitDataResult {
	const [habits, setHabits] = useState<HabitData[]>([]);
	const [dates, setDates] = useState<string[]>([]);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>();

	useEffect(() => {
		try {
			// Load config
			const config = loadConfig();
			const rootDir = getRootDir();

			// Parse journal files
			const {entries, warnings: parseWarnings} = parseJournals(rootDir, config);

			// Get date range for display
			const dateRange = getDateRange(args);

			// Aggregate habit data
			const habitData = aggregateHabits(entries, config, dateRange);

			setHabits(habitData);
			setDates(dateRange);
			setWarnings(parseWarnings);
			setLoading(false);
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
			setLoading(false);
		}
	}, [args.weeks, args.currentMonth]);

	return {habits, dates, warnings, loading, error};
}
