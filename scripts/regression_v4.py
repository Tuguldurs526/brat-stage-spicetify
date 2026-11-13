#!/usr/bin/env python3
"""Browser tests with a fully mocked Spotify Player. No credentials/network needed."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'preview.html').read_text().replace('<script src="bratstage.js"></script>','')
JS=(ROOT/'bratstage.js').read_text()

def initialize(browser, initial=17000, viewport=(1600,900), future=False):
    page=browser.new_page(viewport={'width':viewport[0],'height':viewport[1]})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)+'\n'+str(e.stack)))
    page.goto('about:blank')
    page.evaluate("""() => { const data={};Object.defineProperty(window,'localStorage',{
      configurable:true,value:{getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=String(v)},removeItem:k=>{delete data[k]}}}); }""")
    html=HTML.replace('let position=20200','let position='+str(initial))
    if future: html=html.replace('[00:00.00] green light','[00:06.00] green light')
    page.set_content(html)
    page.add_script_tag(content=JS)
    page.evaluate('window.BratStage.open()')
    page.wait_for_timeout(320)
    return page,errors

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page,errors=initialize(browser)
    assert page.evaluate('window.BratStage.version')=='4.0.0'
    assert page.locator('#bs-dock-track').is_visible(), 'no dock track'
    assert not page.locator('#bs-now').is_visible(), 'main album must be hidden'
    assert page.locator('#bs-root').get_attribute('class').find('bs-display-square')>=0
    assert page.locator('.bs-volume-range').count()==1
    # Mouse play/pause
    before=page.evaluate('Spicetify.Player.isPlaying()')
    page.locator('#bs-toggle').click(force=True)
    assert page.evaluate('Spicetify.Player.isPlaying()')!=before
    page.locator('#bs-toggle').click(force=True)
    # Volume
    page.locator('#bs-volume-range').fill('30')
    assert abs(page.evaluate('Spicetify.Player.getVolume()')-.3)<.01
    # Settings
    page.locator('#bs-settings-btn').click(force=True)
    page.locator('[data-tab="type"]').click()
    field=page.locator('#bs-field-infoPlacement')
    assert field.count()==1
    field.select_option('left')
    page.wait_for_timeout(220)
    assert page.locator('#bs-now').is_visible(), 'left panel switch failed'
    field.select_option('dock')
    assert not page.locator('#bs-now').is_visible()
    page.locator('#bs-field-font').select_option('serif')
    assert 'Georgia' in page.evaluate("getComputedStyle(document.querySelector('.bs-line')).fontFamily")
    page.locator('[data-tab="themes"]').click()
    page.locator('#bs-field-bgPalette').select_option('cinema')
    page.locator('#bs-field-paletteCadence').select_option('two')
    assert page.evaluate('window.BratStage.getSettings().paletteCadence')=='two'
    # YouTube field activates video immediately on Enter. No Save click.
    page.locator('[data-tab="sync"]').click()
    yt=page.locator('#bs-video-url')
    yt.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    yt.press('Enter')
    page.wait_for_timeout(220)
    assert page.evaluate('window.BratStage.getSettings().bgMode')=='video'
    src=page.locator('#bs-bg-video').get_attribute('src')
    assert 'dQw4w9WgXcQ' in src,src
    assert 'cc_load_policy=0' in src,src
    assert page.evaluate('JSON.parse(localStorage.getItem("bratstage:v1:trackVideos"))')[
      'spotify:track:bratstage-demo-001'].endswith('dQw4w9WgXcQ')
    # No direct Save required for paste, programmatic fill is input event.
    yt.fill('https://youtu.be/kJQP7kiw5Fk')
    page.wait_for_timeout(620)
    assert 'kJQP7kiw5Fk' in page.locator('#bs-bg-video').get_attribute('src')
    # Auto-hide and hover
    page.locator('#bs-settings-close').click(force=True)
    page.evaluate('window.BratStage.getSettings().hideControls')
    page.wait_for_timeout(3000)
    assert page.locator('#bs-root').evaluate('(r)=>r.classList.contains("bs-ui-hidden")')
    page.mouse.move(800,780)
    page.wait_for_timeout(200)
    assert not page.locator('#bs-root').evaluate('(r)=>r.classList.contains("bs-ui-hidden")')
    # Responsive dock not placed flush with bottom of Spotify window
    dock=page.locator('#bs-root .bs-footer').bounding_box()
    assert dock['y']+dock['height'] < 860, dock
    # Rebuild v4 default snapshot for artifact
    (ROOT/'screenshots').mkdir(exist_ok=True)
    page.screenshot(path=str(ROOT/'screenshots/player.png'))
    assert not errors, errors
    print('PASS: mouse, volume, settings layout, typography, palette cadence, live YouTube Enter/input, captions URL, hover dock, responsive offset')
    page.close()
    # Before first lyric timestamp -> entirely blank, no ghost or grey future line
    early,errs=initialize(browser,initial=1000,future=True)
    early.wait_for_timeout(220)
    assert early.locator('#bs-line-list').evaluate('(e)=>e.textContent.trim()')=='', repr(early.locator('#bs-line-list').inner_text())
    assert early.locator('.bs-line').count()==0
    assert not errs, errs
    print('PASS: no early lyric previews')
    early.close()
    # Narrow/short window dock should be onscreen and away from window edge
    narrow,errs=initialize(browser,viewport=(860,650))
    d=narrow.locator('#bs-root .bs-footer').bounding_box()
    assert d['y']>=0 and d['y']+d['height']<=620,d
    print('PASS: narrow window dock geometry',d)
    assert not errs,errs
    narrow.close()
    browser.close()
