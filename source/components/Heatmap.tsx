import React from 'react';
import {Box} from 'ink';
import Header from './Header.js';
import HabitRow from './HabitRow.js';
import {type HabitData} from '../lib/schemas.js';

type Props = {
	habits: HabitData[];
	dates: string[];
	weeks: number;
	currentMonth: boolean;
};

const MAX_NAME_WIDTH = 12;
const MIN_NAME_WIDTH = 5;

export default function Heatmap({habits, dates, weeks, currentMonth}: Props) {
	// Calculate the max habit name width for alignment (capped at MAX_NAME_WIDTH)
	const longestName = Math.max(
		...habits.map(h => h.name.length),
		MIN_NAME_WIDTH,
	);
	const nameWidth = Math.min(longestName, MAX_NAME_WIDTH);

	return (
		<Box flexDirection="column">
			<Header
				dates={dates}
				nameWidth={nameWidth}
				weeks={weeks}
				currentMonth={currentMonth}
			/>
			{habits.map(habit => (
				<HabitRow
					key={habit.name}
					habit={habit}
					dates={dates}
					nameWidth={nameWidth}
				/>
			))}
		</Box>
	);
}
