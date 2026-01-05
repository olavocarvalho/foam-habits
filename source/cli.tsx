#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import chalk from 'chalk';
import {format} from 'date-fns';
import App from './app.js';
import {loadConfig, getRootDir, ConfigNotFoundError} from './lib/config.js';
import {logHabit} from './lib/logger.js';

const cli = meow(
	`foam-habits - Terminal habit tracker for Foam daily notes`,
	{
		importMeta: import.meta,
		autoHelp: false,
		flags: {
			weeks: {
				type: 'number',
				shortFlag: 'w',
				default: 4,
			},
			currentMonth: {
				type: 'boolean',
				shortFlag: 'm',
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
			help: {
				type: 'boolean',
				shortFlag: 'h',
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

// Handle --help flag: show colorized help and exit
// Note: meow creates both 'help' and 'h' properties separately
if (cli.flags.help || cli.flags['h']) {
	console.log(`
${chalk.bold('foam-habits')} - Terminal habit tracker for Foam daily notes

${chalk.cyan.bold('Usage')}
  $ foam-habits [options]

${chalk.cyan.bold('Options')}
  ${chalk.green('--weeks, -w')}          Number of weeks to display ${chalk.dim('(default: 4)')}
  ${chalk.green('--current-month, -m')}  Show current month only
  ${chalk.green('--log, -l')}            Log a habit entry
  ${chalk.green('--date, -d')}           Date for log entry ${chalk.dim('(default: today)')}
  ${chalk.green('--help, -h')}           Show this help

${chalk.cyan.bold('Examples')}
  ${chalk.yellow('$ foam-habits --weeks 12')}
  ${chalk.yellow('$ foam-habits --log "Gym"')}
  ${chalk.yellow('$ foam-habits --log "Drink water: 0.5L" --date 2025-01-05')}

${chalk.cyan.bold('Config')} ${chalk.dim('(.foam/habits.yaml)')}
  ${chalk.dim('habits:')}
  ${chalk.dim('  Gym:')}
  ${chalk.dim('    emoji: 💪      # optional (default: 🔹)')}
  ${chalk.dim('  Drink water:')}
  ${chalk.dim('    goal: 4L')}

  ${chalk.blue.underline('https://github.com/olavocarvalho/foam-habits#configuration')}
`);
	process.exit(0);
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
