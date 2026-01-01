import React from 'react';
import {Box, Text} from 'ink';
import {format, parseISO} from 'date-fns';
import {PALETTE} from '../lib/palette.js';
import {padEndVisual} from '../lib/string-utils.js';

type Props = {
	dates: string[];
	nameWidth: number;
	weeks: number;
	currentMonth: boolean;
};

export default function Header({dates, nameWidth, weeks, currentMonth}: Props) {
	const habitLabel = padEndVisual('Habit', nameWidth);
	const labelColumnWidth = 3 + nameWidth + 1; // emoji (3) + name + space

	// Track months and build header lines
	const seenMonths = new Set<string>();

	// Build month line and day line
	// Month labels appear at start of each month
	// Day numbers (2-digit) appear at month starts + every 7 days + last day
	let monthLine = '';
	let dayLine = '';

	dates.forEach((date, index) => {
		const parsed = parseISO(date);
		const monthKey = format(parsed, 'yyyy-MM');
		const day = format(parsed, 'd'); // 1-2 digit day (1, 2, ... 31)
		const monthAbbr = format(parsed, 'MMM');

		const isFirstOfMonth = !seenMonths.has(monthKey);
		if (isFirstOfMonth) {
			seenMonths.add(monthKey);
		}

		// Decide what to show at this position
		const showDayLabel =
			isFirstOfMonth || index === dates.length - 1 || (index + 1) % 7 === 0;

		// Month line: show month abbrev at first of each month
		if (isFirstOfMonth) {
			// Pad to current position if needed
			while (monthLine.length < index) {
				monthLine += ' ';
			}
			monthLine += monthAbbr;
		}

		// Day line: show day at key positions
		if (showDayLabel) {
			// Pad to current position if needed
			while (dayLine.length < index) {
				dayLine += ' ';
			}
			// Pad single-digit days with leading space for alignment
			const dayStr = day.length === 1 ? ` ${day}` : day;
			dayLine += dayStr;
		}
	});

	// Pad lines to match dates length
	while (monthLine.length < dates.length) {
		monthLine += ' ';
	}
	while (dayLine.length < dates.length) {
		dayLine += ' ';
	}

	return (
		<Box flexDirection="column" marginBottom={1}>
			{/* Title */}
			<Box marginBottom={1}>
				<Text bold color={PALETTE.title}>
					Foam Habits
				</Text>
				<Text color={PALETTE.dimmed}>
					{currentMonth
						? ` / ${dates[0] ? format(parseISO(dates[0]), 'MMMM yyyy') : ''}`
						: ` / Last ${weeks * 7} Days`}
				</Text>
			</Box>

			{/* Month markers row */}
			<Box>
				<Box minWidth={labelColumnWidth}>
					<Text> </Text>
				</Box>
				<Text color={PALETTE.dimmed}>{monthLine}</Text>
			</Box>

			{/* Day numbers row */}
			<Box>
				<Box minWidth={labelColumnWidth}>
					<Text color={PALETTE.dimmed}>{habitLabel}</Text>
				</Box>
				<Text color={PALETTE.dimmed}>{dayLine}</Text>
			</Box>
		</Box>
	);
}
