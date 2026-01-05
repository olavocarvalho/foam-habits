import React from 'react';
import {Text} from 'ink';
import {SYMBOLS, LEVEL_COLORS, type CompletionLevel} from '../lib/theme.js';

type Props = {
	level: CompletionLevel | null;
};

export default function Cell({level}: Props) {
	// null = before start date, render as blank space
	if (level === null) {
		return <Text> </Text>;
	}

	return <Text color={LEVEL_COLORS[level]}>{SYMBOLS[level]}</Text>;
}
