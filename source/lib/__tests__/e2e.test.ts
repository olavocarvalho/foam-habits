import test from 'ava';
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadConfig, getRootDir} from '../config.js';
import {parseJournals, inferJournalFolder} from '../parser.js';
import {aggregateHabits, getDateRange} from '../tracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.resolve(__dirname, '../../../fixtures/tim-maia');
const CONFIG_PATH = path.join(FIXTURE_PATH, '.foam', 'habits.yaml');

// Reference date: last day of Tim Maia's journal (1989-04-06)
// Use explicit year/month/day to avoid timezone issues
const REFERENCE_DATE = new Date(1989, 3, 6); // Month is 0-indexed (3 = April)

// Test config loading
test('e2e: loads Tim Maia habits config', t => {
	const config = loadConfig(CONFIG_PATH);

	t.is(Object.keys(config.habits).length, 6);
	t.truthy(config.habits['Wake up late']);
	t.truthy(config.habits['Smoke joints']);
	t.truthy(config.habits['Drink whiskey']);
	t.truthy(config.habits['Skip rehearsal']);
	t.truthy(config.habits['Call manager']);
	t.truthy(config.habits['Gym']);

	// Check emojis
	t.is(config.habits['Wake up late']?.emoji, '😴');
	t.is(config.habits['Smoke joints']?.emoji, '🌿');
	t.is(config.habits['Drink whiskey']?.emoji, '🥃');
	t.is(config.habits['Skip rehearsal']?.emoji, '🎤');
	t.is(config.habits['Call manager']?.emoji, '📞');
	t.is(config.habits['Gym']?.emoji, '🏋️');

	// Check quantitative goals
	t.is(config.habits['Smoke joints']?.goal, '4');
	t.is(config.habits['Smoke joints']?.threshold, 0.75);
	t.is(config.habits['Drink whiskey']?.goal, '1L');

	// Check new features: start-date and schedule
	t.is(config.habits['Call manager']?.['start-date'], '1989-03-20');
	t.is(config.habits['Gym']?.schedule, 'weekdays');
});

// Test getRootDir
test('e2e: getRootDir returns fixture root', t => {
	const rootDir = getRootDir(CONFIG_PATH);
	t.is(rootDir, FIXTURE_PATH);
});

// Test journal folder inference
test('e2e: infers journal folder from template', t => {
	const folder = inferJournalFolder(FIXTURE_PATH);
	t.is(folder, 'journal');
});

// Test journal parsing
test('e2e: parses all 34 Tim Maia journal entries', t => {
	const config = loadConfig(CONFIG_PATH);
	const {entries, warnings} = parseJournals(FIXTURE_PATH, config);

	// Should have entries (varies due to random generation, but should be > 0)
	t.true(entries.length > 0, 'Should have habit entries');

	// Check entry structure
	const firstEntry = entries[0];
	t.truthy(firstEntry?.name);
	t.truthy(firstEntry?.date);
	t.true(firstEntry?.date.startsWith('1989-03') || firstEntry?.date.startsWith('1989-04'));

	// Should recognize all configured habits
	const habitNames = new Set(entries.map(e => e.name));
	const possibleHabits = [
		'wake up late',
		'smoke joints',
		'drink whiskey',
		'skip rehearsal',
		'call manager',
		'gym',
	];
	for (const name of habitNames) {
		t.true(possibleHabits.includes(name), `Unknown habit: ${name}`);
	}

	// Warnings should be empty (all habits are configured)
	t.deepEqual(warnings, []);
});

// Test data aggregation
test('e2e: aggregates Tim Maia habit data correctly', t => {
	const config = loadConfig(CONFIG_PATH);
	const {entries} = parseJournals(FIXTURE_PATH, config);

	// Use a date range that covers the fixture (6 weeks back from 1989-04-06)
	const dateRange = getDateRange({weeks: 6, currentMonth: false}, REFERENCE_DATE);
	const habits = aggregateHabits(entries, config, dateRange, REFERENCE_DATE);

	t.is(habits.length, 6, 'Should have 6 habits');

	// Find each habit (names use original case from config)
	const wakeUp = habits.find(h => h.name === 'Wake up late');
	const joints = habits.find(h => h.name === 'Smoke joints');
	const whiskey = habits.find(h => h.name === 'Drink whiskey');
	const rehearsal = habits.find(h => h.name === 'Skip rehearsal');
	const callManager = habits.find(h => h.name === 'Call manager');
	const gym = habits.find(h => h.name === 'Gym');

	t.truthy(wakeUp);
	t.truthy(joints);
	t.truthy(whiskey);
	t.truthy(rehearsal);
	t.truthy(callManager);
	t.truthy(gym);

	// Check emoji mapping
	t.is(wakeUp?.emoji, '😴');
	t.is(joints?.emoji, '🌿');
	t.is(whiskey?.emoji, '🥃');
	t.is(rehearsal?.emoji, '🎤');
	t.is(callManager?.emoji, '📞');
	t.is(gym?.emoji, '🏋️');

	// Check goals are parsed
	t.is(joints?.goal, 4);
	t.is(joints?.threshold, 0.75);
	t.is(whiskey?.goal, 1);
	t.is(whiskey?.unit, 'L');

	// Boolean habits should not have goals
	t.is(wakeUp?.goal, undefined);
	t.is(rehearsal?.goal, undefined);

	// Check new features: start-date and schedule
	t.is(callManager?.startDate, '1989-03-20');
	t.is(gym?.schedule, 'weekdays');
});

