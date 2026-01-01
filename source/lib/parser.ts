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
		// Match lines starting with "- " (list items)
		const match = line.match(/^[-*]\s+(.+)$/);
		if (!match?.[1]) continue;

		const rawEntry = match[1].trim();
		if (!rawEntry) {
			warnings.push(
				`⚠ Malformed entry in ${path.basename(filePath)}: "${line}"`,
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
