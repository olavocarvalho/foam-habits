# foam-habits Architecture Guide

A terminal habit tracker for [Foam](https://foambubble.github.io/foam/) daily notes that displays a GitHub-style heatmap.

## Overview

foam-habits parses habit entries from Foam daily notes (`journal/*.md`) and displays completion status as a terminal heatmap with streaks.

```
Foam Habits / Last 28 Days

               Dec                      Jan
Habit          05    12    19    25     01

💪 Gym         ░░░░░█░░░░░░░░░░░░░░░░░░░░░█ (1 day)
💧 Drink water ░░░░░░░░░░░░░░░░░░░░░░░░░░░▓ (0 days)
📖 Study       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (0 days)
🧘 Meditation  ░░░░░░░░░░░░░░░░░░░░░░░░░░░█ (1 day)
```

## Architecture

```
foam-habits/
├── source/
│   ├── app.tsx              # Main Ink app with loading state
│   ├── cli.tsx              # CLI entry point (meow args parser)
│   │
│   ├── components/
│   │   ├── Cell.tsx         # Single heatmap cell (░▒▓█)
│   │   ├── HabitRow.tsx     # Habit row: emoji + name + cells + streak
│   │   ├── Header.tsx       # Title + date column headers
│   │   ├── Heatmap.tsx      # Main grid container
│   │   └── Warnings.tsx     # Static warnings display
│   │
│   ├── hooks/
│   │   └── useHabitData.ts  # React hook for data loading
│   │
│   └── lib/
│       ├── schemas.ts       # Zod schemas + types
│       ├── config.ts        # Load habits.yaml
│       ├── parser.ts        # Parse journal markdown files
│       ├── tracker.ts       # Aggregate data, calculate streaks
│       ├── theme.ts         # Theme: colors, symbols, completion levels
│       └── string-utils.ts  # Visual string width utilities
│
├── dist/                    # Compiled JavaScript (npm publish)
└── package.json
```

## Data Flow

```
┌─────────────────────┐     ┌─────────────┐     ┌─────────────┐
│ .foam/templates/    │────▶│   parser    │────▶│   tracker   │
│ daily-note.md       │     │ (infers     │     │ (aggregates │
│ (infers journal/)   │     │  journal/)  │     │  + streaks) │
└─────────────────────┘     └─────────────┘     └─────────────┘
                                   │                   │
┌─────────────────────┐            │                   │
│ .foam/habits.yaml   │────────────┼───────────────────┤
└─────────────────────┘            │                   │
                                   ▼                   ▼
                          ┌─────────────────────────────────┐
                          │        useHabitData() hook      │
                          └─────────────────────────────────┘
                                          │
                                          ▼
                          ┌─────────────────────────────────┐
                          │     Ink Components (React)      │
                          │  Header → Heatmap → HabitRow    │
                          └─────────────────────────────────┘
```

## Key Files

### `source/lib/schemas.ts`
Zod schemas defining data structures:
- `HabitConfigSchema` - habit config from yaml (emoji, goal, threshold)
- `ConfigSchema` - full habits.yaml structure
- `HabitEntrySchema` - single day's habit entry
- `HabitDataSchema` - aggregated habit data for display
- `parseGoal()` - parse goal strings like "4L" → {value: 4, unit: "L"}

### `source/lib/parser.ts`
Parses journal markdown files:
- `inferJournalFolder()` - reads `.foam/templates/daily-note.md` to find journal folder
- `extractHabitsSection()` - extracts `## Habits` section from markdown
- `parseHabitEntries()` - parses habit list items into structured data
- `parseJournals()` - main entry point for parsing all journal files

### `source/lib/tracker.ts`
Aggregates habit data:
- `getDateRange()` - generate date range based on view args
- `aggregateHabits()` - combine entries into HabitData for rendering
- `getCompletionLevel()` - calculate 0-3 completion level for cells

### `source/components/Cell.tsx`
Renders completion symbols with colors:
- `░` (dim) - not done
- `▒` (red) - low progress
- `▓` (yellow) - partial progress
- `█` (green) - complete

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Ink | React for CLIs, component-based UI |
| Validation | Zod | Runtime validation, type inference |
| YAML | js-yaml | Standard, reliable |
| Dates | date-fns | Lightweight, tree-shakeable |
| CLI Args | meow | Simple, flexible argument parsing |

## Configuration

### habits.yaml
```yaml
habits:
  Gym:
    emoji: 💪

  Drink water:
    emoji: 💧
    goal: 4L          # Numeric goal with unit
    threshold: 0.8    # 80% = complete (optional, default 1.0)
```

### Daily Note Format
```markdown
## Habits

- Gym
- Drink water: 3.5L
- Meditation
```

## CLI Usage

```bash
foam-habits                  # Last 4 weeks
foam-habits --weeks 12       # Last 12 weeks
foam-habits --current-month  # Current month only
```

## Testing

85 tests using ava:
```bash
npm test
```

Tests cover:
- `parseGoal()` - goal string parsing
- `getCompletionLevel()` - completion level calculation
- `extractHabitsSection()` - markdown section extraction
- `parseHabitEntries()` - habit entry parsing (including emoji stripping, checkboxes)
- `parseFolderFromTemplate()` - journal folder inference
- `isScheduledForDate()` - schedule validation
- E2E tests with Tim Maia fixture

## Extending

### Adding a new component
1. Create in `source/components/`
2. Use Ink's `Box` and `Text` components
3. Import theme constants from `lib/theme.ts`

### Adding a new CLI option
1. Add flag in `source/cli.tsx` meow config
2. Pass to `<App>` component
3. Handle in `useHabitData` hook or components

### Adding a new habit field
1. Update `HabitConfigSchema` in `schemas.ts`
2. Handle in `aggregateHabits()` in `tracker.ts`
3. Use in components as needed

## Development Workflows

### Feature Development

When implementing a new feature from the roadmap:

1. **Pick feature from roadmap**: Check `README.md > Roadmap > Next` for the next feature to implement

2. **Plan implementation**: Create a plan covering:
   - Files to modify
   - Schema changes (if any)
   - Parser/tracker changes (if any)
   - Component changes (if any)
   - Required unit tests

3. **Implement with tests**:
   - Write unit tests in `source/lib/__tests__/` for new functions
   - Follow existing test patterns (ava framework)
   - Aim for coverage of happy path + edge cases

4. **Update fixture and E2E tests**:
   - Update `fixtures/generate-tim-maia.js` to demonstrate new feature
   - Regenerate fixture: `node fixtures/generate-tim-maia.js`
   - Update `source/lib/__tests__/e2e.test.ts` with new assertions
   - Verify CLI works: `cd fixtures/tim-maia && ../../dist/cli.js --reference-date 1989-04-06 --weeks 5`

5. **Update documentation**:
   - Update `README.md` with new feature documentation
   - Remove implemented feature from `Roadmap > Next`

6. **Verify all tests pass**: `npm test`

### Version Release

When releasing a new version:

1. **Update CHANGELOG.md**:
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   ### Added
   - New feature description

   ### Changed
   - Changed behavior description

   ### Fixed
   - Bug fix description
   ```

2. **Ensure README.md is updated**:
   - New features documented in relevant sections
   - Implemented features removed from Roadmap

3. **Commit changes**:
   ```bash
   git add -A
   git commit -m "feat: description of changes"
   ```

4. **Bump version and tag**:
   ```bash
   npm version <major|minor|patch>  # Runs preversion hook, creates commit + tag
   ```
   - **major**: Breaking changes
   - **minor**: New features (backward compatible)
   - **patch**: Bug fixes

   The `preversion` hook automatically:
   - Validates `package-lock.json` is in sync
   - Runs all tests

5. **Push to remote**:
   ```bash
   git push && git push --tags
   ```

6. **CI/CD publishes to npm**: GitHub Actions handles npm publish on new tags
