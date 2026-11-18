"""Publish-time checks: both Marketplaces, screenshots, branding and links."""
from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
spic=json.loads((ROOT/'manifest.json').read_text())[0]
spoti=json.loads((ROOT/'spotikit.json').read_text())
assert spoti['spotify']=='1.3.8 - 1.3.9'
assert spic['name']==spoti['name']=='BRAT/STAGE'
assert spic['description'].startswith('Immersive BRAT-style fullscreen lyrics')
assert spoti['description']==spic['description']
assert spoti['version']=='5.1.0'
for m in (spic,spoti):
 for key in ('main','preview','readme'):
  assert (ROOT/m[key]).is_file(),(key,m[key])
assert (ROOT/'assets/bratstage-mark.svg').read_text().count('<svg')==1
adapter=(ROOT/'src/spotikit-adapter.js').read_text()
assert 'icon:STAGE_ICON' in adapter and "icon:'music'" not in adapter
assert '<svg ' in adapter and '</svg>' in adapter
assert "ico('stage',18)" in (ROOT/'src/extension.js').read_text()
readme=(ROOT/'README.md').read_text()
for image in re.findall(r'!\[[^]]*\]\(([^)]+)\)',readme):
 assert (ROOT/image).is_file(),f'Missing README screenshot: {image}'
for img in re.findall(r'<img\s+[^>]*src="([^"]+)"',readme):
 assert (ROOT/img).is_file(),f'Missing README image: {img}'
for fn in ['brat-lime.png','afterhours-velvet.png','electric-blue.png','editorial-cream.png',
           'settings-themes.png','settings-typography.png','settings-motion.png','settings-backdrops.png',
           'real-spotify-session.png','word-reveal-demo.gif']:
 assert (ROOT/'screenshots'/fn).stat().st_size>1000,fn
assert 'Star the GitHub repository' in readme and 'Leave a review' in readme
assert 'Actual user-supplied Spotify screenshot' in readme
assert 'simulated playback' in readme.lower()
print('PASS: SpotiKit metadata, brand icon, linked gallery, descriptions, review and star links')
