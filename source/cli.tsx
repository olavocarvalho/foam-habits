#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ foam-habits [options]

	Options
	  --weeks, -w          Number of weeks to display (default: 4)
	  --current-month      Show current month only
	  --reference-date     Reference date for calculations (YYYY-MM-DD)
	  --help               Show this help

	Examples
	  $ foam-habits
	  $ foam-habits --weeks 12
	  $ foam-habits --current-month
	  $ foam-habits --reference-date 1989-04-06
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
		},
	},
);

// Parse reference date if provided (as local date, not UTC)
let referenceDate: Date | undefined;
if (cli.flags.referenceDate) {
	const match = cli.flags.referenceDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) {
		console.error(`Invalid date format: ${cli.flags.referenceDate}`);
		console.error('Expected format: YYYY-MM-DD');
		process.exit(1);
	}
	// Parse as local date (month is 0-indexed)
	referenceDate = new Date(
		parseInt(match[1]!, 10),
		parseInt(match[2]!, 10) - 1,
		parseInt(match[3]!, 10),
	);
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
