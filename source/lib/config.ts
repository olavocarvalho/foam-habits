import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {ConfigSchema, type Config} from './schemas.js';

export class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigError';
	}
}

export class ConfigNotFoundError extends ConfigError {
	constructor() {
		super('Config not found');
		this.name = 'ConfigNotFoundError';
	}
}

/**
 * Find the .foam/habits.yaml config file by searching up from cwd
 */
export function findConfigPath(
	startDir: string = process.cwd(),
): string | undefined {
	let currentDir = startDir;

	while (currentDir !== path.dirname(currentDir)) {
		const configPath = path.join(currentDir, '.foam', 'habits.yaml');
		if (fs.existsSync(configPath)) {
			return configPath;
		}
		currentDir = path.dirname(currentDir);
	}

	return undefined;
}

/**
 * Load and validate the habits.yaml config file
 */
export function loadConfig(configPath?: string): Config {
	const resolvedPath = configPath ?? findConfigPath();

	if (!resolvedPath) {
		throw new ConfigNotFoundError();
	}

	if (!fs.existsSync(resolvedPath)) {
		throw new ConfigError(`Config file not found: ${resolvedPath}`);
	}

	const raw = fs.readFileSync(resolvedPath, 'utf8');

	let parsed: unknown;
	try {
		parsed = yaml.load(raw);
	} catch (error) {
		throw new ConfigError(
			`Invalid YAML in ${resolvedPath}:\n${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	const result = ConfigSchema.safeParse(parsed);

	if (!result.success) {
		const errors = result.error.issues
			.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
			.join('\n');
		throw new ConfigError(`Invalid habits.yaml:\n${errors}`);
	}

	return result.data;
}

/**
 * Get the root directory (where .foam/ is located)
 */
export function getRootDir(configPath?: string): string {
	const resolvedPath = configPath ?? findConfigPath();
	if (!resolvedPath) {
		return process.cwd();
	}
	// .foam/habits.yaml -> go up two levels
	return path.dirname(path.dirname(resolvedPath));
}

const DEFAULT_CONFIG = `# Foam Habits Configuration
# See: https://github.com/olavocarvalho/foam-habits

habits:
  Exercise:
    emoji: 💪

  Drink water:
    emoji: 💧
    goal: 2L

  Read:
    emoji: 📖
    goal: 30min
    threshold: 0.8  # Consider done at 80% (24min)

  Meditate:
    emoji: 🧘
`;

/**
 * Create a default habits.yaml config file
 */
export function createDefaultConfig(rootDir: string = process.cwd()): string {
	const foamDir = path.join(rootDir, '.foam');
	const configPath = path.join(foamDir, 'habits.yaml');

	// Create .foam directory if it doesn't exist
	if (!fs.existsSync(foamDir)) {
		fs.mkdirSync(foamDir, {recursive: true});
	}

	fs.writeFileSync(configPath, DEFAULT_CONFIG, 'utf8');

	return configPath;
}
