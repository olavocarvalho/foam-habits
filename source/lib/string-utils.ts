import stringWidth from 'string-width';

/**
 * Strip variation selectors (U+FE0E, U+FE0F) from emojis for consistent rendering
 */
export function stripVariationSelectors(str: string): string {
	// eslint-disable-next-line no-control-regex
	return str.replace(/[\uFE0E\uFE0F]/g, '');
}

/**
 * Pad a string to a target visual width, accounting for emoji/unicode widths
 */
export function padEndVisual(str: string, targetWidth: number): string {
	const currentWidth = stringWidth(str);
	const padding = Math.max(0, targetWidth - currentWidth);
	return str + ' '.repeat(padding);
}

/**
 * Truncate a string to a max visual width, adding "…" if truncated
 */
export function truncateVisual(str: string, maxWidth: number): string {
	const currentWidth = stringWidth(str);
	if (currentWidth <= maxWidth) {
		return padEndVisual(str, maxWidth);
	}

	// Need to truncate - find where to cut
	let truncated = '';
	let width = 0;
	for (const char of str) {
		const charWidth = stringWidth(char);
		if (width + charWidth > maxWidth - 1) {
			break;
		}
		truncated += char;
		width += charWidth;
	}

	return padEndVisual(truncated + '…', maxWidth);
}

/**
 * Get the visual width of a string
 */
export function getVisualWidth(str: string): number {
	return stringWidth(str);
}
