import test from 'ava';
import {getCompletionLevel, isScheduledForDate} from '../tracker.js';

// getCompletionLevel - boolean habits (no goal)
test('getCompletionLevel: undefined value returns 0 (not done)', t => {
	t.is(getCompletionLevel(undefined, undefined), 0);
});

test('getCompletionLevel: any value without goal returns 3 (complete)', t => {
	t.is(getCompletionLevel(1, undefined), 3);
	t.is(getCompletionLevel(0.5, undefined), 3);
	t.is(getCompletionLevel(100, undefined), 3);
});

// getCompletionLevel - quantitative habits with default threshold (1.0)
test('getCompletionLevel: meeting goal exactly returns 3', t => {
	t.is(getCompletionLevel(4, 4), 3);
});

test('getCompletionLevel: exceeding goal returns 3', t => {
	t.is(getCompletionLevel(5, 4), 3);
});

test('getCompletionLevel: 0 value with goal returns 0', t => {
	t.is(getCompletionLevel(0, 4), 0);
});

test('getCompletionLevel: low progress returns 1 (red)', t => {
	// With goal=4, threshold=1.0, partialThreshold = 0.625
	// 1/4 = 0.25 < 0.625 -> level 1
	t.is(getCompletionLevel(1, 4), 1);
});

test('getCompletionLevel: partial progress returns 2 (yellow)', t => {
	// With goal=4, threshold=1.0, partialThreshold = 0.625
	// 3/4 = 0.75 >= 0.625 but < 1.0 -> level 2
	t.is(getCompletionLevel(3, 4), 2);
});

// getCompletionLevel - with custom threshold
test('getCompletionLevel: custom threshold 0.8 - 80% is complete', t => {
	// 3.2/4 = 0.8 >= threshold 0.8 -> complete
	t.is(getCompletionLevel(3.2, 4, 0.8), 3);
});

test('getCompletionLevel: custom threshold 0.8 - 79% is partial', t => {
	// 3.1/4 = 0.775 < threshold 0.8 but >= partialThreshold (0.8 * 0.625 = 0.5)
	t.is(getCompletionLevel(3.1, 4, 0.8), 2);
});

test('getCompletionLevel: custom threshold 0.5 - 50% is complete', t => {
	t.is(getCompletionLevel(2, 4, 0.5), 3);
});

test('getCompletionLevel: custom threshold 0.5 - 25% is low', t => {
	// 1/4 = 0.25 < partialThreshold (0.5 * 0.625 = 0.3125) -> level 1
	t.is(getCompletionLevel(1, 4, 0.5), 1);
});

// Edge cases
test('getCompletionLevel: very small value is low (not zero)', t => {
	t.is(getCompletionLevel(0.001, 4), 1);
});

test('getCompletionLevel: undefined value with goal returns 0', t => {
	t.is(getCompletionLevel(undefined, 4), 0);
});

// Start date tests (null value = before start date)
test('getCompletionLevel: null value returns null (before start date)', t => {
	t.is(getCompletionLevel(null, undefined), null);
	t.is(getCompletionLevel(null, 4), null);
	t.is(getCompletionLevel(null, 4, 0.8), null);
});

// isScheduledForDate - daily schedule
test('isScheduledForDate: daily returns true for all days', t => {
	// 2025-01-06 is Monday, 2025-01-11 is Saturday, 2025-01-12 is Sunday
	t.true(isScheduledForDate('2025-01-06', 'daily')); // Monday
	t.true(isScheduledForDate('2025-01-07', 'daily')); // Tuesday
	t.true(isScheduledForDate('2025-01-08', 'daily')); // Wednesday
	t.true(isScheduledForDate('2025-01-09', 'daily')); // Thursday
	t.true(isScheduledForDate('2025-01-10', 'daily')); // Friday
	t.true(isScheduledForDate('2025-01-11', 'daily')); // Saturday
	t.true(isScheduledForDate('2025-01-12', 'daily')); // Sunday
});

// isScheduledForDate - weekdays schedule
test('isScheduledForDate: weekdays returns true Mon-Fri only', t => {
	t.true(isScheduledForDate('2025-01-06', 'weekdays')); // Monday
	t.true(isScheduledForDate('2025-01-07', 'weekdays')); // Tuesday
	t.true(isScheduledForDate('2025-01-08', 'weekdays')); // Wednesday
	t.true(isScheduledForDate('2025-01-09', 'weekdays')); // Thursday
	t.true(isScheduledForDate('2025-01-10', 'weekdays')); // Friday
	t.false(isScheduledForDate('2025-01-11', 'weekdays')); // Saturday
	t.false(isScheduledForDate('2025-01-12', 'weekdays')); // Sunday
});

// isScheduledForDate - weekends schedule
test('isScheduledForDate: weekends returns true Sat-Sun only', t => {
	t.false(isScheduledForDate('2025-01-06', 'weekends')); // Monday
	t.false(isScheduledForDate('2025-01-07', 'weekends')); // Tuesday
	t.false(isScheduledForDate('2025-01-08', 'weekends')); // Wednesday
	t.false(isScheduledForDate('2025-01-09', 'weekends')); // Thursday
	t.false(isScheduledForDate('2025-01-10', 'weekends')); // Friday
	t.true(isScheduledForDate('2025-01-11', 'weekends')); // Saturday
	t.true(isScheduledForDate('2025-01-12', 'weekends')); // Sunday
});

// isScheduledForDate - custom array schedule
test('isScheduledForDate: custom array works correctly', t => {
	const schedule = ['mon', 'wed', 'fri'] as const;
	t.true(isScheduledForDate('2025-01-06', [...schedule])); // Monday
	t.false(isScheduledForDate('2025-01-07', [...schedule])); // Tuesday
	t.true(isScheduledForDate('2025-01-08', [...schedule])); // Wednesday
	t.false(isScheduledForDate('2025-01-09', [...schedule])); // Thursday
	t.true(isScheduledForDate('2025-01-10', [...schedule])); // Friday
	t.false(isScheduledForDate('2025-01-11', [...schedule])); // Saturday
	t.false(isScheduledForDate('2025-01-12', [...schedule])); // Sunday
});
