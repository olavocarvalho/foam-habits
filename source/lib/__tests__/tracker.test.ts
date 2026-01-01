import test from 'ava';
import {getCompletionLevel} from '../tracker.js';

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