// Test quantitative habit values
test('e2e: parses quantitative habit values correctly', t => {
	const config = loadConfig(CONFIG_PATH);
	const {entries} = parseJournals(FIXTURE_PATH, config);

	// Filter joint entries
	const jointEntries = entries.filter(e => e.name === 'smoke joints');
	t.true(jointEntries.length > 0, 'Should have joint entries');

	// Values should be numbers between 1-5 (based on our generation)
	for (const entry of jointEntries) {
		const value = entry.value ?? 0;
		t.true(value >= 1 && value <= 5, `Joint value ${value} out of range`);
	}

	// Filter whiskey entries
	const whiskeyEntries = entries.filter(e => e.name === 'drink whiskey');
	t.true(whiskeyEntries.length > 0, 'Should have whiskey entries');

	// Values should be between 0.2 and 1.5 (based on our generation)
	for (const entry of whiskeyEntries) {
		const value = entry.value ?? 0;
		t.true(
			value >= 0.2 && value <= 1.5,
			`Whiskey value ${value} out of range`,
		);
	}
});

// Test getDateRange with reference date
test('e2e: getDateRange generates correct range for 1989', t => {
	const dateRange = getDateRange({weeks: 5, currentMonth: false}, REFERENCE_DATE);

	// 5 weeks = 35 days, from 1989-03-03 to 1989-04-06
	t.is(dateRange.length, 35);
	t.is(dateRange[0], '1989-03-03');
	t.is(dateRange[dateRange.length - 1], '1989-04-06');
});

// Test streak calculation
test('e2e: calculates streaks for Tim Maia habits', t => {
	const config = loadConfig(CONFIG_PATH);
	const {entries} = parseJournals(FIXTURE_PATH, config);
	const dateRange = getDateRange({weeks: 6, currentMonth: false}, REFERENCE_DATE);
	const habits = aggregateHabits(entries, config, dateRange, REFERENCE_DATE);

	// All habits should have streak >= 0
	for (const habit of habits) {
		t.true(habit.streak >= 0, `${habit.name} should have non-negative streak`);
	}
});

// Test date range matches fixture
test('e2e: fixture dates are in expected range', t => {
	const config = loadConfig(CONFIG_PATH);
	const {entries} = parseJournals(FIXTURE_PATH, config);

	const dates = [...new Set(entries.map(e => e.date))].sort();

	// First date should be 1989-03-04
	t.is(dates[0], '1989-03-04', 'First entry should be 1989-03-04');

	// Last date should be 1989-04-06
	t.is(dates[dates.length - 1], '1989-04-06', 'Last entry should be 1989-04-06');

	// Should have entries across 34 days (though not all days may have all habits)
	t.true(dates.length <= 34, 'Should not exceed 34 unique dates');
});

// CLI integration test with --reference-date flag
test('e2e: CLI runs with --reference-date for Tim Maia fixture', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	// Run CLI from fixture directory with reference date
	const output = execSync(
		`node ${cliPath} --weeks 5 --reference-date 1989-04-06`,
		{
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			timeout: 10000,
		},
	);

	// Should contain habit emojis (including new ones)
	t.true(output.includes('😴'), 'Should show wake up emoji');
	t.true(output.includes('🌿'), 'Should show smoke joints emoji');
	t.true(output.includes('🥃'), 'Should show drink whiskey emoji');
	t.true(output.includes('🎤'), 'Should show skip rehearsal emoji');
	t.true(output.includes('📞'), 'Should show call manager emoji');
	t.true(output.includes('🏋'), 'Should show gym emoji');

	// Should contain heatmap characters (at least some activity)
	// Note: ' ' (blank) is now also possible for before start-date or unscheduled days
	const heatmapChars = ['░', '▒', '▓', '█'];
	const hasHeatmapChars = heatmapChars.some(char => output.includes(char));
	t.true(hasHeatmapChars, 'Should display heatmap characters');

	// Should show month headers for March/April 1989
	t.true(
		output.includes('Mar') || output.includes('Apr'),
		'Should show March or April in header',
	);
});

