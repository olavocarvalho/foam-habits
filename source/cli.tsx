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
	  --weeks, -w       Number of weeks to display (default: 4)
	  --current-month   Show current month only
	  --help            Show this help

	Examples
	  $ foam-habits
	  $ foam-habits --weeks 12
	  $ foam-habits --current-month
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
		},
	},
);

render(<App weeks={cli.flags.weeks} currentMonth={cli.flags.currentMonth} />);
