#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {format} from 'date-fns';
import App from './app.js';
import {loadConfig, getRootDir, ConfigNotFoundError} from './lib/config.js';
import {logHabit} from './lib/logger.js';

const cli = meow(
	`
	Usage
	  $ foam-habits [options]

	Options
	  --weeks, -w          Number of weeks to display (default: 4)
	  --current-month      Show current month only
	  --reference-date     Reference date for calculations (YYYY-MM-DD)
	  --log, -l            Log a habit entry (e.g., "Gym" or "Drink water: 0.5L")
	  --date, -d           Date for log entry (YYYY-MM-DD, default: today)
	  --help               Show this help

	Examples
	  $ foam-habits
	  $ foam-habits --weeks 12
	  $ foam-habits --current-month
	  $ foam-habits --log "Gym"
	  $ foam-habits --log "Drink water: 0.5L" --date 2025-01-05
`,
	{
		importMeta: import.meta,
		flags: {
			weeks: {
				type: 'number',
				shortFlag: 'w',
				default: 4,
			},
			currentMonth: {
				type: 'boolean',
				default: false,
			},
			referenceDate: {
				type: 'string',
			},
			log: {
				type: 'string',
				shortFlag: 'l',
			},
			date: {
				type: 'string',
				shortFlag: 'd',
			},
		},
	},
);

/**
 * Parse a date string (YYYY-MM-DD) into components
 */
function parseDateString(
	dateStr: string,
): {year: number; month: number; day: number} | undefined {
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		return undefined;
	}
	return {
		year: parseInt(match[1]!, 10),
		month: parseInt(match[2]!, 10) - 1, // 0-indexed
		day: parseInt(match[3]!, 10),
	};
}

// Handle --log flag: log a habit and exit
if (cli.flags.log) {
	// Determine log date
	let logDate: string;
	if (cli.flags.date) {
		const parsed = parseDateString(cli.flags.date);
		if (!parsed) {
			console.error(`Invalid date format: ${cli.flags.date}`);
			console.error('Expected format: YYYY-MM-DD');
			process.exit(1);
		}
		const dateObj = new Date(parsed.year, parsed.month, parsed.day);
		if (Number.isNaN(dateObj.getTime())) {
			console.error(`Invalid date: ${cli.flags.date}`);
			process.exit(1);
		}
		logDate = cli.flags.date;
	} else {
		logDate = format(new Date(), 'yyyy-MM-dd');
	}

	try {
		const config = loadConfig();
		const rootDir = getRootDir();
		const result = logHabit(rootDir, cli.flags.log, logDate, config);

		if (result.warning) {
			console.error(`\u26A0 ${result.warning}`);
		}

		if (result.action === 'skipped') {
			console.log(`\u2139 ${result.message}`);
		} else {
			console.log(`\u2713 ${result.message}`);
		}

		process.exit(0);
	} catch (error) {
		if (error instanceof ConfigNotFoundError) {
			console.error('Error: No .foam/habits.yaml config found');
			console.error(
				'Run foam-habits in a directory with a Foam workspace to get started.',
			);
		} else {
			console.error(
				`Error: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		process.exit(1);
	}
}

// Parse reference date if provided (as local date, not UTC)
let referenceDate: Date | undefined;
if (cli.flags.referenceDate) {
	const parsed = parseDateString(cli.flags.referenceDate);
	if (!parsed) {
		console.error(`Invalid date format: ${cli.flags.referenceDate}`);
		console.error('Expected format: YYYY-MM-DD');
		process.exit(1);
	}
	// Parse as local date (month is 0-indexed)
	referenceDate = new Date(parsed.year, parsed.month, parsed.day);
	if (Number.isNaN(referenceDate.getTime())) {
		console.error(`Invalid date: ${cli.flags.referenceDate}`);
		process.exit(1);
	}
}

render(
	<App
		weeks={cli.flags.weeks}
		currentMonth={cli.flags.currentMonth}
		referenceDate={referenceDate}
	/>,
);
