# Changelog

## [1.7.0] - 2026-01-05

### Added
- **Configurable color palette**: Customize colors in `habits.yaml` config section
- **Legend component**: Footer legend showing symbol meanings in heatmap and history views
- `accent-light` color (#AAB1EF) for scheduled days and subtitles

### Changed
- Renamed `PALETTE.title` → `PALETTE.accent` throughout codebase
- Schedule days now use `accentLight` color instead of `accent`
- `theme.ts` now exports `PaletteColors` type and `setPalette()` function

## [1.6.2] - 2026-01-05

### Changed
- Aligned schedule display with habit name in history view
- Consolidated `SYMBOLS`, `LEVEL_COLORS`, `CompletionLevel` into `theme.ts`
- Renamed `palette.ts` → `theme.ts`

## [1.6.1] - 2026-01-05

### Added
- Support observations in intro area (between `# Title` and first `##` section)
- Support both `**Habit:**` and `**Habit**:` observation formats
- Merge observations from intro and `## Notes` with ` | ` separator
- `--reference-date` support for `--history` flag
- 5 new e2e tests for `--history` feature
- 2 new parser tests for intro section observations

### Changed
- History view shows blank for unscheduled days and before start-date
- Schedule display shows all 7 days with active days highlighted in purple
- Habit name capitalized in history title (e.g., "Gym" not "gym")
- Fixture generator now includes habit observations

## [1.6.0] - 2026-01-05

### Added
- `--history <habit>` / `-H` flag to view habit timeline with observations
- Habit observations in Notes section: `- **Habit:** observation text`
- History view shows schedule and start date (if configured)
- 9 new tests for observation parsing

## [1.5.0] - 2026-01-05

### Added
- Enhanced `--help` / `-h` with colorized output using chalk
- Config file reference in help showing sample `habits.yaml` structure
- Link to documentation in help output

### Changed
- `emoji` is now optional in habit config (default: `🔹` for alignment consistency)
- Habits can now be defined minimally as `HabitName: {}`

## [1.4.1] - 2026-01-05

### Changed
- Moved `checkbox` from per-habit option to global `config` section for consistency
- Added `config` section to habits.yaml for global settings (prepares for future options like colors)

## [1.4.0] - 2026-01-05

### Added
- `--log` / `-l` flag to log habits directly from CLI without opening daily notes
- `--date` / `-d` flag to specify date for logging (defaults to today)
- `checkbox` config option to use `- [x] Habit` format when logging via CLI
- Automatic value summing for quantitative habits (e.g., `0.5L + 0.3L = 0.8L`)
- Creates daily note from template if file doesn't exist
- Warning for unknown habits (logs anyway for flexibility)

## [1.3.0] - 2026-01-05

### Added
- Strip leading emojis from journal entries (`- 💪 Gym` now matches `Gym` in config)
- Markdown checkbox support (`- [x] Gym` = done, `- [ ] Gym` = skipped)
- `start-date` config option to define when a habit tracking begins (days before show as blank)
- `schedule` config option for weekly schedules: `daily`, `weekdays`, `weekends`, or custom days like `['mon', 'wed', 'fri']`

### Changed
- Tim Maia fixture now demonstrates all new features with 6 habits

## [1.1.1] - 2026-01-01

### Fixed
- Align month header with single-digit days (e.g., "Apr" now aligns with " 1")

## [1.1.0] - 2026-01-01

### Added
- `--reference-date` flag to view habit data from a specific date (useful for testing and historical views)
- End-to-end test suite with Tim Maia fixture (34 days of test data)

### Fixed
- Timezone bug in `--reference-date` parsing that caused off-by-one day errors
- Date header collision where "30" and "01" merged into "3001" (now shows "30 1")

### Changed
- Hide streak count when 0 days (cleaner UI)
- Increased habit name width from 12 to 18 characters
- Streak display no longer shows parentheses

## [1.0.4] - Previous release
