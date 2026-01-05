import test from 'ava';
import {
	parseLogInput,
	findHabitInConfig,
	formatHabitEntry,
	findExistingEntry,
	updateHabitEntry,
	processTemplate,
	createDailyNote,
} from '../logger.js';
import type {Config} from '../schemas.js';

const mockConfig: Config = {
	habits: {
		Gym: {emoji: '💪', threshold: 1.0, schedule: 'daily'},
		'Drink water': {
			emoji: '💧',
			goal: '4L',
			threshold: 1.0,
			schedule: 'daily',
		},
		Study: {
			emoji: '📖',
			goal: '30min',
			threshold: 1.0,
			schedule: 'daily',
		},
		Meditation: {emoji: '🧘', threshold: 1.0, schedule: 'daily'},
	},
};

// parseLogInput tests
test('parseLogInput: parses boolean habit', t => {
	const result = parseLogInput('Gym');
	t.is(result.habitName, 'Gym');
	t.is(result.value, undefined);
	t.is(result.rawValue, undefined);
});

test('parseLogInput: parses quantitative habit with unit', t => {
	const result = parseLogInput('Drink water: 3.5L');
	t.is(result.habitName, 'Drink water');
	t.is(result.value, 3.5);
	t.is(result.rawValue, '3.5L');
});

test('parseLogInput: parses habit with integer value', t => {
	const result = parseLogInput('Study: 45min');
	t.is(result.habitName, 'Study');
	t.is(result.value, 45);
	t.is(result.rawValue, '45min');
});

test('parseLogInput: strips leading emoji', t => {
	const result = parseLogInput('💪 Gym');
	t.is(result.habitName, 'Gym');
	t.is(result.value, undefined);
});

test('parseLogInput: handles whitespace', t => {
	const result = parseLogInput('  Drink water :  2.5L  ');
	t.is(result.habitName, 'Drink water');
	t.is(result.value, 2.5);
});

test('parseLogInput: handles value with space before unit', t => {
	const result = parseLogInput('Study: 30 min');
	t.is(result.habitName, 'Study');
	t.is(result.value, 30);
	t.is(result.rawValue, '30 min');
});

test('parseLogInput: handles decimal value', t => {
	const result = parseLogInput('Drink water: 0.5L');
	t.is(result.habitName, 'Drink water');
	t.is(result.value, 0.5);
});

// findHabitInConfig tests
test('findHabitInConfig: finds habit exact match', t => {
	const result = findHabitInConfig('Gym', mockConfig);
	t.truthy(result);
	t.is(result?.key, 'Gym');
	t.is(result?.config.emoji, '💪');
});

test('findHabitInConfig: finds habit case-insensitive', t => {
	const result = findHabitInConfig('drink WATER', mockConfig);
	t.truthy(result);
	t.is(result?.key, 'Drink water');
	t.is(result?.config.goal, '4L');
});

test('findHabitInConfig: returns undefined for unknown habit', t => {
	const result = findHabitInConfig('Unknown', mockConfig);
	t.is(result, undefined);
});

// formatHabitEntry tests
test('formatHabitEntry: simple boolean', t => {
	t.is(formatHabitEntry('Gym', undefined, undefined, false), '- Gym');
});

test('formatHabitEntry: checkbox boolean', t => {
	t.is(formatHabitEntry('Gym', undefined, undefined, true), '- [x] Gym');
});

test('formatHabitEntry: quantitative with unit', t => {
	t.is(
		formatHabitEntry('Drink water', 3.5, 'L', false),
		'- Drink water: 3.5L',
	);
});

test('formatHabitEntry: checkbox with value', t => {
	t.is(
		formatHabitEntry('Drink water', 2, 'L', true),
		'- [x] Drink water: 2L',
	);
});

test('formatHabitEntry: value without unit', t => {
	t.is(formatHabitEntry('Study', 45, undefined, false), '- Study: 45');
});

// findExistingEntry tests
test('findExistingEntry: finds simple entry', t => {
	const section = '- Gym\n- Study: 30min';
	const result = findExistingEntry(section, 'gym');
	t.truthy(result);
	t.is(result?.lineIndex, 0);
	t.is(result?.value, undefined);
});

test('findExistingEntry: finds entry with value', t => {
	const section = '- Gym\n- Study: 30min';
	const result = findExistingEntry(section, 'study');
	t.truthy(result);
	t.is(result?.lineIndex, 1);
	t.is(result?.value, 30);
});

test('findExistingEntry: handles checkbox format', t => {
	const section = '- [x] Gym\n- Study';
	const result = findExistingEntry(section, 'gym');
	t.truthy(result);
	t.is(result?.lineIndex, 0);
});

test('findExistingEntry: returns undefined if not found', t => {
	const section = '- Gym';
	const result = findExistingEntry(section, 'meditation');
	t.is(result, undefined);
});

