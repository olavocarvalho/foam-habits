import fs from 'node:fs';
import path from 'node:path';
import {type Config, type HabitEntry} from './schemas.js';

export type ParseResult = {
	entries: HabitEntry[];
	warnings: string[];
};

// Regex to extract date from filename (YYYY-MM-DD.md)
const DATE_REGEX = /^(\d{4}-\d{2}-\d{2})\.md$/;

// Regex to extract value from habit entry (e.g., "Water: 2.5L" -> 2.5)
const VALUE_REGEX = /:\s*([\d.]+)/;

// Regex to match list items with optional checkbox (e.g., "- [x] Gym" or "- Gym")
// Group 1: checkbox state (x, X, or space) - optional
// Group 2: the actual content
const LIST_ITEM_REGEX = /^[-*]\s+(?:\[([xX\s])\]\s*)?(.+)$/;

// Regex to strip leading emojis from habit entries
// Matches emoji presentation sequences, extended pictographics, ZWJ sequences, and whitespace
const LEADING_EMOJI_REGEX = /^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]|\u200D|\uFE0F|\s)+/u;

// Regex to match observation entries in Notes section
// Supports both formats:
//   - **Gym:** observation (colon inside bold)
//   - **Gym**: observation (colon outside bold)
const OBSERVATION_REGEX = /^[-*]\s+\*\*([^*:]+):?\*\*:?\s*(.+)$/;

// Default folder if template doesn't exist or can't be parsed
const DEFAULT_JOURNAL_FOLDER = 'journal';

/**
 * Parse the journal folder from daily-note template content
 * Exported for testing
 */
export function parseFolderFromTemplate(content: string): string | undefined {
	// Extract YAML frontmatter (between --- markers)
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!frontmatterMatch?.[1]) {
		return undefined;
	}

	// Extract filepath from frontmatter (e.g., filepath: "/journal/${FOAM_DATE}...")
	const filepathMatch = frontmatterMatch[1].match(
		/filepath:\s*["']?([^"'\n]+)["']?/,
	);
	if (!filepathMatch?.[1]) {
		return undefined;
	}

	const filepath = filepathMatch[1].trim();

	// Extract folder from filepath (everything before the filename pattern)
	// Handle both "/journal/..." and "journal/..." formats
	const normalizedPath = filepath.startsWith('/') ? filepath.slice(1) : filepath;

	// Find the folder part (before the first ${...} or the last /)
	const folderMatch = normalizedPath.match(/^([^$]+)\//);
	if (folderMatch?.[1]) {
		return folderMatch[1];
	}

	return undefined;
}

/**
 * Extract the journal folder from Foam's daily-note template
 * Reads .foam/templates/daily-note.md and parses the filepath from frontmatter
 */
export function inferJournalFolder(rootDir: string): string {
	const templatePath = path.join(
		rootDir,
		'.foam',
		'templates',
		'daily-note.md',
	);

	try {
		if (!fs.existsSync(templatePath)) {
			return DEFAULT_JOURNAL_FOLDER;
		}

		const content = fs.readFileSync(templatePath, 'utf8');
		return parseFolderFromTemplate(content) ?? DEFAULT_JOURNAL_FOLDER;
	} catch {
		return DEFAULT_JOURNAL_FOLDER;
	}
}

/**
 * Find all journal markdown files
 */
export function findJournalFiles(rootDir: string): string[] {
	const journalFolder = inferJournalFolder(rootDir);
	const journalDir = path.join(rootDir, journalFolder);

	if (!fs.existsSync(journalDir)) {
		return [];
	}

	const files = fs.readdirSync(journalDir);
	return files
		.filter(file => DATE_REGEX.test(file))
		.map(file => path.join(journalDir, file))
		.sort();
}

/**
 * Extract the ## Habits section from a markdown file
 */
export function extractHabitsSection(content: string): string | undefined {
	const lines = content.split('\n');
	let inHabitsSection = false;
	const habitsLines: string[] = [];

	for (const line of lines) {
		// Check for ## Habits header (case-insensitive)
		if (/^##\s+habits?\s*$/i.test(line)) {
			inHabitsSection = true;
			continue;
		}

		// Stop at next section header
		if (inHabitsSection && /^##\s+/.test(line)) {
			break;
		}

		if (inHabitsSection) {
			habitsLines.push(line);
		}
	}

	return habitsLines.length > 0 ? habitsLines.join('\n') : undefined;
}

/**
 * Extract the ## Notes section from a markdown file
 */
export function extractNotesSection(content: string): string | undefined {
	const lines = content.split('\n');
	let inNotesSection = false;
	const notesLines: string[] = [];

	for (const line of lines) {
		// Check for ## Notes header (case-insensitive)
		if (/^##\s+notes?\s*$/i.test(line)) {
			inNotesSection = true;
			continue;
		}

		// Stop at next section header
		if (inNotesSection && /^##\s+/.test(line)) {
			break;
		}

		if (inNotesSection) {
			notesLines.push(line);
		}
	}

	return notesLines.length > 0 ? notesLines.join('\n') : undefined;
}

/**
 * Extract the intro section (between # Title and first ## section)
 */
export function extractIntroSection(content: string): string | undefined {
	const lines = content.split('\n');
	const introLines: string[] = [];
	let passedTitle = false;

	for (const line of lines) {
		// Skip until we pass the # Title
		if (!passedTitle && /^#\s+/.test(line)) {
			passedTitle = true;
			continue;
		}
		// Stop at first ## section
		if (passedTitle && /^##\s+/.test(line)) {
			break;
		}
		if (passedTitle) {
			introLines.push(line);
		}
	}

	return introLines.length > 0 ? introLines.join('\n') : undefined;
}

