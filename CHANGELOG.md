# Changelog

## v5.1.0 · Marketplace presentation & branding (2026-11-18)

- **New branded playback icon:** replaced SpotiKit's unsupported `music` icon name with a compact custom SVG. Spicetify now uses the same brand mark instead of its old music-note icon.
- **SpotiKit compatibility metadata:** declared a provisional target range `1.3.8 - 1.3.9` in `spotikit.json`. **This is not a claim of live testing**; verify each supported Spotify build before widening the range.
- **Sharper Marketplace introduction:** concise and feature-focused copy in both manifests.
- **New screenshot gallery:** actual user-provided session capture plus fresh cinematic browser renders, settings views, and an animated word-reveal demo. Preview images created with original demonstration lyrics.
- **New README:** direct installation, controls, configuration screenshots, privacy notes, testing steps, star/review links, and clear limits for word-timed sources and YouTube.
- Preserved v5.0 functionality, saved preferences, existing user settings, and both platform distributions.


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
