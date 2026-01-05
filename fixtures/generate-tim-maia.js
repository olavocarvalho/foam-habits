#!/usr/bin/env node
/**
 * Generates the Tim Maia test fixture
 *
 * Tim Maia (1942-1998) was a legendary Brazilian soul/funk musician
 * known for his talent and his bon vivant lifestyle.
 *
 * This fixture creates 34 days of journal entries from 1989-03-04
 * with habits that reflect his legendary lifestyle:
 * - Wake up after midday (boolean) - ~85% completion
 * - Smoke joints (goal: 4, threshold: 0.75) - varies 1-5
 * - Drink whiskey (goal: 1L) - 0.2-1.5L daily
 * - Skip rehearsal (boolean) - ~45% completion
 * - Call manager (boolean, start-date: 1989-03-20) - ~60% completion
 * - Gym (boolean, weekdays schedule) - ~70% completion
 *
 * New features demonstrated:
 * - Emoji prefixes in ~30% of entries (e.g., "💪 Wake up late")
 * - Checkbox format in ~20% of entries (e.g., "- [x] Gym")
 * - start-date config (Call manager starts mid-fixture)
 * - schedule config (Gym is weekdays only)
 * - Habit observations in Notes section (~40% of logged habits)
 *   Format: - **Habit:** observation text
 *
 * Usage:
 *   node fixtures/generate-tim-maia.js
 *
 * To regenerate with different random data, just run again.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, 'tim-maia');
const journalDir = path.join(baseDir, 'journal');
const foamDir = path.join(baseDir, '.foam');
const templatesDir = path.join(foamDir, 'templates');

// Create directories
fs.mkdirSync(journalDir, {recursive: true});
fs.mkdirSync(templatesDir, {recursive: true});

// Create habits.yaml with new features
const habitsYaml = `habits:
  Wake up late:
    emoji: "😴"

  Smoke joints:
    emoji: "🌿"
    goal: "4"
    threshold: 0.75

  Drink whiskey:
    emoji: "🥃"
    goal: "1L"

  Skip rehearsal:
    emoji: "🎤"

  Call manager:
    emoji: "📞"
    start-date: "1989-03-20"

  Gym:
    emoji: "🏋️"
    schedule: weekdays
`;

fs.writeFileSync(path.join(foamDir, 'habits.yaml'), habitsYaml);
console.log('Created: .foam/habits.yaml');

// Create daily-note template
const template = `---
foam_template:
  filepath: "/journal/\${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}.md"
  description: "Tim Maia's daily journal"
---
# \${FOAM_DATE_YEAR}-\${FOAM_DATE_MONTH}-\${FOAM_DATE_DATE}

## Habits

-

## Notes

`;

fs.writeFileSync(path.join(templatesDir, 'daily-note.md'), template);
console.log('Created: .foam/templates/daily-note.md');

// Fun notes for Tim Maia's journal
const funNotes = [
	'Recording session went late into the night. The band is sounding good.',
	'Had feijoada for lunch. Life is good.',
	'Visited Cassiano for a jam session.',
	'Working on new arrangements for the album.',
	'Canceled the TV appearance. Did not feel like it.',
	'The producer called again. Told him to wait.',
	'Writing new lyrics about love and pain.',
	'Spent the afternoon listening to soul records from America.',
	'Had a disagreement with the label. They do not understand art.',
	'Performed at the club tonight. The crowd loved it.',
	'Thinking about that girl from Tijuca.',
	'The band needs more rehearsal, but not today.',
	'',
	'',
	'',
];

// Habit observations for --history feature
const habitObservations = {
	'Wake up late': [
		'Slept until 2pm, feeling refreshed',
		'Dreams about the new album',
		'Neighbors complained again',
		'',
	],
	'Smoke joints': [
		'Good stuff from Bahia',
		'Shared with the band',
		'Inspired some new lyrics',
		'',
	],
	'Drink whiskey': [
		'Imported from Scotland',
		'Celebrating the new single',
		'Mixed with coconut water',
		'',
	],
	'Skip rehearsal': [
		'The band can handle it',
		'Had better things to do',
		'Will make it up tomorrow',
		'',
	],
	'Call manager': [
		'Discussed the tour dates',
		'Negotiating better contracts',
		'He wants more shows, I want more money',
		'',
	],
	'Gym': [
		'Leg day - felt strong',
		'Upper body workout',
		'Light cardio only',
		'New personal record on bench press',
		'',
	],
};

/**
 * Format entry with optional emoji prefix and checkbox format
 * @param {string} habitName - The habit name
 * @param {string} emoji - The emoji to optionally prefix
 * @param {string|number} value - Optional value for quantitative habits
 */
