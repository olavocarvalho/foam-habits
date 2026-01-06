import fs from 'node:fs';
import path from 'node:path';
import {type Config, type HabitConfig, parseGoal} from './schemas.js';
import {inferJournalFolder, extractHabitsSection} from './parser.js';

// Regex to extract value from habit entry (e.g., "Water: 2.5L" -> 2.5)
const VALUE_REGEX = /:\s*([\d.]+)/;

// Regex to strip leading emojis from habit entries
const LEADING_EMOJI_REGEX =
	/^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]|\u200D|\uFE0F|\s)+/u;

// Regex to match list items with optional checkbox
const LIST_ITEM_REGEX = /^[-*]\s+(?:\[([xX\s])\]\s*)?(.+)$/;

export type LogResult = {
	success: boolean;
	message: string;
	filePath: string;
	action: 'created' | 'added' | 'updated' | 'skipped';
	warning?: string;
	previousValue?: number;
	newValue?: number;
};

export type ParsedLogInput = {
	habitName: string;
	value: number | undefined;
	rawValue: string | undefined;
};

/**
 * Parse a log input string like "Gym" or "Drink water: 3.5L"
 */
export function parseLogInput(input: string): ParsedLogInput {
	let trimmed = input.trim();

	// Strip leading emojis
	trimmed = trimmed.replace(LEADING_EMOJI_REGEX, '').trim();

	// Check for colon separator
	const colonIndex = trimmed.indexOf(':');

	if (colonIndex > 0) {
		const habitName = trimmed.slice(0, colonIndex).trim();
		const rawValue = trimmed.slice(colonIndex + 1).trim();

		// Extract numeric value
		const valueMatch = rawValue.match(/^([\d.]+)/);
		const value = valueMatch?.[1] ? parseFloat(valueMatch[1]) : undefined;

		return {
			habitName,
			value,
			rawValue: rawValue || undefined,
		};
	}

	return {
		habitName: trimmed,
		value: undefined,
		rawValue: undefined,
	};
}

/**
 * Find a habit in config by name (case-insensitive)
 */
export function findHabitInConfig(
	habitName: string,
	config: Config,
): {key: string; config: HabitConfig} | undefined {
	const lowerName = habitName.toLowerCase();

	for (const [key, habitConfig] of Object.entries(config.habits)) {
		if (key.toLowerCase() === lowerName) {
			return {key, config: habitConfig};
		}
	}

	return undefined;
}

/**
 * Format a habit entry for writing to markdown
 */
export function formatHabitEntry(
	habitName: string,
	value: number | undefined,
	unit: string | undefined,
	useCheckbox: boolean,
): string {
	const prefix = useCheckbox ? '- [x] ' : '- ';

	if (value !== undefined) {
		const unitStr = unit ?? '';
		return `${prefix}${habitName}: ${value}${unitStr}`;
	}

	return `${prefix}${habitName}`;
}

/**
 * Get the daily note file path for a given date
 */
export function getDailyNotePath(rootDir: string, date: string): string {
	const journalFolder = inferJournalFolder(rootDir);
	return path.join(rootDir, journalFolder, `${date}.md`);
}

/**
 * Process template content by replacing FOAM variables
 */
export function processTemplate(template: string, date: string): string {
	const [year, month, day] = date.split('-');

	return template
		.replace(/\$\{FOAM_DATE_YEAR\}/g, year!)
		.replace(/\$\{FOAM_DATE_MONTH\}/g, month!)
		.replace(/\$\{FOAM_DATE_DATE\}/g, day!)
		.replace(/\$\{FOAM_DATE\}/g, date);
}

/**
 * Create a new daily note from template or default
 */
export function createDailyNote(rootDir: string, date: string): string {
	const templatePath = path.join(
		rootDir,
		'.foam',
		'templates',
		'daily-note.md',
	);

	// Try to use template if it exists
	if (fs.existsSync(templatePath)) {
		const template = fs.readFileSync(templatePath, 'utf8');

		// Remove YAML frontmatter (between --- markers) from output
		const withoutFrontmatter = template.replace(/^---\n[\s\S]*?\n---\n?/, '');

		return processTemplate(withoutFrontmatter, date);
	}

	// Default template
	return `# ${date}

## Habits


## Notes

`;
}

/**
 * Find an existing habit entry in the habits section
 */
