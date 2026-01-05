# Changelog

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
