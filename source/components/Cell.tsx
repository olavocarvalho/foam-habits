import React from 'react';
import {Text} from 'ink';
import {PALETTE} from '../lib/palette.js';

type CompletionLevel = 0 | 1 | 2 | 3;

type Props = {
	level: CompletionLevel | null;
};

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

export default function Cell({level}: Props) {
	// null = before start date, render as blank space
	if (level === null) {
		return <Text> </Text>;
	}

	const color = COLORS[level];

	return <Text color={color}>{SYMBOLS[level]}</Text>;
}