export function findExistingEntry(
	habitsSection: string,
	habitName: string,
): {lineIndex: number; line: string; value: number | undefined; isChecked: boolean} | undefined {
	const lines = habitsSection.split('\n');
	const lowerName = habitName.toLowerCase();

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const match = line.match(LIST_ITEM_REGEX);

		if (!match?.[2]) continue;

		let entryText = match[2].trim();

		// Strip leading emojis
		entryText = entryText.replace(LEADING_EMOJI_REGEX, '').trim();

		// Extract habit name (before colon or whole string)
		const colonIndex = entryText.indexOf(':');
		const entryName =
			colonIndex > 0 ? entryText.slice(0, colonIndex).trim() : entryText;

		if (entryName.toLowerCase() === lowerName) {
			// Extract value if present
			const valueMatch = entryText.match(VALUE_REGEX);
			const value = valueMatch?.[1] ? parseFloat(valueMatch[1]) : undefined;

			// Check if checkbox is checked (x/X) or no checkbox (also considered done)
			// match[1] is undefined if no checkbox, 'x'/'X' if checked, ' ' if unchecked
			const checkboxState = match[1];
			const isChecked = checkboxState === undefined || checkboxState.toLowerCase() === 'x';

			return {lineIndex: i, line, value, isChecked};
		}
	}

	return undefined;
}

/**
 * Update or add a habit entry in file content
 */
export function updateHabitEntry(
	content: string,
	habitName: string,
	value: number | undefined,
	unit: string | undefined,
	hasGoal: boolean,
	useCheckbox: boolean,
): {
	content: string;
	action: 'added' | 'updated' | 'skipped';
	previousValue?: number;
	newValue?: number;
} {

	// Check if ## Habits section exists
	const habitsSection = extractHabitsSection(content);

	if (!habitsSection) {
		// Need to add ## Habits section
		const lines = content.split('\n');
		let insertIndex = lines.length;

		// Find ## Notes or other section to insert before
		for (let i = 0; i < lines.length; i++) {
			if (/^##\s+/.test(lines[i]!)) {
				insertIndex = i;
				break;
			}
		}

		// Insert ## Habits section with the new entry
		const newEntry = formatHabitEntry(habitName, value, unit, useCheckbox);
		const habitsBlock = ['## Habits', '', newEntry, ''];

		lines.splice(insertIndex, 0, ...habitsBlock);

		return {
			content: lines.join('\n'),
			action: 'added',
			newValue: value ?? 1,
		};
	}

	// Check for existing entry
	const existing = findExistingEntry(habitsSection, habitName);

	if (!existing) {
		// Add new entry at end of habits section
		const lines = content.split('\n');
		let inHabitsSection = false;
		let lastHabitLineIndex = -1;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!;

			if (/^##\s+habits?\s*$/i.test(line)) {
				inHabitsSection = true;
				lastHabitLineIndex = i;
				continue;
			}

			if (inHabitsSection && /^##\s+/.test(line)) {
				break;
			}

			if (inHabitsSection) {
				// Track last non-empty line in habits section
				if (line.trim() !== '' || LIST_ITEM_REGEX.test(line)) {
					lastHabitLineIndex = i;
				}
			}
		}

		// Insert after last habit line
		const newEntry = formatHabitEntry(habitName, value, unit, useCheckbox);
		lines.splice(lastHabitLineIndex + 1, 0, newEntry);

		return {
			content: lines.join('\n'),
			action: 'added',
			newValue: value ?? 1,
		};
	}

	// Entry exists - check if we should update or skip
	if (hasGoal && value !== undefined) {
		// Goal-oriented habit: sum values
		const previousValue = existing.value ?? 0;
		const newValue = previousValue + value;

		// Replace the line with updated value
		const lines = content.split('\n');

		// Find the actual line index in the full content
		let inHabitsSection = false;
		let sectionLineIndex = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!;

			if (/^##\s+habits?\s*$/i.test(line)) {
				inHabitsSection = true;
				continue;
			}

			if (inHabitsSection && /^##\s+/.test(line)) {
				break;
			}

			if (inHabitsSection) {
				if (sectionLineIndex === existing.lineIndex) {
					// Update just the value portion, preserving emoji and casing
					// Match ": <number><optional unit>" and replace with new value
					lines[i] = line.replace(
						/:\s*[\d.]+\s*\S*/,
						`: ${newValue}${unit ?? ''}`,
					);
					break;
				}
				sectionLineIndex++;
			}
		}

		return {
			content: lines.join('\n'),
			action: 'updated',
			previousValue,
			newValue,
		};
	}

	// Boolean habit - check if it needs to be marked as done
	// Handle unchecked checkboxes even if useCheckbox config isn't set,
	// since user may have manually added checkboxes in their file
	if (!existing.isChecked) {
		// Checkbox is unchecked, mark it as done
		const lines = content.split('\n');

		// Find the actual line index in the full content
		let inHabitsSection = false;
		let sectionLineIndex = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!;

			if (/^##\s+habits?\s*$/i.test(line)) {
				inHabitsSection = true;
				continue;
			}

			if (inHabitsSection && /^##\s+/.test(line)) {
				break;
			}

			if (inHabitsSection) {
				if (sectionLineIndex === existing.lineIndex) {
					// Replace unchecked checkbox with checked
					lines[i] = line.replace(/\[ \]/, '[x]');
					break;
				}
				sectionLineIndex++;
			}
		}

		return {
			content: lines.join('\n'),
			action: 'updated',
			newValue: 1,
		};
	}

	// Boolean habit already logged - skip
	return {
		content,
		action: 'skipped',
	};
}

