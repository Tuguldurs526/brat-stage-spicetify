# BRAT/STAGE v3.0 — Cinema Lyrics

A fullscreen, customizable Spotify player for **Spicetify Desktop**. Standalone installable JavaScript extension, with its source available under `src/`.

This is an independent implementation, informed by the user-provided reference [Kiano-Ksl/brat-lyrics-spicetify](https://github.com/Kiano-Ksl/brat-lyrics-spicetify). No reference repository source code is bundled.

## Installing / upgrading on Windows

1. Close Spotify.
2. Copy **`bratstage.js`** to `%APPDATA%\spicetify\Extensions\` (press `Win + R` and paste the directory). Replace the older file of the **same name**.
3. If BRAT/STAGE was previously enabled, open PowerShell and run **`spicetify apply`**. If installing for the first time, run:

   ```powershell
   spicetify config extensions bratstage.js
   spicetify apply
   ```
4. Restart Spotify. Play a track and press **Alt+B** or use the BRAT/STAGE playbar button.
5. Open the settings with the hover toolbar's gear or **Alt+S**.

macOS/Linux extensions folder: `~/.config/spicetify/Extensions/`.

## What's new in v3

### Lyrics as the main experience

- **BRAT Growing Square**: each word appears and the visible composition re-fits smoothly. This is now the default for existing v2 installs on first v3 launch. (Later adjustments persist.)
- **BRAT Locked Square**: fits the *full* line first, then progressively reveals words without changing box geometry.
- **Cinematic Words**, **Spotlight**, and **Multi-line** presentations.
- Six word-entrance presets: BRAT Pop, Silk, Wipe, Glow, Snap, Off. Separate line transition and duration settings.
- Font choice, font size, minimum fit size, weight, letter case, text alignment, line spacing and visible-line count.
- Lyrics are clickable to seek to their line start.

### Timing sources and accuracy

1. A locally imported **TTML** or enhanced **LRC** file with real word timestamps (if you've provided one for the track).
2. **Better Lyrics** `/getLyrics` TTML for precise word/syllable timing where accessible and available.
3. **Unison** TTML lookup by valid Spotify track ID, where available.
4. **LRCLIB** synced LRC as line-timing fallback.

For line-only lyrics, **word timing is an estimate**, not speech recognition. The active source and timing precision are shown under **Settings → Sync & video**. The user may select **Show entire line** instead of an estimated word-by-word animation. Per-track ±50/±250 ms offsets are saved. These adjustments correct a systematic offset, not inaccurate individual timestamps.

External services can be rate limited, require credentials for cache misses, or fail CORS rules in a specific Spotify WebView. In these cases the extension falls back rather than claiming exact sync. Better Lyrics and Unison are independent third-party services; their availability is not guaranteed.

### Cleaner playback

- The circular seek and volume wheels are **replaced with linear, draggable progress and volume sliders**.
- Play/pause, previous/next, mute, and optional video button remain accessible by mouse.
- Controls **fade away automatically** after a user-defined delay of **0.5–12 seconds**. Move the cursor, hover at the top/bottom, or use keyboard navigation to show them. They remain visible while Settings is open.
- The upper controls sit below the Spotify window-title area to avoid overlapping its window buttons.
- Minimal player defaults: artwork and track information are disabled unless enabled in settings.

### Backgrounds

- Phrase/lyric-line-driven **Wash**, **Gradient**, or occasional **Flip** transitions, with adjustable transition speed. Beat reactions remain optional but default off (manual BPM fallback is never treated as true beat detection).
- Album-color sampling, custom colors, custom image/GIF, blurred album artwork, and muted YouTube video. YouTube automatic search requires your own YouTube Data API v3 key.
- User-uploaded image files are stored in local IndexedDB. API keys are stored locally in the Spotify/Spicetify profile. Treat them as sensitive: don't publish your Spotify profile or export secrets.

### Shortcuts

| Action | Shortcut |
|---|---|
| Open/close | **Alt+B** |
| Settings | **Alt+S** while overlay is open |
| Play/pause | **Space** |
| Close overlay / Settings | **Escape** |
| Lyric timing adjust | **[** subtracts 50ms, **]** adds 50ms (positive offset displays earlier) |
| Seek | Left / right arrow keys (5 sec) |

## Development

`src/core.js` contains parsing, matching, color, timing math. `src/extension.js` contains Spotify integration, rendering, controls, provider calls and settings. `src/style.css` contains all animation and layout CSS. The build script embeds CSS into the single extension file without external dependencies.

```bash
python scripts/build.py
node --test tests/core.test.js
python scripts/smoke_v3.py
python scripts/smoke_provider_v3.py
```

`preview.html` is an **offline simulated Spotify player** with original synthetic demo lyrics and timings. It does not test Spotify authentication, audio capture or a live lyric server. Chrome browser smoke tests use the bundled extension with a mocked Spicetify Player, and the provider test mocks the TTML response.

## Known limitations

- Exact automatic word alignment is available **only when a provider or imported file supplies accurate word or syllable timestamps**. This extension does not transcribe Spotify audio, and line-only fallback words are approximate.
- Desktop Spotify WebViews and external lyric services change. A good browser simulation is not proof of compatibility with every Spotify update.
- Native Spotify window controls may still be visible if OS fullscreen is unavailable. They are not DOM controls the extension can remove.
- YouTube embeds can be blocked, have ads or refuse autoplay. Video sync is best-effort and muted; Spotify continues to provide the audio.
- This project has not been verified inside the user's own Spotify desktop build. The bundled tests validate JS syntax, timing/parser helpers and browser UI interactions.

## Credits

UI and engine implementation is original work built for this project. Inspiration: the user-supplied [BRAT Lyrics Spicetify](https://github.com/Kiano-Ksl/brat-lyrics-spicetify) repository. Lyric sources: [Better Lyrics API](https://docs.betterlyrics.org/), [Unison](https://docs.betterlyrics.org/unison), and [LRCLIB](https://lrclib.net/). Spicetify integration: [Spicetify documentation](https://spicetify.app/docs/development/extensions).

Code license: MIT, see `LICENSE`.
