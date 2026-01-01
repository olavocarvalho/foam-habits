import test from 'ava';
import {
	extractHabitsSection,
	parseHabitEntries,
	parseFolderFromTemplate,
} from '../parser.js';
import type {Config} from '../schemas.js';

const mockConfig: Config = {
	habits: {
		Gym: {emoji: '💪', threshold: 1.0},
		'Drink water': {emoji: '💧', goal: '4L', threshold: 1.0},
		Study: {emoji: '📖', goal: '30min', threshold: 1.0},
		Meditation: {emoji: '🧘', threshold: 1.0},
	},
};

// extractHabitsSection tests
test('extractHabitsSection: extracts habits section', t => {
	const content = `# 2025-01-01

## Habits

- Gym
- Drink water: 3L

## Notes

Some notes here.`;

	const result = extractHabitsSection(content);
	t.truthy(result);
	t.true(result!.includes('- Gym'));
	t.true(result!.includes('- Drink water: 3L'));
	t.false(result!.includes('Some notes'));
});

test('extractHabitsSection: handles "Habit" singular', t => {
	const content = `## Habit

- Gym`;

	const result = extractHabitsSection(content);
	t.truthy(result);
	t.true(result!.includes('- Gym'));
});

test('extractHabitsSection: case insensitive header', t => {
	const content = `## HABITS

- Gym`;

	const result = extractHabitsSection(content);
	t.truthy(result);
	t.true(result!.includes('- Gym'));
});

test('extractHabitsSection: returns undefined when no habits section', t => {
	const content = `# 2025-01-01

## Notes

Some notes here.`;

	const result = extractHabitsSection(content);
	t.is(result, undefined);
});

test('extractHabitsSection: stops at next section', t => {
	const content = `## Habits

- Gym

## Other Section

- Something else`;

	const result = extractHabitsSection(content);
	t.truthy(result);
	t.true(result!.includes('- Gym'));
	t.false(result!.includes('Something else'));
});

// parseHabitEntries tests
test('parseHabitEntries: parses boolean habit', t => {
	const {entries, warnings} = parseHabitEntries(
		'- Gym',
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 1);
	t.is(entries[0]!.name, 'gym');
	t.is(entries[0]!.value, 1);
	t.is(entries[0]!.date, '2025-01-01');
	t.is(warnings.length, 0);
});

test('parseHabitEntries: parses habit with value', t => {
	const {entries, warnings} = parseHabitEntries(
		'- Drink water: 3.5L',
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 1);
	t.is(entries[0]!.name, 'drink water');
	t.is(entries[0]!.value, 3.5);
	t.is(warnings.length, 0);
});

test('parseHabitEntries: parses multiple habits', t => {
	const section = `- Gym
- Drink water: 4L
- Meditation`;

	const {entries, warnings} = parseHabitEntries(
		section,
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 3);
	t.is(entries[0]!.name, 'gym');
	t.is(entries[1]!.name, 'drink water');
	t.is(entries[1]!.value, 4);
	t.is(entries[2]!.name, 'meditation');
	t.is(warnings.length, 0);
});

test('parseHabitEntries: warns on unknown habit', t => {
	const {entries, warnings} = parseHabitEntries(
		'- Unknown habit',
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 0);
	t.is(warnings.length, 1);
	t.true(warnings[0]!.includes('Unknown habit'));
});

test('parseHabitEntries: case insensitive habit matching', t => {
	const {entries} = parseHabitEntries(
		'- GYM',
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 1);
	t.is(entries[0]!.name, 'gym');
});

test('parseHabitEntries: handles asterisk list marker', t => {
	const {entries} = parseHabitEntries(
		'* Gym',
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 1);
	t.is(entries[0]!.name, 'gym');
});

test('parseHabitEntries: ignores non-list lines', t => {
	const section = `Some text
- Gym
More text`;

	const {entries} = parseHabitEntries(
		section,
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries.length, 1);
});

test('parseHabitEntries: extracts integer value', t => {
	const {entries} = parseHabitEntries(
		'- Study: 45min',
		'2025-01-01',
		mockConfig,
		'2025-01-01.md',
	);

	t.is(entries[0]!.value, 45);
});

// parseFolderFromTemplate tests
test('parseFolderFromTemplate: extracts folder from standard template', t => {
	const content = `---
foam_template:
  filepath: "/journal/\${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}.md"
  description: "Daily note template"
---
# Content here`;

	t.is(parseFolderFromTemplate(content), 'journal');
});

test('parseFolderFromTemplate: extracts folder without leading slash', t => {
	const content = `---
foam_template:
  filepath: "notes/daily/\${FOAM_DATE}.md"
---`;

	t.is(parseFolderFromTemplate(content), 'notes/daily');
});

test('parseFolderFromTemplate: handles nested folders', t => {
	const content = `---
foam_template:
  filepath: "/notes/journal/daily/\${FOAM_DATE}.md"
---`;

	t.is(parseFolderFromTemplate(content), 'notes/journal/daily');
});

test('parseFolderFromTemplate: handles quoted filepath', t => {
	const content = `---
foam_template:
  filepath: '/diary/\${FOAM_DATE}.md'
---`;

	t.is(parseFolderFromTemplate(content), 'diary');
});

test('parseFolderFromTemplate: returns undefined for missing frontmatter', t => {
	const content = `# Just a regular markdown file
No frontmatter here`;

	t.is(parseFolderFromTemplate(content), undefined);
});

test('parseFolderFromTemplate: returns undefined for missing filepath', t => {
	const content = `---
foam_template:
  description: "No filepath here"
---`;

	t.is(parseFolderFromTemplate(content), undefined);
});

test('parseFolderFromTemplate: returns undefined for filename-only pattern', t => {
	const content = `---
foam_template:
  filepath: "\${FOAM_DATE}.md"
---`;

	t.is(parseFolderFromTemplate(content), undefined);
});
