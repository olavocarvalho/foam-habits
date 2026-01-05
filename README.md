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
    goal: 30min
    threshold: 0.8 # Consider done at 80% (24min)

  Meditation: {}  # Minimal config (uses default 🔹 emoji)
```

### Habit Options

| Option       | Type             | Default  | Description                                                 |
| ------------ | ---------------- | -------- | ----------------------------------------------------------- |
| `emoji`      | string           | `🔹`     | Emoji displayed next to habit name                          |
| `goal`       | string           | -        | Target value with unit (e.g., `"4L"`, `"30min"`, `"2.5km"`) |
| `threshold`  | number           | `1.0`    | Percentage (0.0-1.0) of goal to consider habit "done"       |
| `start-date` | string           | -        | Date (YYYY-MM-DD) when habit tracking begins                |
| `schedule`   | string or array  | `daily`  | Days the habit applies: `daily`, `weekdays`, `weekends`, or `['mon', 'wed', 'fri']` |

**Boolean habits** (no goal): Present = complete. Just log the habit name.

**Quantitative habits** (with goal): Track progress toward a target. The value is compared against the goal.

### Global Config

Add a `config` section for global settings:

```yaml
config:
  checkbox: true  # Use "- [x] Habit" format when logging

habits:
  Gym:
    emoji: 💪
  # ...
```

| Option     | Type    | Default | Description                                          |
| ---------- | ------- | ------- | ---------------------------------------------------- |
| `checkbox` | boolean | `false` | Use checkbox format `- [x] Habit` when logging via CLI |

### Advanced Configuration Example

```yaml
habits:
  Gym:
    emoji: 💪
    schedule: [mon, wed, fri]    # Only Mon/Wed/Fri
    start-date: 2025-01-01       # Don't show before this date

  Meditation:
    emoji: 🧘
    schedule: weekdays           # Mon-Fri only

  Family time:
    emoji: 👨‍👩‍👧
    schedule: weekends           # Sat-Sun only
```

Days before `start-date` and non-scheduled days appear as blank (` `) instead of missed (`░`).

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

- **Gym:** Train A - chest and triceps
- **Drink water:** Need to cut back on soda

Today was productive...
```

### Entry Format

- **Boolean habit**: Just the habit name (e.g., `- Gym`)
- **Quantitative habit**: Name followed by colon and value (e.g., `- Drink water: 3.5L`)

The habit name matching is case-insensitive.

### Alternative Formats

You can also use emojis and checkboxes in your journal entries:

```markdown
## Habits

- 💪 Gym                    # Emoji prefix (stripped when matching)
- [x] Meditation            # Checkbox format
- [x] 💧 Drink water: 3.5L  # Both combined
- [ ] Study                 # Unchecked = skipped (not logged)
```

- **Emoji prefix**: Leading emojis are stripped before matching against config
- **Checkbox `[x]`**: Treated as done (same as plain `- Habit`)
- **Checkbox `[ ]`**: Treated as skipped (entry ignored)

### Habit Observations

Add observations to track details about your habits. They can be placed in two locations:

**In the intro area** (between `# Title` and first `##` section):
```markdown
# 2025-01-05

- **Gym:** Train A - chest and triceps

## Habits
- Gym
```

**In the `## Notes` section**:
```markdown
## Notes

- **Gym:** Felt strong today!
- **Drink water:** Too much coffee
```

The format is `- **HabitName:** observation text`. If observations exist in both locations, they're merged with ` | ` separator. These observations appear when using `--history`.

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

### Log Habit from CLI

Quickly log habits without opening your daily note:

```bash
# Log a boolean habit (today)
foam-habits --log "Gym"
foam-habits -l "Gym"

# Log a quantitative habit
foam-habits --log "Drink water: 0.5L"

# Log to a specific date
foam-habits --log "Drink water: 0.5L" --date 2025-01-01
```

**Behavior:**
- **Boolean habits**: If already logged, the entry is skipped (no duplicates)
- **Quantitative habits**: If already logged, values are summed (e.g., `0.5L + 0.3L = 0.8L`)
- **Unknown habits**: Logged with a warning (allows adding habits not in config)
- **Missing file**: Creates the daily note from template

### View Habit History

See a timeline view of a specific habit with observations:

```bash
# View Gym history (last 4 weeks)
foam-habits --history Gym

# View last 8 weeks
foam-habits --history "Drink water" --weeks 8
```

**Output:**

```
💪 Gym - Last 28 days
  Schedule: [Mon] / Tue / [Wed] / Thu / [Fri] / Sat / Sun  |  Started: 2025-01-01

2025-01-05  █  Train A - chest and triceps
2025-01-04  ░
2025-01-03  █  Train B - back and biceps
2025-01-02  █  Leg day. New PR on squats!
...
```

The history view shows:
- **Completion status**: Same symbols as heatmap (░▒▓█)
- **Observations**: From intro area and `## Notes` sections (merged with ` | ` if both exist)
- **Schedule**: All 7 days shown, scheduled days highlighted (shown in `[brackets]` above, purple in terminal)
- **Start date**: When tracking began (if configured)

### Options

| Option            | Alias | Default | Description                                |
| ----------------- | ----- | ------- | ------------------------------------------ |
| `--weeks`         | `-w`  | `4`     | Number of weeks to display                 |
| `--current-month` | `-m`  | `false` | Show current month instead of last N weeks |
| `--log`           | `-l`  | -       | Log a habit entry (e.g., `"Gym"` or `"Drink water: 0.5L"`) |
| `--date`          | `-d`  | today   | Date for log entry (YYYY-MM-DD)            |
| `--history`       | `-H`  | -       | Show habit timeline with observations      |
| `--help`          | `-h`  | -       | Show colorized help with config reference  |

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

- [ ] **Charts for quantitative habits**: Display line/bar charts for non-boolean habits using [ink-chart](https://github.com/pppp606/ink-chart). Show trends over time for habits like water intake, study minutes, etc.

- [ ] **Legend component**: Add a footer legend to heatmap and history views explaining the symbols:
  ```
  ░ not done  ▒ low  ▓ partial  █ complete
  ```

- [ ] **Normalize component naming**: Rename `Heatmap.tsx` → `HeatmapView.tsx` for consistency with `HistoryView.tsx`

- [ ] **Configurable color palette**: Allow customizing colors in `habits.yaml`:
  ```yaml
  config:
    colors:
      accent: cyan      # Titles, scheduled days, highlights (default: purple)
      complete: green
      partial: yellow
      low: red
  ```
  Support both ANSI color names (theme-adaptive) and hex codes (exact colors).

## License

MIT
