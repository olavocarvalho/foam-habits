export const PALETTE = {
	title: '#9EA5FF',
	red: '#FC8897',
	yellow: '#C0B435',
	green: '#6BC87B',
	// Dimmed text with a slight tint matching the title hue
	dimmed: '#717380',
} as const;

export type CompletionLevel = 0 | 1 | 2 | 3;

export const SYMBOLS: Record<CompletionLevel, string> = {
	0: '░', // Not done
	1: '▒', // Low (<50%)
	2: '▓', // Partial (50-79%)
	3: '█', // Complete (80%+)
};

export const LEVEL_COLORS: Record<CompletionLevel, string> = {
	0: PALETTE.dimmed,
	1: PALETTE.red,
	2: PALETTE.yellow,
	3: PALETTE.green,
};
