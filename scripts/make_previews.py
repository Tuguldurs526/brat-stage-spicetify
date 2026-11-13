from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'preview.html').read_text().replace('<script src="bratstage.js"></script>','')
code=(R/'bratstage.js').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1600,'height':900},device_scale_factor=1)
 page.goto('about:blank')
 page.evaluate("""() => {const d={};Object.defineProperty(window,'localStorage',{configurable:true,
 value:{getItem:k=>d[k]??null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]}}});} """)
 page.set_content(html)
 page.add_script_tag(content=code)
 page.evaluate('window.BratStage.open()')
 page.wait_for_timeout(400)
 page.evaluate('Spicetify.Player.togglePlay()')
 page.wait_for_timeout(150)
 shots=R/'screenshots';shots.mkdir(exist_ok=True)
 page.screenshot(path=str(shots/'preview-player.png'))
 page.wait_for_timeout(2950)
 page.screenshot(path=str(shots/'cinema-hidden-dock.png'))
 page.mouse.move(780,790);page.wait_for_timeout(260)
 page.locator('#bs-settings-btn').click(force=True)
 page.wait_for_timeout(240)
 page.screenshot(path=str(shots/'settings.png'))
 print('created previews',[(x.name,x.stat().st_size) for x in shots.glob('*.png')])
 browser.close()
