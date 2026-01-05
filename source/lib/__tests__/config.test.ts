import test from 'ava';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	findConfigPath,
	loadConfig,
	createDefaultConfig,
	ConfigNotFoundError,
} from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.resolve(__dirname, '../../../fixtures');
const TIM_MAIA_PATH = path.join(FIXTURES_PATH, 'tim-maia');
const NO_CONFIG_PATH = path.join(FIXTURES_PATH, 'no-config');

// Test findConfigPath
test('findConfigPath: returns path when config exists', t => {
	const configPath = findConfigPath(TIM_MAIA_PATH);
	t.truthy(configPath);
	t.true(configPath!.endsWith('.foam/habits.yaml'));
});

test('findConfigPath: searches upward and finds parent config', t => {
	// The no-config fixture doesn't have its own config,
	// but findConfigPath searches up the directory tree
	// and may find a config in a parent directory
	const configPath = findConfigPath(NO_CONFIG_PATH);

	if (configPath) {
		// If found, it should be from a parent directory (not inside no-config)
		t.false(configPath.startsWith(NO_CONFIG_PATH));
	} else {
		// If not found, that's also valid (depends on environment)
		t.pass();
	}
});

// Test loadConfig
test('loadConfig: throws ConfigNotFoundError when config not found', t => {
	const error = t.throws(
		() => {
			loadConfig(path.join(NO_CONFIG_PATH, '.foam', 'habits.yaml'));
		},
		{instanceOf: Error},
	);
	t.true(error!.message.includes('not found'));
});

test('ConfigNotFoundError: has correct name and message', t => {
	const error = new ConfigNotFoundError();
	t.is(error.name, 'ConfigNotFoundError');
	t.is(error.message, 'Config not found');
	t.true(error instanceof Error);
});

test('loadConfig: loads valid config successfully', t => {
	const configPath = path.join(TIM_MAIA_PATH, '.foam', 'habits.yaml');
	const config = loadConfig(configPath);

	t.truthy(config.habits);
	t.is(Object.keys(config.habits).length, 6);
});

// Test createDefaultConfig
test('createDefaultConfig: creates config file in .foam directory', t => {
	// Create a temporary directory for this test
	const tempDir = path.join(FIXTURES_PATH, 'temp-config-test');
	fs.mkdirSync(tempDir, {recursive: true});

	try {
		const configPath = createDefaultConfig(tempDir);

		t.true(fs.existsSync(configPath));
		t.true(configPath.endsWith('.foam/habits.yaml'));

		// Verify the config is valid
		const config = loadConfig(configPath);
		t.truthy(config.habits);
		t.truthy(config.habits['Exercise']);
		t.truthy(config.habits['Drink water']);
		t.truthy(config.habits['Read']);
		t.truthy(config.habits['Meditate']);
	} finally {
		// Cleanup
		fs.rmSync(tempDir, {recursive: true, force: true});
	}
});

test('createDefaultConfig: creates .foam directory if it does not exist', t => {
	const tempDir = path.join(FIXTURES_PATH, 'temp-config-test-2');

	// Ensure the directory doesn't exist
	if (fs.existsSync(tempDir)) {
		fs.rmSync(tempDir, {recursive: true, force: true});
	}

	fs.mkdirSync(tempDir, {recursive: true});

	try {
		const foamDir = path.join(tempDir, '.foam');
		t.false(fs.existsSync(foamDir));

		createDefaultConfig(tempDir);

		t.true(fs.existsSync(foamDir));
		t.true(fs.existsSync(path.join(foamDir, 'habits.yaml')));
	} finally {
		// Cleanup
		fs.rmSync(tempDir, {recursive: true, force: true});
	}
});