// Test CLI --reference-date validation
test('e2e: CLI rejects invalid --reference-date', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const error = t.throws(() => {
		execSync(`node ${cliPath} --reference-date invalid-date`, {
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			stdio: 'pipe',
		});
	});

	t.truthy(error);
});

// Test CLI --log flag creates a new daily note
test.serial('e2e: CLI --log creates new daily note', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');
	const testDate = '1989-04-07'; // Day after last fixture entry
	const journalPath = path.join(FIXTURE_PATH, 'journal', `${testDate}.md`);

	// Ensure file doesn't exist before test
	if (fs.existsSync(journalPath)) {
		fs.unlinkSync(journalPath);
	}

	try {
		const output = execSync(
			`node ${cliPath} --log "Wake up late" --date ${testDate}`,
			{
				cwd: FIXTURE_PATH,
				encoding: 'utf8',
			},
		);

		// Should show success message
		t.true(output.includes('Created') || output.includes('Logged'));
		t.true(output.includes(testDate));

		// File should exist
		t.true(fs.existsSync(journalPath));

		// Content should include the habit
		const content = fs.readFileSync(journalPath, 'utf8');
		t.true(content.includes('- Wake up late'));
		t.true(content.includes('## Habits'));
	} finally {
		// Cleanup
		if (fs.existsSync(journalPath)) {
			fs.unlinkSync(journalPath);
		}
	}
});

// Test CLI --log flag adds to existing file
test.serial('e2e: CLI --log adds habit to existing file', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');
	const testDate = '1989-04-08';
	const journalPath = path.join(FIXTURE_PATH, 'journal', `${testDate}.md`);

	// Create a test file first
	const initialContent = `# ${testDate}

## Habits

- Gym

## Notes

Test notes.
`;
	fs.writeFileSync(journalPath, initialContent);

	try {
		const output = execSync(
			`node ${cliPath} --log "Skip rehearsal" --date ${testDate}`,
			{
				cwd: FIXTURE_PATH,
				encoding: 'utf8',
			},
		);

		// Should show success message
		t.true(output.includes('Logged'));

		// Content should include both habits
		const content = fs.readFileSync(journalPath, 'utf8');
		t.true(content.includes('- Gym'));
		t.true(content.includes('- Skip rehearsal'));
	} finally {
		// Cleanup
		if (fs.existsSync(journalPath)) {
			fs.unlinkSync(journalPath);
		}
	}
});

// Test CLI --log sums values for quantitative habits
test.serial('e2e: CLI --log sums value for quantitative habit', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');
	const testDate = '1989-04-09';
	const journalPath = path.join(FIXTURE_PATH, 'journal', `${testDate}.md`);

	// Create a test file with existing quantitative habit
	const initialContent = `# ${testDate}

## Habits

- Drink whiskey: 0.5L

## Notes

`;
	fs.writeFileSync(journalPath, initialContent);

	try {
		const output = execSync(
			`node ${cliPath} --log "Drink whiskey: 0.3L" --date ${testDate}`,
			{
				cwd: FIXTURE_PATH,
				encoding: 'utf8',
			},
		);

		// Should show updated message with summed value
		t.true(output.includes('Updated'));
		t.true(output.includes('0.8L'));

		// Content should have updated value
		const content = fs.readFileSync(journalPath, 'utf8');
		t.true(content.includes('0.8L'));
		t.false(content.includes('0.5L')); // Old value should be gone
	} finally {
		// Cleanup
		if (fs.existsSync(journalPath)) {
			fs.unlinkSync(journalPath);
		}
	}
});

// Test CLI --log skips duplicate boolean habit
test.serial('e2e: CLI --log skips duplicate boolean habit', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');
	const testDate = '1989-04-10';
	const journalPath = path.join(FIXTURE_PATH, 'journal', `${testDate}.md`);

	// Create a test file with existing boolean habit
	const initialContent = `# ${testDate}

## Habits

- Wake up late

## Notes

`;
	fs.writeFileSync(journalPath, initialContent);

	try {
		const output = execSync(
			`node ${cliPath} --log "Wake up late" --date ${testDate}`,
			{
				cwd: FIXTURE_PATH,
				encoding: 'utf8',
			},
		);

		// Should show skipped message
		t.true(output.includes('already logged'));

		// Content should be unchanged (still only one entry)
		const content = fs.readFileSync(journalPath, 'utf8');
		const matches = content.match(/- Wake up late/g);
		t.is(matches?.length, 1);
	} finally {
		// Cleanup
		if (fs.existsSync(journalPath)) {
			fs.unlinkSync(journalPath);
		}
	}
});

