# foam-habits

A habit tracker that reads from [Foam](https://foambubble.github.io/foam/) daily notes and output a rich output in your termimal.

```
Foam Habits - Last 28 Days

               Dec                      Jan
Habit          05    12    19    25     01

💪 Gym         ░░░░░█░░░░░░░░░░░░░░░░░░░░░█ (1 day)
💧 Drink water ░░░░░░░░░░░░░░░░░░░░░░░░░░░▓ (0 days)
📖 Study       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (0 days)
🧘 Meditation  ░░░░░░░░░░░░░░░░░░░░░░░░░░░█ (1 day)
🤸 Mobility    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (0 days)
```

## Installation

```bash
cd tools/foam-habits
npm install
npm run build
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
./tools/foam-habits/dist/cli.js

# Show last 2 weeks
./tools/foam-habits/dist/cli.js --weeks 2

# Show current month
./tools/foam-habits/dist/cli.js --current-month
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

1. **Add an alias** for quick access:

   ```bash
   alias habits='./tools/foam-habits/dist/cli.js'
   ```

2. **Use thresholds** for flexibility. Set `threshold: 0.8` to consider a habit done at 80% of the goal.

3. **Keep habits simple**. Boolean habits (no goal) are great for habits you just want to track presence/absence.

## Development

```bash
cd tools/foam-habits
npm install
npm run build
npm run dev  # Watch mode
```

## Roadmap

- [ ] **Habit start date**: Differentiate between days when a habit wasn't tracked yet vs days when it was skipped. Add optional `start-date` config:
  ```yaml
  habits:
    Gym:
      emoji: 💪
      start-date: 2025-01-01 # Days before this show as " " instead of "░"
  ```
  This prevents old days from appearing as "missed" when you add a new habit.

- [ ] **Configurable color palette**: Allow customizing colors in `habits.yaml`:
  ```yaml
  theme:
    complete: green
    partial: yellow
    low: red
    title: cyan
  ```
  Support both ANSI color names (theme-adaptive) and hex codes (exact colors).

- [ ] **Charts for quantitative habits**: Display line/bar charts for non-boolean habits using [ink-chart](https://github.com/pppp606/ink-chart). Show trends over time for habits like water intake, study minutes, etc.

## License

MIT
