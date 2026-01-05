import React, {useState, useCallback} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import HeatmapView from './components/HeatmapView.js';
import Warnings from './components/Warnings.js';
import ConfigPrompt from './components/ConfigPrompt.js';
import {useHabitData} from './hooks/useHabitData.js';
import {PALETTE} from './lib/theme.js';
import {type ViewArgs} from './lib/schemas.js';
import {ConfigNotFoundError, createDefaultConfig} from './lib/config.js';

type Props = ViewArgs & {
	referenceDate?: Date;
};

export default function App({weeks, currentMonth, referenceDate}: Props) {
	const [configCreated, setConfigCreated] = useState(false);
	const [createdPath, setCreatedPath] = useState<string | undefined>();

	const {habits, dates, warnings, loading, error} = useHabitData({
		weeks,
		currentMonth,
		referenceDate,
		reloadTrigger: configCreated,
	});

	const handleCreateConfig = useCallback(() => {
		const configPath = createDefaultConfig();
		setCreatedPath(configPath);
		setConfigCreated(true);
	}, []);

	let content: React.ReactElement;

	if (createdPath && habits.length > 0) {
		content = (
			<Box flexDirection="column">
				<Text color={PALETTE.green}>Created {createdPath}</Text>
				<Text> </Text>
				<Warnings warnings={warnings} />
				<HeatmapView
					habits={habits}
					dates={dates}
					weeks={weeks}
					currentMonth={currentMonth}
				/>
			</Box>
		);
	} else if (error instanceof ConfigNotFoundError) {
		content = <ConfigPrompt onCreateConfig={handleCreateConfig} />;
	} else if (error) {
		content = (
			<Box flexDirection="column">
				<Text color={PALETTE.red}>Error: {error.message}</Text>
			</Box>
		);
	} else if (loading) {
		content = (
			<Box>
				<Text color={PALETTE.accent}>
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
				<HeatmapView
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
