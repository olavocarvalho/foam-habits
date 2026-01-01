# Publishing foam-habits to npm

## Current State

The package is already 90% ready for npm distribution:
- ✅ `bin: "dist/cli.js"` - CLI entry point configured
- ✅ `#!/usr/bin/env node` shebang in cli.tsx
- ✅ `files: ["dist"]` - only dist folder published
- ✅ `type: "module"` - ESM support

---

## Implementation Steps

### Step 1: Update package.json metadata

Add/update fields in `package.json`:

```json
{
  "name": "foam-habits",
  "version": "1.0.0",
  "description": "Terminal habit tracker for Foam daily notes with GitHub-style heatmap",
  "keywords": ["foam", "habits", "tracker", "cli", "terminal", "heatmap", "ink", "daily-notes"],
  "author": "Olavo Carvalho",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/olavocarvalho/foam-habits.git"
  },
  "homepage": "https://github.com/olavocarvalho/foam-habits#readme",
  "bugs": {
    "url": "https://github.com/olavocarvalho/foam-habits/issues"
  }
}
```

### Step 2: Add prepublishOnly script

```json
"scripts": {
  "prepublishOnly": "npm run build && npm test"
}
```

### Step 3: Check package name availability

```bash
npm view foam-habits
```

If taken, fallback options:
- `foam-habit-tracker`
- `@olavocarvalho/foam-habits` (scoped)

### Step 4: Create new GitHub repo

1. Create repo `foam-habits` on GitHub
2. Copy `tools/foam-habits/*` to new repo
3. Push to GitHub

### Step 5: Publish to PUBLIC npm (not internal registry)

**Important:** Ensure you're publishing to public npm, not a company internal registry.

```bash
cd foam-habits

# Check current registry (should be https://registry.npmjs.org/)
npm config get registry

# Login to PUBLIC npm (specify registry explicitly)
npm login --registry https://registry.npmjs.org/

# Publish to PUBLIC npm (specify registry explicitly)
npm publish --registry https://registry.npmjs.org/
```

Alternatively, add to package.json:
```json
"publishConfig": {
  "registry": "https://registry.npmjs.org/"
}
```

---

## Result

After publishing, users can run:

```bash
# Without installing (runs from npm registry)
npx foam-habits

# Or install globally
npm install -g foam-habits
foam-habits

# With options
npx foam-habits --weeks 12
npx foam-habits --current-month
```
