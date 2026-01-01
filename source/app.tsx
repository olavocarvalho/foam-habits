import React from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import Heatmap from './components/Heatmap.js';
import Warnings from './components/Warnings.js';
import {useHabitData} from './hooks/useHabitData.js';
import {PALETTE} from './lib/palette.js';
import {type ViewArgs} from './lib/schemas.js';

type Props = ViewArgs;

export default function App({weeks, currentMonth}: Props) {
	const {habits, dates, warnings, loading, error} = useHabitData({
		weeks,
		currentMonth,
	});

	let content: React.ReactElement;

	if (error) {
		content = (
			<Box flexDirection="column">
				<Text color={PALETTE.red}>Error: {error.message}</Text>
			</Box>
		);
	} else if (loading) {
		content = (
			<Box>
				<Text color={PALETTE.title}>
					<Spinner type="dots" />
				</Text>
				<Text> Scanning journal entries...</Text>
			</Box>
		);
	} else if (habits.length === 0) {
		content = (
			<Box flexDirection="column">
				<Text color={PALETTE.yellow}>
					No habits configured in .foam/habits.yaml
				</Text>
			</Box>
		);
	} else {
		content = (
			<Box flexDirection="column">
				<Warnings warnings={warnings} />
				<Heatmap
					habits={habits}
					dates={dates}
					weeks={weeks}
					currentMonth={currentMonth}
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text> </Text>
			{content}
			<Text> </Text>
		</Box>
	);
}
