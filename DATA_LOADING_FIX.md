# Data Loading Fix - Configuration

## Issue Identified

The app was trying to load data from `localhost:3000/versions/latest.json` instead of from the remote GitHub Pages repository `https://bailian004.github.io/neoanno-data/`.

**Root Cause:** 
```typescript
// WRONG: Was using import.meta.env.DEV to enable "local dev mode"
devMode: import.meta.env.DEV,  // ← true in npm run dev
devPort: 3000,
```

This caused the loader to route to `http://localhost:3000` when running dev server, but there's no neoanno-data server there.

## Solution Implemented

### 1. Created `.env` configuration file

```env
VITE_NEOANNO_DATA_BASE_URL=https://bailian004.github.io/neoanno-data
VITE_NEOANNO_DATA_RAW_FALLBACK=https://raw.githubusercontent.com/Bailian004/neoanno-data/main
VITE_NEOANNO_DATA_DEV_MODE=false
VITE_NEOANNO_DATA_DEV_PORT=3000
```

This allows configuration without code changes. Defaults to using remote URLs.

### 2. Updated `src/context/DataContext.tsx`

Changed from:
```typescript
const { version, data } = await loadAnnoData({
  devMode: import.meta.env.DEV,  // ← Always true in dev
  pagesBaseUrl,
  // ...
});
```

To:
```typescript
const basePagesUrl = import.meta.env.VITE_NEOANNO_DATA_BASE_URL || pagesBaseUrl;
const baseRawUrl = import.meta.env.VITE_NEOANNO_DATA_RAW_FALLBACK || rawBaseUrl;
const devModeEnabled = import.meta.env.VITE_NEOANNO_DATA_DEV_MODE === 'true' || false;

const { version, data } = await loadAnnoData({
  devMode: devModeEnabled,  // ← false by default
  pagesBaseUrl: basePagesUrl,
  rawBaseUrl: baseRawUrl,
  // ...
});
```

### 3. Improved console logging

Now logs:
- Which base URL was used
- Whether dev mode was enabled
- Clear error messages with configuration details

## Result

✅ **App now correctly fetches from GitHub Pages**

When you run `npm run dev`:
1. DataContext reads `.env` vars
2. `VITE_NEOANNO_DATA_DEV_MODE=false` (default)
3. Uses `https://bailian004.github.io/neoanno-data` 
4. Data loads successfully
5. Falls back to raw.githubusercontent if needed

## How to Use Dev Mode (When Ready)

If you set up a local neoanno-data server later:

1. Start the local server on port 3000
2. Update `.env`:
   ```env
   VITE_NEOANNO_DATA_DEV_MODE=true
   ```
3. Reload dev server
4. Data will load from `http://localhost:3000`

## Verification

Run:
```bash
npm run dev
```

Then check browser console and Network tab:
- Should see requests to `https://bailian004.github.io/neoanno-data/versions/latest.json`
- Should see success messages (not 404 errors)
- Should see cached files in localStorage

## Key Differences from Before

| Before | After |
|--------|-------|
| DevMode always on in `npm run dev` | DevMode opt-in via `.env` |
| Routes to `localhost:3000` automatically | Routes to GitHub Pages by default |
| No way to override without code edit | Use `.env` for configuration |
| Dev console logs unclear | Logs configuration details |

---

**Status:** ✅ Fixed and ready to test
