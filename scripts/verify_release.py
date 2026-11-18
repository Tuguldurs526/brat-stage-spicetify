#!/usr/bin/env python3
"""Validate distribution manifests and generated bundle syntax before publishing."""
from pathlib import Path
import json,subprocess,sys,zipfile
root=Path(__file__).resolve().parent.parent
spic=json.loads((root/'manifest.json').read_text('utf8'))
spoti=json.loads((root/'spotikit.json').read_text('utf8'))
assert len(spic)==1 and spic[0]['name']==spoti['name']=='BRAT/STAGE'
assert spic[0]['main']=='bratstage.js'
assert spoti['type']=='extension' and spoti['main']=='dist/bratstage.spotikit.js'
for f in [spic[0]['main'],spic[0]['preview'],spic[0]['readme'],spoti['main'],spoti['preview'],spoti['readme']]:
    assert (root/f).is_file(), f'Missing referenced Marketplace file {f}'
for f in [spic[0]['main'],spoti['main']]:
    subprocess.run(['node','--check',str(root/f)],check=True)
subprocess.run(['node','--test',str(root/'tests/core.test.js'),str(root/'tests/core_v4.test.js')],check=True,stdout=subprocess.DEVNULL)
subprocess.run([sys.executable,str(root/'tests/test_release.py')],check=True)
print('PASS: both manifests, version metadata, SVG branding, README/gallery, JS syntax and 18 core tests')
