import React from 'react';
import {Box, Text} from 'ink';
import {SYMBOLS, getLevelColors, type CompletionLevel} from '../lib/theme.js';

const LABELS: Record<CompletionLevel, string> = {
	0: 'not done',
	1: 'low',
	2: 'partial',
	3: 'well done',
};

export default function Legend() {
	const levelColors = getLevelColors();

	return (
		<Box marginTop={1}>
			{([0, 1, 2, 3] as CompletionLevel[]).map((level, idx) => (
				<React.Fragment key={level}>
					<Text color={levelColors[level]}>{SYMBOLS[level]}</Text>
					<Text dimColor> {LABELS[level]}</Text>
					{idx < 3 && <Text dimColor>  </Text>}
				</React.Fragment>
			))}
		</Box>
	);
}