/**
 * Extract observation for a specific habit
 * Searches both intro area (after # Title) and ## Notes section
 * If found in both, merges with " | " separator
 */
export function extractObservation(
	content: string,
	habitName: string,
): string | undefined {
	const habitLower = habitName.toLowerCase();

	// Helper to find observation in a section
	const findInSection = (section: string | undefined): string | undefined => {
		if (!section) return undefined;
		for (const line of section.split('\n')) {
			const match = line.match(OBSERVATION_REGEX);
			if (match?.[1]?.trim().toLowerCase() === habitLower) {
				return match[2]?.trim();
			}
		}
		return undefined;
	};

	// Check both sections and merge
	const fromIntro = findInSection(extractIntroSection(content));
	const fromNotes = findInSection(extractNotesSection(content));

	if (fromIntro && fromNotes) {
		return `${fromIntro} | ${fromNotes}`;
	}
	return fromIntro ?? fromNotes;
}

/**
 * Parse habit entries from the ## Habits section
 */
export function parseHabitEntries(
	habitsSection: string,
	date: string,
	config: Config,
	filePath: string,
): {entries: HabitEntry[]; warnings: string[]} {
	const entries: HabitEntry[] = [];
	const warnings: string[] = [];
	const configHabitNames = new Set(
		Object.keys(config.habits).map(h => h.toLowerCase()),
	);

	const lines = habitsSection.split('\n');

	for (const line of lines) {
		// Match lines starting with "- " or "* " (list items), with optional checkbox
		const match = line.match(LIST_ITEM_REGEX);
		if (!match?.[2]) continue;

		const checkboxState = match[1]; // undefined, 'x', 'X', or ' '
		let rawEntry = match[2].trim();

		// Skip unchecked checkboxes (same as absent entry)
		if (checkboxState === ' ') {
			continue;
		}

		if (!rawEntry) {
			warnings.push(
				`⚠ Malformed entry in ${path.basename(filePath)}: "${line}"`,
			);
			continue;
		}

		// Strip leading emojis from the entry
		rawEntry = rawEntry.replace(LEADING_EMOJI_REGEX, '').trim();

		if (!rawEntry) {
			warnings.push(
				`⚠ Entry contains only emojis in ${path.basename(filePath)}: "${line}"`,
			);
			continue;
		}

		// Extract habit name (everything before ":" or the whole string)
		const colonIndex = rawEntry.indexOf(':');
		const habitName =
			colonIndex > 0 ? rawEntry.slice(0, colonIndex).trim() : rawEntry;
		const habitNameLower = habitName.toLowerCase();

		// Check if habit is in config
		if (!configHabitNames.has(habitNameLower)) {
			warnings.push(
				`⚠ Unknown habit "${habitName}" in ${path.basename(filePath)}`,
			);
			continue;
		}

		// Extract optional value
		const valueMatch = rawEntry.match(VALUE_REGEX);
		const value = valueMatch?.[1] ? parseFloat(valueMatch[1]) : undefined;

		entries.push({
			name: habitNameLower,
			value: value ?? 1, // Default to 1 for boolean habits
			date,
		});
	}

	return {entries, warnings};
}

/**
 * Parse a single journal file
 */
function parseJournalFile(
	filePath: string,
	config: Config,
): {entries: HabitEntry[]; warnings: string[]} {
	const filename = path.basename(filePath);
	const dateMatch = filename.match(DATE_REGEX);

	if (!dateMatch?.[1]) {
		return {entries: [], warnings: [`⚠ Invalid filename: ${filename}`]};
	}

	const date = dateMatch[1];
	const content = fs.readFileSync(filePath, 'utf8');
	const habitsSection = extractHabitsSection(content);

	if (!habitsSection) {
		return {entries: [], warnings: []};
	}

	return parseHabitEntries(habitsSection, date, config, filePath);
}

/**
 * Parse all journal files and extract habit entries
 */
export function parseJournals(rootDir: string, config: Config): ParseResult {
	const journalFolder = inferJournalFolder(rootDir);
	const files = findJournalFiles(rootDir);
	const allEntries: HabitEntry[] = [];
	const allWarnings: string[] = [];

	if (files.length === 0) {
		allWarnings.push(`⚠ No journal files found in ${journalFolder}/`);
	}

	for (const file of files) {
		const {entries, warnings} = parseJournalFile(file, config);
		allEntries.push(...entries);
		allWarnings.push(...warnings);
	}

	return {
		entries: allEntries,
		warnings: allWarnings,
	};
}

export type HistoryEntry = {
	date: string;
	value: number | undefined;
	observation: string | undefined;
};

/**
 * Load habit history with observations for a specific habit
 * Returns entries in reverse chronological order (newest first)
 */
export function loadHabitHistory(
	rootDir: string,
	habitName: string,
	config: Config,
): HistoryEntry[] {
	const files = findJournalFiles(rootDir);
	const entries: HistoryEntry[] = [];
	const habitLower = habitName.toLowerCase();

	for (const file of files) {
		const filename = path.basename(file);
		const dateMatch = filename.match(DATE_REGEX);
		if (!dateMatch?.[1]) continue;

		const date = dateMatch[1];
		const content = fs.readFileSync(file, 'utf8');

		// Get habit value from Habits section
		const habitsSection = extractHabitsSection(content);
		let value: number | undefined;

		if (habitsSection) {
			const {entries: habitEntries} = parseHabitEntries(
				habitsSection,
				date,
				config,
				file,
			);
			const entry = habitEntries.find(e => e.name === habitLower);
			value = entry?.value;
		}

		// Get observation from Notes section
		const observation = extractObservation(content, habitName);

		entries.push({date, value, observation});
	}

	// Sort by date descending (newest first)
	return entries.sort((a, b) => b.date.localeCompare(a.date));
}
