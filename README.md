# BRAT/STAGE v5.0 — Spicetify + SpotiKit

A full-screen, cinematic lyrics experience for Spotify desktop. The same source now builds a legacy **Spicetify** extension and a native **SpotiKit** extension. Both use the same lyric renderer, UI, saved preference keys and source files.

![BRAT/STAGE preview](screenshots/preview-player.png)

> Screenshot from the earlier browser-rendered v4 preview, not a verified capture of a v5 Spotify/SpotiKit installation.

## What you get

- **BRAT lyric compositions:** expanding square, locked square, cinematic word reveal, spotlight, and multi-line stack.
- **Accurate timing where available:** word-timed TTML and enhanced LRC, regular line-timed LRC, source-aware fallback. Estimated word timing is separately labeled and opt-in.
- **Customization:** font, weight, fit, motion, word effects, backdrop, curated phrase palettes, colors sampled from album artwork and synchronization offsets.
- **Video:** optional muted YouTube embeds, per-track links, automatic matching using your own YouTube API key, timing offset and graceful unavailable-video fallback. YouTube may still block embedding/autoplay or display captions.
- **Controls:** dependable mouse play/pause, repeat off/all/one, responsive artwork and track info, seek and volume sliders, hover-auto-hide and optional mouse hiding.
- **Diagnostics (new):** Settings → Diagnostics reports the platform, lyric accuracy/source, and optional API support. Copy Safe Diagnostics leaves out track names, links and keys.
- **Native lifecycle (new):** the SpotiKit build removes the overlay, buttons, listeners, timers, and stylesheet when disabled; it can be enabled again without leaving duplicate UI.

## GitHub and Marketplaces

This ZIP is **ready to merge into your existing repository**: `bratstage.js`, `manifest.json`, `spotikit.json`, `dist/`, `src/`, `scripts/`, `tests/` and `screenshots/` are at the ZIP root. No `.git` history is included.

Make sure your GitHub repository is public, then add **both** repository topics:

- `spicetify-extensions`
- `spotikit-extensions`

The Spicetify Marketplace reads **`manifest.json`**, which installs `bratstage.js`. The SpotiKit Marketplace reads **`spotikit.json`**, which installs **`dist/bratstage.spotikit.js`**. Do not rename these output files without changing the manifests.

The SpotiKit `spotify` compatibility-range field is **intentionally omitted** because a specific real Spotify build has not been tested. When you validate against a real release, add the tested version range.

### Spicetify manual installation

1. Copy `bratstage.js` to `%APPDATA%\spicetify\Extensions\`.
2. Run `spicetify config extensions bratstage.js` and then `spicetify apply`.
3. Play a song; press **Alt+B**. **Alt+S** opens settings when the overlay is open.

### SpotiKit installation

1. Publish the repo with `spotikit.json` in its root and the generated `dist/bratstage.spotikit.js` committed.
2. Open SpotiKit → Marketplace → install from repository link (or search after indexing).
3. Choose **BRAT/STAGE** under Extensions, then play a song and press **Alt+B**.
4. Native SpotiKit installation doesn't require the Spicetify compatibility switch. Don't install both the native and legacy version in the *same* SpotiKit instance.

SpotiKit and Spicetify are alternative Spotify modifications; don't run both modification frameworks on the same Spotify installation at once. Use the native package matching your setup.

## Build from source

```shell
python scripts/build.py
node --check bratstage.js
node --check dist/bratstage.spotikit.js
node --test tests/core.test.js tests/core_v4.test.js
python tests/browser_dual.py
```

`src/core.js`, `src/style.css`, `src/extension.js` and `src/spotikit-adapter.js` are the source of truth. `scripts/build.py` generates both installable bundles without npm or network dependencies. Always **commit both generated files** after building.

## Architecture and platform differences

| Capability | Spicetify | Native SpotiKit |
|---|---|---|
| Player, skip, seek, volume, repeat | Spicetify.Player | SpotiKit.Player via native adapter |
| Toolbar | Spicetify.Playbar | SpotiKit.Playbar |
| Timed lyrics and palettes | Shared engine | Shared engine |
| External lyrics and video | Browser fetch / embed | Browser fetch / embed; subject to CORS / autoplay |
| Audio analysis beat timestamps | Only when API supplies them | Not exposed through current native adapter; BPM/phrase fallback |
| Hot disable and re-enable | Usually needs Spotify reload | Clean native lifecycle |

**No false audio alignment claim:** word timing is only exact when a provider supplies word timestamps. SpotiKit can still use the phrase-driven backgrounds even when audio beat data is unavailable.

**Important:** Functional tests here use mock Spotify player services in Chromium and do not replace real installation tests. Public lyric provider availability, internal API compatibility, and YouTube's iframe policies may differ by Spotify version and region.

## Troubleshooting

- **Nothing happens on Alt+B:** Ensure you've installed the *correct platform build*. Do not enable two copies simultaneously.
- **Lyrics missing:** Open Settings → Diagnostics. Try Sync & Video → Retry lyrics and verify provider access. Not every song has word-timed lyrics.
- **Word animation not in sync:** Check the source's timing precision and adjust the per-song offset. Line timestamps alone don't contain precise word timings.
- **YouTube doesn't load:** Check embeddability, API key quota and video source; some videos cannot be embedded or auto-played.
- **SpotiKit Marketplace doesn't list it:** On Marketplace, use **Install from a link** with your GitHub repository URL and verify the two GitHub topics and paths. Indexing may take time.
- **Duplicate controls after update:** Remove the extra manually installed copy and reload Spotify, then use the native lifecycle to toggle in SpotiKit.

## Privacy and credits

Preferences, per-song offsets and video links are stored locally. Entered YouTube Data API and Better Lyrics keys are used only for their services, kept out of exported presets and safe diagnostics. Imported custom background media is stored via IndexedDB. Don't commit personal API keys or user preference exports to GitHub.

License: MIT (`LICENSE`). Original BRAT/STAGE code from the supplied project; its visual direction references a broader BRAT aesthetic. Music, lyrics and YouTube content belong to their respective owners and providers.

Official documentation: [Spicetify Extensions](https://spicetify.app/docs/development/extensions) · [SpotiKit Extensions](https://spotikit.com/docs/creating-extensions) · [SpotiKit manifest](https://spotikit.com/docs/manifest).
