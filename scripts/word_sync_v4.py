#!/usr/bin/env python3
"""Word-timestamp integration tests, offline mocked TTML provider."""
from playwright.sync_api import sync_playwright
from pathlib import Path
R=Path(__file__).resolve().parents[1]
html=(R/'preview.html').read_text().replace('<script src="bratstage.js"></script>','').replace('let position=20200','let position=800')
js=(R/'bratstage.js').read_text()
ttml='<tt xmlns="http://www.w3.org/ns/ttml"><body><div><p begin="00:02.000" end="00:04.000"><span begin="00:02.000" end="00:02.500">alpha </span><span begin="00:02.500" end="00:04.000">beta</span></p><p begin="00:06.000" end="00:08.000"><span begin="00:06.000">gamma </span><span begin="00:06.500">delta</span></p></div></body></tt>'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1200,'height':850});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)+' '+str(e.stack)))
 page.goto('about:blank')
 page.evaluate("""() => {const data={};Object.defineProperty(window,'localStorage',{
 configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]}})}""")
 page.set_content(html)
 page.evaluate('localStorage.removeItem("bratstage:v1:customLrc")')
 page.evaluate('''text=>{ window.fetch=async()=>({status:200,ok:true,json:async()=>({ttml:text})}) }''',ttml)
 page.add_script_tag(content=js)
 page.evaluate('window.BratStage.open()')
 page.wait_for_timeout(180)
 assert page.locator('#bs-line-list').inner_text().strip()=='',page.locator('#bs-line-list').inner_text()
 # First line true words
 page.evaluate('Spicetify.Player.seek(2150)')
 page.wait_for_timeout(120)
 print('2150',page.locator('.bs-word-now').all_text_contents(),page.locator('.bs-word-future').all_text_contents())
 assert page.locator('.bs-word-now').all_text_contents()[0].strip()=='alpha'
 assert page.locator('.bs-word-future').all_text_contents()[0].strip()=='beta'
 page.evaluate('Spicetify.Player.seek(2700)')
 page.wait_for_timeout(120)
 assert page.locator('.bs-word-now').all_text_contents()[0].strip()=='beta'
 # Pause in explicit gap should show blank even after first line
 page.evaluate('Spicetify.Player.seek(4700)')
 page.wait_for_timeout(120)
 assert not page.locator('.bs-line').count(),'Unexpected future lyric or stale line in timed silence'
 print('PASS: initial silence, timed word reveal at real timestamps, gap clearing, no page exceptions',len(errors))
 assert not errors,errors
 browser.close()