test('findExistingEntry: handles entry with emoji', t => {
	const section = '- 💪 Gym';
	const result = findExistingEntry(section, 'gym');
	t.truthy(result);
	t.is(result?.lineIndex, 0);
});

test('findExistingEntry: finds entry with value and unit', t => {
	const section = '- Drink water: 2.5L';
	const result = findExistingEntry(section, 'drink water');
	t.truthy(result);
	t.is(result?.value, 2.5);
});

// updateHabitEntry tests
test('updateHabitEntry: adds new entry to existing section', t => {
	const content = `# 2025-01-01

## Habits

- Gym

## Notes
`;
	const result = updateHabitEntry(
		content,
		'Meditation',
		undefined,
		undefined,
		false, // hasGoal
		false, // useCheckbox
	);

	t.is(result.action, 'added');
	t.true(result.content.includes('- Meditation'));
	t.true(result.content.includes('- Gym'));
});

test('updateHabitEntry: creates habits section if missing', t => {
	const content = `# 2025-01-01

## Notes

Some notes`;
	const result = updateHabitEntry(
		content,
		'Gym',
		undefined,
		undefined,
		false, // hasGoal
		false, // useCheckbox
	);

	t.is(result.action, 'added');
	t.true(result.content.includes('## Habits'));
	t.true(result.content.includes('- Gym'));
	// Habits section should be before Notes
	const habitsIndex = result.content.indexOf('## Habits');
	const notesIndex = result.content.indexOf('## Notes');
	t.true(habitsIndex < notesIndex);
});

test('updateHabitEntry: sums value for goal-oriented habit', t => {
	const content = `# 2025-01-01

## Habits

- Drink water: 2L

## Notes
`;
	const result = updateHabitEntry(
		content,
		'Drink water',
		1.5,
		'L',
		true, // hasGoal
		false, // useCheckbox
	);

	t.is(result.action, 'updated');
	t.is(result.previousValue, 2);
	t.is(result.newValue, 3.5);
	t.true(result.content.includes('- Drink water: 3.5L'));
	t.false(result.content.includes('- Drink water: 2L'));
});

test('updateHabitEntry: skips duplicate boolean habit', t => {
	const content = `# 2025-01-01

## Habits

- Gym

## Notes
`;
	const result = updateHabitEntry(
		content,
		'Gym',
		undefined,
		undefined,
		false, // hasGoal
		false, // useCheckbox
	);

	t.is(result.action, 'skipped');
	t.is(result.content, content); // Unchanged
});

test('updateHabitEntry: uses checkbox format when configured', t => {
	const content = `# 2025-01-01

## Habits


## Notes
`;
	const result = updateHabitEntry(
		content,
		'Gym',
		undefined,
		undefined,
		false, // hasGoal
		true, // useCheckbox (global config)
	);

	t.is(result.action, 'added');
	t.true(result.content.includes('- [x] Gym'));
});

test('updateHabitEntry: adds entry at end of habits section', t => {
	const content = `# 2025-01-01

## Habits

- Existing habit

## Notes

Some notes`;
	const result = updateHabitEntry(
		content,
		'Gym',
		undefined,
		undefined,
		false, // hasGoal
		false, // useCheckbox
	);

	t.is(result.action, 'added');
	// New entry should be after existing habit
	const existingIndex = result.content.indexOf('- Existing habit');
	const gymIndex = result.content.indexOf('- Gym');
	t.true(gymIndex > existingIndex);
	// But before Notes section
	const notesIndex = result.content.indexOf('## Notes');
	t.true(gymIndex < notesIndex);
});

// processTemplate tests
test('processTemplate: replaces FOAM variables', t => {
	const template = '# ${FOAM_DATE_YEAR}-${FOAM_DATE_MONTH}-${FOAM_DATE_DATE}';
	const result = processTemplate(template, '2025-01-15');
	t.is(result, '# 2025-01-15');
});

test('processTemplate: replaces FOAM_DATE shorthand', t => {
	const template = '# ${FOAM_DATE}';
	const result = processTemplate(template, '2025-01-15');
	t.is(result, '# 2025-01-15');
});

test('processTemplate: handles multiple replacements', t => {
	const template = `# \${FOAM_DATE}

Created: \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}`;
	const result = processTemplate(template, '2025-01-15');
	t.true(result.includes('# 2025-01-15'));
	t.true(result.includes('Created: 2025-01-15'));
});

// createDailyNote tests (without file system)
test('createDailyNote: creates default template when no file', t => {
	// This test uses a non-existent root dir, so it falls back to default template
	const result = createDailyNote('/nonexistent/path', '2025-01-15');
	t.true(result.includes('# 2025-01-15'));
	t.true(result.includes('## Habits'));
	t.true(result.includes('## Notes'));
});
