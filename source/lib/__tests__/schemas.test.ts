import test from 'ava';
import {parseGoal} from '../schemas.js';

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
