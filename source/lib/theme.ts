export const DEFAULT_PALETTE = {
	accent: '#626BE2',
	accentLight: '#AAB1EF',
	red: '#FC8897',
	yellow: '#C0B435',
	green: '#6BC87B',
	dimmed: '#717380',
} as const;

export type PaletteColors = {
	accent: string;
	accentLight: string;
	red: string;
	yellow: string;
	green: string;
	dimmed: string;
};

// Mutable palette that can be configured by user
export let PALETTE: PaletteColors = {...DEFAULT_PALETTE};

export function setPalette(colors: Partial<PaletteColors>) {
	PALETTE = {...DEFAULT_PALETTE, ...colors};
}

export type CompletionLevel = 0 | 1 | 2 | 3;

export const SYMBOLS: Record<CompletionLevel, string> = {
	0: '░', // Not done
	1: '▒', // Low (<50%)
	2: '▓', // Partial (50-79%)
	3: '█', // Complete (80%+)
};

export function getLevelColors(): Record<CompletionLevel, string> {
	return {
		0: PALETTE.dimmed,
		1: PALETTE.red,
		2: PALETTE.yellow,
		3: PALETTE.green,
	};
}

// For backwards compatibility - but prefer getLevelColors() for dynamic colors
export const LEVEL_COLORS: Record<CompletionLevel, string> = {
	0: DEFAULT_PALETTE.dimmed,
	1: DEFAULT_PALETTE.red,
	2: DEFAULT_PALETTE.yellow,
	3: DEFAULT_PALETTE.green,
};
