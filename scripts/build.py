#!/usr/bin/env python3
"""Build both distributions from one synchronized BRAT/STAGE source tree."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
src=root/'src'
css=(src/'style.css').read_text(encoding='utf8')
core=(src/'core.js').read_text(encoding='utf8')
app=(src/'extension.js').read_text(encoding='utf8')
adapter=(src/'spotikit-adapter.js').read_text(encoding='utf8')
header='/* BRAT/STAGE v5.0.0 | MIT | Source of truth: src/ */\n'
common='const __BRATSTAGE_CSS__ = '+json.dumps(css,ensure_ascii=False)+';\n'
# Both builds reuse the same core, UI, and preferences. Only startup differs.
shared=common+core+'\n'+app+'\n'
# Use a module-local stylesheet reference; never overwrite another plugin's global CSS.
shared=shared.replace("window.__BRATSTAGE_CSS__ || ''",'__BRATSTAGE_CSS__')
legacy=header+'(function(){\n'+shared+'\nBratStageBootstrap();\n})();\n'
(root/'bratstage.js').write_text(legacy,encoding='utf8')
native=header+shared+'\n'+adapter+'\n'+'''export default function start(context) {
  const runtime = createSpotiKitAdapter(globalThis.SpotiKit,context);
  const cleanup = BratStageBootstrap(runtime,context);
  if (typeof context?.onStop === 'function') context.onStop(cleanup);
  return cleanup;
}
'''
(root/'dist').mkdir(exist_ok=True)
(root/'dist/bratstage.spotikit.js').write_text(native,encoding='utf8')
print('Spicetify:',(root/'bratstage.js').stat().st_size,'bytes')
print('SpotiKit:',(root/'dist/bratstage.spotikit.js').stat().st_size,'bytes')