/**
 * Main entry point: log a habit to a daily note
 */
export function logHabit(
	rootDir: string,
	input: string,
	date: string,
	config: Config,
): LogResult {
	const filePath = getDailyNotePath(rootDir, date);
	const {habitName, value, rawValue} = parseLogInput(input);

	// Find habit in config
	const habitMatch = findHabitInConfig(habitName, config);
	let warning: string | undefined;

	if (!habitMatch) {
		warning = `"${habitName}" is not in .foam/habits.yaml`;
	}

	// Determine unit from config or input
	let unit: string | undefined;
	if (habitMatch?.config.goal) {
		const parsed = parseGoal(habitMatch.config.goal);
		unit = parsed.unit;
	} else if (rawValue) {
		// Try to extract unit from raw value
		const unitMatch = rawValue.match(/[\d.]+\s*(.+)/);
		unit = unitMatch?.[1]?.trim();
	}

	// Check if file exists
	const fileExists = fs.existsSync(filePath);
	let content: string;

	if (fileExists) {
		content = fs.readFileSync(filePath, 'utf8');
	} else {
		content = createDailyNote(rootDir, date);
	}

	// Update content with habit entry
	const hasGoal = habitMatch?.config.goal !== undefined;
	const useCheckbox = config.config?.checkbox ?? false;
	const result = updateHabitEntry(
		content,
		habitMatch?.key ?? habitName,
		value,
		unit,
		hasGoal,
		useCheckbox,
	);

	// Ensure journal directory exists
	const journalDir = path.dirname(filePath);
	if (!fs.existsSync(journalDir)) {
		fs.mkdirSync(journalDir, {recursive: true});
	}

	// Write file
	fs.writeFileSync(filePath, result.content, 'utf8');

	// Build result message
	const journalFolder = inferJournalFolder(rootDir);
	const relPath = `${journalFolder}/${date}.md`;
	const displayName = habitMatch?.key ?? habitName;

	let message: string;
	let action: LogResult['action'];

	if (!fileExists) {
		message = `Created ${relPath} with habit: ${displayName}`;
		action = 'created';
	} else if (result.action === 'added') {
		message = `Logged "${displayName}" in ${relPath}`;
		action = 'added';
	} else if (result.action === 'updated') {
		// Check if this was a checkbox being marked done (no previousValue) vs quantitative update
		if (result.previousValue === undefined) {
			message = `Marked "${displayName}" as done in ${relPath}`;
		} else {
			const prevStr = `${result.previousValue}${unit ?? ''}`;
			const newStr = `${result.newValue}${unit ?? ''}`;
			message = `Updated "${displayName}" in ${relPath}: ${prevStr} → ${newStr}`;
		}
		action = 'updated';
	} else {
		message = `"${displayName}" already logged in ${relPath}`;
		action = 'skipped';
	}

	return {
		success: true,
		message,
		filePath,
		action,
		warning,
		previousValue: result.previousValue,
		newValue: result.newValue,
	};
}
