import React from 'react';
import {Box, Text} from 'ink';
import {PALETTE} from '../lib/palette.js';
import type {HistoryEntry} from '../lib/parser.js';
import type {Schedule} from '../lib/schemas.js';

type CompletionLevel = 0 | 1 | 2 | 3;

const SYMBOLS: Record<CompletionLevel, string> = {
	0: '░', // Not done
	1: '▒', // Low (<50%)
	2: '▓', // Partial (50-79%)
	3: '█', // Complete (80%+)
};

const COLORS: Record<CompletionLevel, string> = {
	0: PALETTE.dimmed,
	1: PALETTE.red,
	2: PALETTE.yellow,
	3: PALETTE.green,
};

type Props = {
	habitName: string;
	emoji: string;
	entries: HistoryEntry[];
	goal?: number;
	threshold: number;
	unit?: string;
	weeks: number;
	startDate?: string;
	schedule: Schedule;
};

function formatSchedule(schedule: Schedule): string {
	if (schedule === 'daily') return 'Daily';
	if (schedule === 'weekdays') return 'Weekdays (Mon-Fri)';
	if (schedule === 'weekends') return 'Weekends (Sat-Sun)';
	if (Array.isArray(schedule)) {
		const days = schedule.map(d => d.charAt(0).toUpperCase() + d.slice(1));
		return days.join('/');
	}
	return 'Daily';
}

function getCompletionLevel(
	value: number | undefined,
	goal: number | undefined,
	threshold: number,
): CompletionLevel {
	if (value === undefined) return 0;
	if (goal === undefined) return 3; // Boolean habit, any value = complete

	const progress = value / goal;
	const effectiveThreshold = threshold;

	if (progress >= effectiveThreshold) return 3;
	if (progress >= effectiveThreshold * 0.5) return 2;
	if (progress > 0) return 1;
	return 0;
}

export default function HistoryView({
	habitName,
	emoji,
	entries,
	goal,
	threshold,
	unit,
	weeks,
	startDate: habitStartDate,
	schedule,
}: Props) {
	// Filter entries to the specified number of weeks
	const today = new Date();
	const rangeStart = new Date(today);
	rangeStart.setDate(rangeStart.getDate() - weeks * 7);
	const rangeStartStr = rangeStart.toISOString().slice(0, 10);

	const filteredEntries = entries.filter(e => e.date >= rangeStartStr);

	// Generate all dates in range (for showing gaps)
	const allDates: string[] = [];
	const current = new Date(today);
	while (current >= rangeStart) {
		allDates.push(current.toISOString().slice(0, 10));
		current.setDate(current.getDate() - 1);
	}

	// Create a map for quick lookup
	const entryMap = new Map(filteredEntries.map(e => [e.date, e]));

	// Format schedule info
	const scheduleStr = formatSchedule(schedule);

	return (
		<Box flexDirection="column" paddingTop={1}>
			<Text color={PALETTE.title}>
				{emoji} {habitName} - Last {weeks * 7} days
			</Text>
			<Box>
				<Text dimColor>Schedule: {scheduleStr}</Text>
				{habitStartDate && (
					<Text dimColor>  |  Started: {habitStartDate}</Text>
				)}
			</Box>
			<Text> </Text>
			{allDates.map(date => {
				const entry = entryMap.get(date);
				const level = getCompletionLevel(entry?.value, goal, threshold);
				const color = COLORS[level];
				const symbol = SYMBOLS[level];

				// Format value display
				let valueStr = '';
				if (entry?.value !== undefined && goal !== undefined) {
					valueStr = `${entry.value}${unit ?? ''}`;
				}

				return (
					<Box key={date}>
						<Text dimColor>{date}</Text>
						<Text>  </Text>
						<Text color={color}>{symbol}</Text>
						<Text>  </Text>
						{valueStr && (
							<>
								<Text dimColor>{valueStr}</Text>
								<Text>  </Text>
							</>
						)}
						{entry?.observation && (
							<Text>{entry.observation}</Text>
						)}
					</Box>
				);
			})}
		</Box>
	);
}
