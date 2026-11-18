# Changelog

## v5.0.0 — November 18, 2026

**Cross-platform release**
- Unified v4.1 shipped code and editable sources to prevent the next build from reverting playback fixes.
- Generated a native SpotiKit ES-module extension from the same lyrics/UI source using SpotiKit.Player, Playbar and storage adapters.
- Added a `spotikit.json` listing beside the original Spicetify `manifest.json`.
- Implemented SpotiKit hot-disable cleanup for UI nodes, timers, pending lyric requests, player listeners and toolbar buttons.
- Added a diagnostics tab and a safe, redacted diagnostics API without track titles or API keys.
- Isolated the Spicetify extension bundle to reduce accidental global collisions with duplicate installations.
- Added dual-platform Chromium mock-player integration tests alongside the 18 existing core tests.

**Known limits**
- The native SpotiKit build has not been verified against a physical Spotify installation; its manifest deliberately omits an untested Spotify version range.
- Exact word timing still needs a provider supplying word-level timestamps; native audio analysis is not claimed to be available.
- Some YouTube videos cannot be embedded or auto-played under their publisher's and browser's rules.


## v4.1.0 — November 14, 2026

**Fixed**
- Lost play/pause clicks caused by replacing the play button's SVG each animation frame.
- Continuous mute SVG churn during rendering.

**Added**
- Three-state repeat toggle (Off, All, One) with live state and accessible text.
- Auto-hide cursor setting matching the toolbar's configurable timer.

**Updated**
- Artwork, song, and artist sizes in the dock; responsive spacing for small Spotify windows.
- Direct play/pause commands with guarded visual feedback.

All v4 lyrics, videos, themes, per-song overrides, and stored preferences remain intact.
