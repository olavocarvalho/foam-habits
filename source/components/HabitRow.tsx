import React from 'react';
import {Box, Text} from 'ink';
import Cell from './Cell.js';
import {type HabitData} from '../lib/schemas.js';
import {PALETTE} from '../lib/palette.js';
import {getCompletionLevel} from '../lib/tracker.js';
import {truncateVisual, stripVariationSelectors} from '../lib/string-utils.js';

type Props = {
	habit: HabitData;
	dates: string[];
	nameWidth: number;
};

export default function HabitRow({habit, dates, nameWidth}: Props) {
	const streakLabel = habit.streak === 1 ? 'day' : 'days';
	const showFire = habit.streak > 7;
	const displayName = truncateVisual(habit.name, nameWidth);
	// Strip variation selectors for consistent emoji width across terminals
	const emoji = stripVariationSelectors(habit.emoji);

	return (
		<Box>
			{/* Emoji - use minWidth to ensure consistent spacing */}
			<Box minWidth={3}>
				<Text>{emoji}</Text>
			</Box>

			{/* Name */}
			<Box minWidth={nameWidth + 1}>
				<Text>{displayName}</Text>
			</Box>

			{/* Cells */}
			<Box>
				{dates.map(date => {
					const value = habit.entries[date];
					const level = getCompletionLevel(value, habit.goal, habit.threshold);
					return <Cell key={date} level={level} />;
				})}
			</Box>

			{/* Streak - only show if > 0 */}
			{habit.streak > 0 && (
				<Box marginLeft={1}>
					<Text color={PALETTE.dimmed}>
						{habit.streak} {streakLabel}
					</Text>
					{showFire && <Text> 🔥</Text>}
				</Box>
			)}
		</Box>
	);
}