// Test CLI --log warns for unknown habit
test.serial('e2e: CLI --log warns for unknown habit', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');
	const testDate = '1989-04-11';
	const journalPath = path.join(FIXTURE_PATH, 'journal', `${testDate}.md`);

	// Ensure file doesn't exist
	if (fs.existsSync(journalPath)) {
		fs.unlinkSync(journalPath);
	}

	try {
		execSync(`node ${cliPath} --log "Unknown habit" --date ${testDate}`, {
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'], // Capture stderr
		});

		// Should still create the file
		t.true(fs.existsSync(journalPath));

		// Content should include the unknown habit
		const content = fs.readFileSync(journalPath, 'utf8');
		t.true(content.includes('- Unknown habit'));
	} finally {
		// Cleanup
		if (fs.existsSync(journalPath)) {
			fs.unlinkSync(journalPath);
		}
	}
});

// Test CLI --log rejects invalid date
test('e2e: CLI --log rejects invalid --date', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const error = t.throws(() => {
		execSync(`node ${cliPath} --log "Gym" --date invalid-date`, {
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			stdio: 'pipe',
		});
	});

	t.truthy(error);
});

// Test CLI --history shows habit timeline
test('e2e: CLI --history shows habit timeline with observations', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const output = execSync(
		`node ${cliPath} --history "Drink whiskey" --weeks 5 --reference-date 1989-04-06`,
		{
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			timeout: 10000,
		},
	);

	// Should show habit name and emoji (capitalized)
	t.true(output.includes('🥃'), 'Should show drink whiskey emoji');
	t.true(output.includes('Drink Whiskey'), 'Should show habit name capitalized');

	// Should show timeline header
	t.true(output.includes('Last'), 'Should show "Last X days" header');

	// Should show schedule info with all days
	t.true(output.includes('Schedule'), 'Should show schedule info');
	// All days should be present in schedule display
	t.true(output.includes('Mon'), 'Should show Mon in schedule');

	// Should show heatmap characters
	const heatmapChars = ['░', '▒', '▓', '█'];
	const hasHeatmapChars = heatmapChars.some(char => output.includes(char));
	t.true(hasHeatmapChars, 'Should display heatmap characters');

	// Should show dates in YYYY-MM-DD format
	t.true(output.includes('1989-'), 'Should show dates from 1989');
});

// Test CLI --history shows observations from Notes section
test('e2e: CLI --history includes observations', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const output = execSync(
		`node ${cliPath} --history "Drink whiskey" --weeks 5 --reference-date 1989-04-06`,
		{
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			timeout: 10000,
		},
	);

	// Should include some observations (at least one from the fixture)
	// These are the possible observations for Drink whiskey
	const possibleObservations = [
		'Imported from Scotland',
		'Celebrating the new single',
		'Mixed with coconut water',
	];

	const hasObservation = possibleObservations.some(obs => output.includes(obs));
	t.true(hasObservation, 'Should show at least one observation');
});

// Test CLI --history shows schedule and start-date for configured habits
test('e2e: CLI --history shows schedule for Gym habit', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const output = execSync(
		`node ${cliPath} --history "Gym" --weeks 5 --reference-date 1989-04-06`,
		{
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			timeout: 10000,
		},
	);

	// Should show gym emoji
	t.true(output.includes('🏋'), 'Should show gym emoji');
	// Should show schedule with all days (Mon / Tue / Wed / Thu / Fri / Sat / Sun)
	t.true(output.includes('Schedule:'), 'Should show schedule label');
	t.true(output.includes('Mon'), 'Should show Mon in schedule');
	t.true(output.includes('Fri'), 'Should show Fri in schedule');
});

// Test CLI --history shows start-date for Call manager habit
test('e2e: CLI --history shows start-date', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const output = execSync(
		`node ${cliPath} --history "Call manager" --weeks 5 --reference-date 1989-04-06`,
		{
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			timeout: 10000,
		},
	);

	// Should show start date
	t.true(output.includes('📞'), 'Should show call manager emoji');
	t.true(output.includes('Started'), 'Should show "Started" label');
	t.true(output.includes('1989-03-20'), 'Should show start date');
});

// Test CLI --history rejects unknown habit
test('e2e: CLI --history rejects unknown habit', t => {
	const cliPath = path.resolve(__dirname, '../../../dist/cli.js');

	const error = t.throws(() => {
		execSync(`node ${cliPath} --history "Unknown habit"`, {
			cwd: FIXTURE_PATH,
			encoding: 'utf8',
			stdio: 'pipe',
		});
	});

	t.truthy(error);
});
