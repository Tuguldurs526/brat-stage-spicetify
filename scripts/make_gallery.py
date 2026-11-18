"""Build honest, browser-rendered promotional screenshots from the actual extension.
Uses simulated playback and original demo lyrics; user-provided real screenshot is copied separately.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import io, json
R=Path(__file__).resolve().parents[1]
S=R/'screenshots'; S.mkdir(exist_ok=True)
html=(R/'preview.html').read_text(encoding='utf8').replace('<script src="bratstage.js"></script>','')
html=html.replace('BRAT/STAGE v4 • Interactive','BRAT/STAGE v5.1 • Interactive')
(R/'preview.html').write_text(html,encoding='utf8')
code=(R/'bratstage.js').read_text(encoding='utf8')
scenarios=[
 ('brat-lime',{'bg':'#9fdd27','fg':'#11180e','accent':'#cdfc68','font':'brutal','fontSize':120,'effect':'grain','lyricDisplay':'square','wordEffect':'brat'},21000,True),
 ('afterhours-velvet',{'bg':'#271026','fg':'#ffd0ed','accent':'#fe7aaf','font':'geometric','fontSize':120,'effect':'vignette','lyricDisplay':'square','wordEffect':'silk'},20800,True),
 ('electric-blue',{'bg':'#0c2135','fg':'#d4f4ff','accent':'#5ee3fb','font':'geometric','fontSize':112,'effect':'vignette','lyricDisplay':'locked','wordEffect':'wipe'},34500,True),
 ('editorial-cream',{'bg':'#eee0cb','fg':'#34241b','accent':'#ad4338','font':'serif','fontSize':118,'effect':'none','lyricDisplay':'square','wordEffect':'brat'},47600,True),
 ('brat-dock-hidden',{'bg':'#9fdd27','fg':'#11180e','accent':'#cdfc68','font':'black','fontSize':120,'effect':'grain','lyricDisplay':'square','wordEffect':'brat'},31500,False),
]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-web-security'])
    def new_demo(cfg, position, dock=True, width=1600,height=900):
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.goto('about:blank')
        page.evaluate('''() => {const data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]}})}''')
        cfg={'theme':'custom','bgPalette':'custom','phraseMode':'off','beatMode':'off','infoPlacement':'dock','lyricsAlign':'center','lyricDisplay':'square','wordMode':'automatic','autoHideMs':10000, 'hideControls':dock,'hideCursor':False, **cfg}
        page.evaluate('''(cfg) => {localStorage.setItem('bratstage:v1:settings',JSON.stringify(cfg));localStorage.setItem('bratstage:v1:migrated-v3','yes');localStorage.setItem('bratstage:v1:migrated-v4','yes')}''',cfg)
        page.set_content(html)
        page.add_script_tag(content=code)
        page.wait_for_function('window.BratStage && document.getElementById("bs-root")',timeout=8000)
        page.evaluate('window.BratStage.open()')
        page.evaluate('(pos) => Spicetify.Player.seek(pos)',position)
        page.wait_for_timeout(330)
        # Locks in a visual setting that the extension itself provides, without modifying rendered HTML.
        return page
    for name,cfg,pos,dock in scenarios:
        page=new_demo(cfg,pos,dock)
        if not dock:
            page.wait_for_timeout(1600)
            page.evaluate('document.getElementById("bs-root").classList.add("bs-ui-hidden")')
        else:
            page.mouse.move(755,805)
            page.wait_for_timeout(170)
        page.screenshot(path=str(S/f'{name}.png'),animations='disabled')
        print('SCREENSHOT',name,(S/f'{name}.png').stat().st_size)
        page.close()
    # Settings panel as real UI, on a dark jewel-color theme.
    p=new_demo({'bg':'#201128','fg':'#f5d8ef','accent':'#fc9bd1','effect':'vignette','lyricDisplay':'locked','fontSize':120},20200,True)
    p.locator('#bs-settings-btn').click(force=True)
    p.wait_for_timeout(550)
    p.screenshot(path=str(S/'settings-themes.png'),animations='disabled')
    for tab,name in [('type','settings-typography.png'),('motion','settings-motion.png'),('background','settings-backdrops.png')]:
        if p.locator(f'[data-tab="{tab}"]').count():
            p.locator(f'[data-tab="{tab}"]').click(force=True)
            p.wait_for_timeout(230)
            p.screenshot(path=str(S/name),animations='disabled')
    p.close()
    # Motion illustration from real word-timed demo, sampled by seeking to successive timestamps.
    # The GIF is a browser capture of the actual renderer, not a synthetic fake app.
    p=new_demo({'bg':'#3d102c','fg':'#ffc3e2','accent':'#fb86ae','effect':'vignette','lyricDisplay':'square','wordEffect':'brat','fontSize':122},18100,False,width=1280,height=720)
    p.evaluate('document.getElementById("bs-root").classList.add("bs-ui-hidden")')
    frames=[]
    for time_ms in [18100,18400,18820,19250,19650,20120,20650,21000]:
        p.evaluate('(v)=>Spicetify.Player.seek(v)',time_ms)
        p.wait_for_timeout(180)
        shot=p.screenshot(animations='disabled')
        img=Image.open(io.BytesIO(shot)).convert('RGB')
        img.thumbnail((960,540))
        frames.append(img.copy())
    frames[0].save(S/'word-reveal-demo.gif',save_all=True,append_images=frames[1:],duration=[260,220,210,210,210,210,260,500],loop=0,optimize=True)
    print('GIF', (S/'word-reveal-demo.gif').stat().st_size)
    p.close()
    browser.close()
