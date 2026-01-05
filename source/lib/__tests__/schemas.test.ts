import test from 'ava';
import {parseGoal, HabitConfigSchema, ScheduleSchema} from '../schemas.js';

// parseGoal - basic cases
test('parseGoal: parses integer with unit', t => {
	const result = parseGoal('4L');
	t.is(result.value, 4);
	t.is(result.unit, 'L');
});

test('parseGoal: parses decimal with unit', t => {
	const result = parseGoal('2.5km');
	t.is(result.value, 2.5);
	t.is(result.unit, 'km');
});

test('parseGoal: parses value with multi-char unit', t => {
	const result = parseGoal('30min');
	t.is(result.value, 30);
	t.is(result.unit, 'min');
});

test('parseGoal: parses value with space before unit', t => {
	const result = parseGoal('4 L');
	t.is(result.value, 4);
	t.is(result.unit, 'L');
});

test('parseGoal: parses value without unit', t => {
	const result = parseGoal('10');
	t.is(result.value, 10);
	t.is(result.unit, undefined);
});

test('parseGoal: parses decimal without unit', t => {
	const result = parseGoal('2.5');
	t.is(result.value, 2.5);
	t.is(result.unit, undefined);
});

// parseGoal - edge cases
test('parseGoal: handles leading zeros', t => {
	const result = parseGoal('08hours');
	t.is(result.value, 8);
	t.is(result.unit, 'hours');
});

test('parseGoal: throws on invalid format (no number)', t => {
	t.throws(() => parseGoal('abc'), {
		message: /Invalid goal format/,
	});
});

test('parseGoal: throws on empty string', t => {
	t.throws(() => parseGoal(''), {
		message: /Invalid goal format/,
	});
});

// HabitConfigSchema - start-date validation
test('HabitConfigSchema: accepts valid start-date', t => {
	const result = HabitConfigSchema.safeParse({
		emoji: '💪',
		'start-date': '2025-01-15',
	});
	t.true(result.success);
	if (result.success) {
		t.is(result.data['start-date'], '2025-01-15');
	}
});

test('HabitConfigSchema: accepts habit without start-date', t => {
	const result = HabitConfigSchema.safeParse({
		emoji: '💪',
	});
	t.true(result.success);
	if (result.success) {
		t.is(result.data['start-date'], undefined);
	}
});

test('HabitConfigSchema: rejects invalid start-date format', t => {
	const result = HabitConfigSchema.safeParse({
		emoji: '💪',
		'start-date': '01-15-2025', // Wrong format
	});
	t.false(result.success);
});

test('HabitConfigSchema: rejects invalid start-date (not a date)', t => {
	const result = HabitConfigSchema.safeParse({
		emoji: '💪',
		'start-date': 'not-a-date',
	});
	t.false(result.success);
});

// ScheduleSchema tests
test('ScheduleSchema: accepts daily', t => {
	const result = ScheduleSchema.safeParse('daily');
	t.true(result.success);
	if (result.success) {
		t.is(result.data, 'daily');
	}
});

test('ScheduleSchema: accepts weekdays', t => {
	const result = ScheduleSchema.safeParse('weekdays');
	t.true(result.success);
	if (result.success) {
		t.is(result.data, 'weekdays');
	}
});

test('ScheduleSchema: accepts weekends', t => {
	const result = ScheduleSchema.safeParse('weekends');
	t.true(result.success);
	if (result.success) {
		t.is(result.data, 'weekends');
	}
});

test('ScheduleSchema: accepts day array', t => {
	const result = ScheduleSchema.safeParse(['mon', 'wed', 'fri']);
	t.true(result.success);
	if (result.success) {
		t.deepEqual(result.data, ['mon', 'wed', 'fri']);
	}
});

test('ScheduleSchema: defaults to daily', t => {
	const result = ScheduleSchema.safeParse(undefined);
	t.true(result.success);
	if (result.success) {
		t.is(result.data, 'daily');
	}
});

test('ScheduleSchema: rejects invalid day name', t => {
	const result = ScheduleSchema.safeParse(['monday']); // Should be 'mon'
	t.false(result.success);
});

test('ScheduleSchema: rejects invalid schedule string', t => {
	const result = ScheduleSchema.safeParse('monthly');
	t.false(result.success);
});
