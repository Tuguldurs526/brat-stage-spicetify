"""Headless Chromium integration for both generated entry points; mock players, not real Spotify."""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
track='spotify:track:4uLU6hMCjMI75M1A2tKUQC'
sample='[00:05.00]<00:05.00>here <00:05.95>we <00:06.55>go\n[00:09.00]<00:09.00>one <00:09.60>more'
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-web-security'])
    for platform,filename in [('Spicetify','harness_spicetify.html'),('SpotiKit','harness_spotikit.html')]:
        page=browser.new_page(viewport={'width':1366,'height':768})
        errors=[]
        page.on('pageerror',lambda err: errors.append(str(err)))
        html=(ROOT/'tests'/filename).read_text(encoding='utf8')
        html=html.split('<script type="module">')[0].split('<script src="../bratstage.js">')[0]
        page.set_content(html)
        page.evaluate('''(entry) => {
           const memory=new Map();
           Object.defineProperty(window,'localStorage',{configurable:true,value:{
              getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)
           }});
           localStorage.setItem('bratstage:v1:customLrc', JSON.stringify(entry));
        }''',{track:sample})
        if platform=='Spicetify':
            page.add_script_tag(content=(ROOT/'bratstage.js').read_text(encoding='utf8'))
        else:
            payload=base64.b64encode((ROOT/'dist/bratstage.spotikit.js').read_bytes()).decode()
            page.evaluate('''async (base64) => {
               const mod=await import('data:text/javascript;base64,'+base64);
               const cleanup=[];
               window.__start=()=>mod.default({onStop(fn){cleanup.push(fn)}});
               window.__dispose=()=>{for(const f of cleanup.splice(0))f()};
               window.__start();
            }''',payload)
        page.wait_for_function("document.querySelector('#bs-root') && window.BratStage?.version==='5.1.0'",timeout=8000)
        assert page.evaluate('window.BratStage.diagnostics().platform')==platform
        if platform=='SpotiKit':
            # Regression: a missing named icon used to render literal 'm u s i c' vertically.
            assert page.locator('[data-plugin-button] svg').count()>=1, 'SpotiKit icon not rendered as SVG'
            assert page.locator('[data-plugin-button]').first.get_attribute('data-icon')=='svg', 'expected custom vector icon'

        page.evaluate('window.BratStage.open()')
        page.wait_for_selector('#bs-root .bs-footer',state='visible')
        # During the instrumental intro no future lyrics are displayed.
        page.wait_for_timeout(150)
        assert page.locator('#bs-line-list .bs-line').count()==0,(platform,'premature lyrics')
        # Click once slowly: icon DOM should survive pointerdown/up (v4.1 regression).
        selector=page.locator('#bs-toggle')
        selector.hover();page.mouse.down();page.wait_for_timeout(250);page.mouse.up()
        page.wait_for_timeout(80)
        playing=page.evaluate('SpotiKit.Player.isPlaying' if platform=='SpotiKit' else 'Spicetify.Player.playing')
        assert playing,(platform,'play click failed')
        selector.click()
        page.wait_for_timeout(250)
        assert not page.evaluate('SpotiKit.Player.isPlaying' if platform=='SpotiKit' else 'Spicetify.Player.playing'),(platform,'pause click failed')
        # Repeat cycles through all modes.
        for target in ['1','2','0']:
            page.locator('#bs-repeat').click();page.wait_for_timeout(100)
            assert page.locator('#bs-repeat').get_attribute('data-mode')==target,(platform,'repeat',target)
        # Timed lyric should become visible only once its source timestamp is reached.
        if platform=='SpotiKit':page.evaluate('SpotiKit.Player.seek(5500)')
        else:page.evaluate('Spicetify.Player.seek(5500)')
        page.wait_for_timeout(200)
        assert 'here' in page.locator('#bs-line-list').inner_text().lower(),(platform,'no words')
        # Diagnostics are useful without leaking private data.
        page.locator('#bs-settings-btn').click()
        page.locator('[data-tab="diagnostics"]').click()
        assert platform in page.locator('#bs-settings-content').inner_text()
        page.locator('#bs-settings-close').click()
        if platform=='SpotiKit':
            assert page.evaluate('SpotiKit.Player.listenerCount')==3
            page.evaluate('window.__dispose()')
            assert page.locator('#bs-root').count()==0,(platform,'overlay not removed')
            assert page.locator('#bs-style').count()==0,(platform,'style not removed')
            assert page.evaluate('SpotiKit.Player.listenerCount')==0,(platform,'listener leak')
            assert page.locator('[data-plugin-button]').count()==0,(platform,'toolbar leaked')
            page.evaluate('''() => { window.__start(); }''')
            page.wait_for_function("document.querySelector('#bs-root') && window.BratStage",timeout=5000)
            assert page.locator('#bs-root').count()==1,(platform,'restart failure')
        assert not errors,(platform,errors[:4])
        print(platform,'PASS: playback, repeat, timed lyrics, diagnostics'+(', stop/restart' if platform=='SpotiKit' else ''))
        page.close()
    browser.close()

