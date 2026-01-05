# foam-habits

A terminal habit tracker that reads from [Foam](https://foambubble.github.io/foam/) daily notes and displays a GitHub-style heatmap.

![foam-habits demo](fixtures/tim-maia/demo.gif)

*Demo features controversial habits from [Tim Maia](https://en.wikipedia.org/wiki/Tim_Maia) — a homage in our test fixture :D*

## Prerequisites

- Node.js >= 16

## Installation

```bash
# Run without installing
npx foam-habits

# Or install globally
npm install -g foam-habits
```

## Configuration

Create a `.foam/habits.yaml` file in your Foam workspace root:

```yaml
habits:
  Gym:
    emoji: 💪

  Drink water:
    emoji: 💧
    goal: 4L

  Study:
    emoji: 📖
    goal: 30min
    threshold: 0.8 # Consider done at 80% (24min)

  Meditation:
    emoji: 🧘

  Mobility:
    emoji: 🤸
```

### Habit Options

| Option      | Type   | Default  | Description                                                 |
| ----------- | ------ | -------- | ----------------------------------------------------------- |
| `emoji`     | string | required | Emoji displayed next to habit name                          |
| `goal`      | string | -        | Target value with unit (e.g., `"4L"`, `"30min"`, `"2.5km"`) |
| `threshold` | number | `1.0`    | Percentage (0.0-1.0) of goal to consider habit "done"       |

**Boolean habits** (no goal): Present = complete. Just log the habit name.

**Quantitative habits** (with goal): Track progress toward a target. The value is compared against the goal.

## Journal Format

The tool automatically detects your journal folder from `.foam/templates/daily-note.md`. Falls back to `journal/` if not found.

In your daily notes (`journal/YYYY-MM-DD.md`), add a `## Habits` section:

```markdown
# 2025-01-01

## Habits

- Gym
- Drink water: 3.5L
- Meditation

## Notes

Today was productive...
```

### Entry Format

- **Boolean habit**: Just the habit name (e.g., `- Gym`)
- **Quantitative habit**: Name followed by colon and value (e.g., `- Drink water: 3.5L`)

The habit name matching is case-insensitive.

## Usage

```bash
# From your Foam workspace root
foam-habits

# Show last 2 weeks
foam-habits --weeks 2

# Show current month
foam-habits --current-month

# Or use npx without installing
npx foam-habits --weeks 4
```

### Options

| Option            | Alias | Default | Description                                |
| ----------------- | ----- | ------- | ------------------------------------------ |
| `--weeks`         | `-w`  | `4`     | Number of weeks to display                 |
| `--current-month` | `-m`  | `false` | Show current month instead of last N weeks |
| `--help`          | `-h`  | -       | Show help                                  |

## Heatmap Legend

| Symbol | Color  | Meaning                                |
| ------ | ------ | -------------------------------------- |
| `░`    | dim    | Not done                               |
| `▒`    | red    | Low progress (<50% of threshold)       |
| `▓`    | yellow | Partial progress (50-99% of threshold) |
| `█`    | green  | Complete (meets threshold)             |

## Streaks

The streak counter shows consecutive days of completion, counting backwards from today. A streak is maintained when the habit meets the threshold requirement each day.

When a streak exceeds 7 days, a fire emoji appears for extra motivation.

## Tips

1. **Use thresholds** for flexibility. Set `threshold: 0.8` to consider a habit done at 80% of the goal.

2. **Keep habits simple**. Boolean habits (no goal) are great for habits you just want to track presence/absence.

3. **Run from workspace root**. The tool looks for `.foam/habits.yaml` and `journal/` in the current directory.

## Development

```bash
git clone https://github.com/olavocarvalho/foam-habits.git
cd foam-habits
npm install
npm run build
npm test      
npm run dev     # Watch mode
```

## Roadmap

### Next

- [ ] **Habit start date**: Differentiate between days when a habit wasn't tracked yet vs days when it was skipped. Add optional `start-date` config:
  ```yaml
  habits:
    Gym:
      emoji: 💪
      start-date: 2025-01-01 # Days before this show as " " instead of "░"
  ```
  This prevents old days from appearing as "missed" when you add a new habit.

- [ ] **Weekly schedule per habit**: Define which days of the week each habit applies. Non-scheduled days show as blank instead of missed:
  ```yaml
  habits:
    Gym:
      emoji: 💪
      schedule: [mon, wed, fri]    # Custom days

    Meditation:
      emoji: 🧘
      schedule: weekdays           # Mon-Fri shortcut

    Family time:
      emoji: 👨‍👩‍👧
      schedule: weekends           # Sat-Sun shortcut
  ```
  - `daily` = all days (default, current behavior)
  - `weekdays` = Monday through Friday
  - `weekends` = Saturday and Sunday
  - `[mon, tue, wed, thu, fri, sat, sun]` = custom array

  Streaks skip non-scheduled days (e.g., Mon-Wed-Fri consistency = unbroken streak).

- [ ] **Configurable color palette**: Allow customizing colors in `habits.yaml`:
  ```yaml
  theme:
    complete: green
    partial: yellow
    low: red
    title: cyan
  ```
  Support both ANSI color names (theme-adaptive) and hex codes (exact colors).

- [ ] **Strip emojis from journal entries**: When parsing daily notes, strip emojis from habit names before matching against `habits.yaml`. This allows using emojis in journal entries for a nicer writing experience:
  ```markdown
  ## Habits
  - 💪 Gym
  - 💧 Drink water: 3.5L
  ```
  Would match `Gym` and `Drink water` in the config. The emoji in the config remains the source of truth for display.

- [ ] **Markdown checkbox support**: Support optional markdown checkboxes in habit entries. This allows habits to be used as a checklist in your daily note:
  ```markdown
  ## Habits
  - [x] Gym
  - [ ] Meditation
  - [x] Drink water: 3.5L
  ```
  - `- [x]` or `- [X]` = habit done (boolean) or value logged (quantitative)
  - `- [ ]` = habit explicitly not done (skip for the day)
  - `- Habit` = current behavior, presence means done

  Both styles should work, allowing users to choose their preferred journaling format.

### Later

- [ ] **Charts for quantitative habits**: Display line/bar charts for non-boolean habits using [ink-chart](https://github.com/pppp606/ink-chart). Show trends over time for habits like water intake, study minutes, etc.

- [ ] **Log habit from CLI**: Quickly log habits without opening your daily note:
  ```bash
  # Log a boolean habit
  npx foam-habits log "Gym"

  # Log a quantitative habit
  npx foam-habits log "Drink water: 0.5L"

  # Log to a specific date
  npx foam-habits log "Drink water: 0.5L" --reference-date 2025-01-01
  ```
  If the habit already exists in the note with a value, sum the new value (e.g., logging `0.5L` twice results in `1L`). Creates the daily note if it doesn't exist.

## License

MIT