function formatEntry(habitName, emoji, value = null) {
	const useEmoji = Math.random() < 0.3; // 30% chance of emoji prefix
	const useCheckbox = Math.random() < 0.2; // 20% chance of checkbox format

	let entry = habitName;
	if (value !== null) {
		entry = `${habitName}: ${value}`;
	}

	if (useEmoji) {
		entry = `${emoji} ${entry}`;
	}

	if (useCheckbox) {
		return `- [x] ${entry}`;
	}
	return `- ${entry}`;
}

/**
 * Get day of week (0=Sun, 1=Mon, ..., 6=Sat)
 */
function getDayOfWeek(dateStr) {
	return new Date(dateStr).getDay();
}

/**
 * Check if date is a weekday (Mon-Fri)
 */
function isWeekday(dateStr) {
	const day = getDayOfWeek(dateStr);
	return day >= 1 && day <= 5;
}

/**
 * Get random observation for a habit (~40% chance)
 */
function getObservation(habitName) {
	if (Math.random() > 0.4) return null; // 60% chance of no observation
	const observations = habitObservations[habitName];
	if (!observations) return null;
	const obs = observations[Math.floor(Math.random() * observations.length)];
	return obs || null;
}

/**
 * Generate a single day's journal content
 */
function generateDay(date) {
	const habits = [];
	const observations = [];

	// Wake up late - ~85% of the time
	if (Math.random() < 0.85) {
		habits.push(formatEntry('Wake up late', '😴'));
		const obs = getObservation('Wake up late');
		if (obs) observations.push(`- **Wake up late:** ${obs}`);
	}

	// Smoke joints - varies from 0-6, usually 1-5
	const joints = Math.random() < 0.9 ? Math.floor(Math.random() * 5) + 1 : 0;
	if (joints > 0) {
		habits.push(formatEntry('Smoke joints', '🌿', joints));
		const obs = getObservation('Smoke joints');
		if (obs) observations.push(`- **Smoke joints:** ${obs}`);
	}

	// Drink whiskey - varies, sometimes heavy, sometimes light
	const whiskey =
		Math.random() < 0.85 ? (Math.random() * 1.3 + 0.2).toFixed(1) : 0;
	if (whiskey > 0) {
		habits.push(formatEntry('Drink whiskey', '🥃', `${whiskey}L`));
		const obs = getObservation('Drink whiskey');
		if (obs) observations.push(`- **Drink whiskey:** ${obs}`);
	}

	// Skip rehearsal - ~45% of days
	if (Math.random() < 0.45) {
		habits.push(formatEntry('Skip rehearsal', '🎤'));
		const obs = getObservation('Skip rehearsal');
		if (obs) observations.push(`- **Skip rehearsal:** ${obs}`);
	}

	// Call manager - ~60% of days, only after 1989-03-20 (start-date)
	if (date >= '1989-03-20' && Math.random() < 0.6) {
		habits.push(formatEntry('Call manager', '📞'));
		const obs = getObservation('Call manager');
		if (obs) observations.push(`- **Call manager:** ${obs}`);
	}

	// Gym - ~70% of weekdays only (schedule: weekdays)
	if (isWeekday(date) && Math.random() < 0.7) {
		habits.push(formatEntry('Gym', '🏋️'));
		const obs = getObservation('Gym');
		if (obs) observations.push(`- **Gym:** ${obs}`);
	}

	const note = funNotes[Math.floor(Math.random() * funNotes.length)];

	// Build notes section with observations first, then general note
	const notesContent = [...observations];
	if (note) {
		if (notesContent.length > 0) notesContent.push('');
		notesContent.push(note);
	}

	return `# ${date}

## Habits

${habits.join('\n')}

## Notes

${notesContent.join('\n')}
`;
}

// Generate 34 days from 1989-03-04
const startDate = new Date('1989-03-04');
const numDays = 34;

// Clear existing journal files
const existingFiles = fs.readdirSync(journalDir).filter(f => f.endsWith('.md'));
for (const file of existingFiles) {
	fs.unlinkSync(path.join(journalDir, file));
}

// Generate new journal files
for (let i = 0; i < numDays; i++) {
	const currentDate = new Date(startDate);
	currentDate.setDate(startDate.getDate() + i);

	const dateStr = currentDate.toISOString().split('T')[0];
	const content = generateDay(dateStr);

	const filePath = path.join(journalDir, `${dateStr}.md`);
	fs.writeFileSync(filePath, content);
	console.log(`Created: journal/${dateStr}.md`);
}

console.log(`\nGenerated ${numDays} journal entries for Tim Maia fixture!`);
console.log('\nTo test with this fixture:');
console.log('  cd fixtures/tim-maia');
console.log('  ../../dist/cli.js --reference-date 1989-04-06 --weeks 5');
console.log('\nTo test logging:');
console.log('  ../../dist/cli.js --log "Wake up late" --date 1989-04-07');
console.log('  ../../dist/cli.js --log "Drink whiskey: 0.5L" --date 1989-04-07');
