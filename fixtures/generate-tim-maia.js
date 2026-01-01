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
 *
 * Usage:
 *   node fixtures/generate-tim-maia.js
 *
 * To regenerate with different random data, just run again.
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'tim-maia');
const journalDir = path.join(baseDir, 'journal');
const foamDir = path.join(baseDir, '.foam');
const templatesDir = path.join(foamDir, 'templates');

// Create directories
fs.mkdirSync(journalDir, {recursive: true});
fs.mkdirSync(templatesDir, {recursive: true});

// Create habits.yaml
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

/**
 * Generate a single day's journal content
 */
function generateDay(date) {
	const habits = [];

	// Wake up late - ~85% of the time
	if (Math.random() < 0.85) {
		habits.push('- Wake up late');
	}

	// Smoke joints - varies from 0-6, usually 1-5
	const joints = Math.random() < 0.9 ? Math.floor(Math.random() * 5) + 1 : 0;
	if (joints > 0) {
		habits.push(`- Smoke joints: ${joints}`);
	}

	// Drink whiskey - varies, sometimes heavy, sometimes light
	const whiskey =
		Math.random() < 0.85 ? (Math.random() * 1.3 + 0.2).toFixed(1) : 0;
	if (whiskey > 0) {
		habits.push(`- Drink whiskey: ${whiskey}L`);
	}

	// Skip rehearsal - ~45% of days
	if (Math.random() < 0.45) {
		habits.push('- Skip rehearsal');
	}

	const note = funNotes[Math.floor(Math.random() * funNotes.length)];

	return `# ${date}

## Habits

${habits.join('\n')}

## Notes

${note}
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
