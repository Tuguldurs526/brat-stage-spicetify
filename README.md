# BRAT/STAGE v4.1.0 — Playback & Dock Refinement

Drop-in update to the user's BRAT/STAGE v4.0 Spicetify extension. The existing settings key (`bratstage:v1:`), saved per-song YouTube links, lyric offsets, palette settings, and all existing features remain unchanged.

## Updates

- **Reliable play/pause mouse input:** The animation loop formerly replaced the play/pause button's SVG on every frame. Replacing a pressed element can cancel the resulting click. The icon is now updated **only when playback state changes**. Playback uses explicit `Spicetify.Player.play()` / `.pause()` with a guarded fallback for older builds, a short accidental-double-click guard, and brief optimistic icon feedback for delayed player events.
- **Larger dock artwork and metadata:** Desktop artwork increases from 39×39 to **55×55 px**, with a **15 px** song title and **12 px** artist line. Compact breakpoints keep controls inside smaller windows.
- **Repeat control:** New button adjacent to the transport controls. Cycle: **Off → Repeat all → Repeat one → Off**. Reads `Spicetify.Player.getRepeat()` and sets it with `Spicetify.Player.setRepeat(mode)`; reflects the state in its icon and accessible label.
- **Auto-hide mouse pointer:** Cursor is hidden with the dock, controlled by **Settings → Motion → Hide mouse cursor with the controls** (on by default). Mouse movement restores both instantly. Disabling auto-hide keeps the cursor visible.
- **Reduced rendering churn:** The mute SVG no longer rebuilds on every animation frame either.

## Installing

Replace the previously installed `bratstage.js` with this file. Windows manual installation:

1. Open `%APPDATA%\spicetify\Extensions`.
2. Replace `bratstage.js`.
3. Run `spicetify apply` in PowerShell.

For Marketplace distribution, update `bratstage.js` in your public GitHub repository and push the commit. Existing users can update via Marketplace when its cache refreshes. Avoid enabling the manual and Marketplace copies simultaneously.

## Testing

- `node --check bratstage.js`
- `python test_extension.py` (requires Playwright Python module and `/usr/bin/chromium`)
- Browser test with mocked Spicetify Player: slow single-click play and pause, SVG stability between frames, repeat modes, hover auto-hide and cursor behavior, settings toggle, and viewport bounds at 970, 700, and 390 px.

**Limitation:** These are browser-simulation tests rather than actual Spotify Desktop runtime tests. Exact behavior can still depend on Spotify/Spicetify versions and operating-system fullscreen behavior.
