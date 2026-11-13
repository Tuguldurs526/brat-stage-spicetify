/* BratStage Core 3.0.0 — MIT. Framework-independent helpers. */
var BratStageCore = (() => {
  'use strict';
  const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
  const time = (ms) => {
    const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const normalized = (s) => String(s || '').toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\((?:feat\.?|ft\.?|with|remaster|deluxe|live).*?\)/gi, '')
    .replace(/\[(?:feat\.?|ft\.?|remaster|live).*?\]/gi, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const timestamp = (m, s) => (Number(m) * 60 + Number(s)) * 1000;

  function parseLRC(input) {
    const text = String(input || '').replace(/\r\n?/g, '\n');
    const offsetMatch = text.match(/^\[offset:\s*([+-]?\d+)\s*\]/im);
    const offset = offsetMatch ? Number(offsetMatch[1]) : 0;
    const result = [];
    for (const line of text.split('\n')) {
      const tags = [...line.matchAll(/\[(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)\]/g)];
      if (!tags.length) continue;
      const body = line.replace(/\[\d{1,3}:\d{1,2}(?:\.\d{1,3})?\]/g, '').trim();
      if (!body && !/<\d+:\d/.test(line)) continue;
      const words = [];
      const wordTags = [...body.matchAll(/<(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)>/g)];
      let plain = body;
      if (wordTags.length) {
        plain = '';
        for (let i = 0; i < wordTags.length; i++) {
          const hit = wordTags[i];
          const start = hit.index + hit[0].length;
          const end = i + 1 < wordTags.length ? wordTags[i + 1].index : body.length;
          const w = body.slice(start, end);
          plain += w;
          if (w) words.push({ at: Math.max(0, Math.round(timestamp(hit[1], hit[2]) + offset)), text: w });
        }
      }
      const content = plain.trim() || '♪';
      for (const tag of tags) {
        result.push({ at: Math.max(0, Math.round(timestamp(tag[1], tag[2]) + offset)),
          text: content, words: wordTags.length === 1 && tags.length > 1 ? [] : words });
      }
    }
    result.sort((a, b) => a.at - b.at);
    return result.filter((x, i) => i === 0 || x.at !== result[i - 1].at || x.text !== result[i - 1].text);
  }

  function plainToLines(input) {
    return String(input || '').replace(/\r\n?/g, '\n').split('\n')
      .map(s => s.trim()).filter(Boolean).map(text => ({ at: null, text, words: [] }));
  }

  function currentIndex(lines, timeMs) {
    if (!lines.length || lines[0].at === null) return -1;
    let lo = 0, hi = lines.length - 1, answer = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (lines[m].at <= timeMs) { answer = m; lo = m + 1; }
      else hi = m - 1;
    }
    return answer;
  }

  function visibleRange(length, current, count) {
    if (!length) return { start: 0, end: 0 };
    count = Math.round(clamp(count, 1, 15));
    const maxStart = Math.max(0, length - count);
    const start = clamp((current < 0 ? 0 : current) - Math.floor((count - 1) / 2), 0, maxStart);
    return { start, end: Math.min(length, start + count) };
  }

  function chooseMatch(records, track) {
    if (!Array.isArray(records)) return null;
    const targetName = normalized(track.name), targetArtist = normalized(track.artist);
    const duration = Number(track.duration || 0) / 1000;
    return records.map((r) => {
      const title = normalized(r.trackName || r.name);
      const artist = normalized(r.artistName);
      let score = title === targetName ? 100 : (title.includes(targetName) || targetName.includes(title)) && title ? 40 : -25;
      score += artist === targetArtist ? 65 : artist.includes(targetArtist.split(' ')[0]) ? 18 : -20;
      if (duration && r.duration) score += Math.max(-55, 35 - Math.abs(duration - r.duration) * 12);
      if (r.syncedLyrics) score += 15;
      return { r, score };
    }).sort((a, b) => b.score - a.score).filter(x => x.score >= 75)[0]?.r || null;
  }

  function videoId(input) {
    if (!input) return null;
    const raw = String(input).trim();
    if (/^[\w-]{11}$/.test(raw)) return raw;
    try {
      const u = new URL(raw);
      const host = u.hostname.toLowerCase();
      if (host === 'youtu.be') return /^[\w-]{11}$/.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
      if (!['www.youtube.com', 'youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host)) return null;
      const id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1];
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  }
  function hexRgb(hex) {
    const v = String(hex || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(v)) return '150, 225, 28';
    return [1,3,5].map(i => parseInt(v.slice(i, i + 2), 16)).join(', ');
  }
  function rgbHex(r,g,b){return '#'+[r,g,b].map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('');}
  function mixHex(a,b,amount){
    const decode=x=>/^#[a-f0-9]{6}$/i.test(x||'')?[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)):[0,0,0];
    const x=decode(a),y=decode(b),t=clamp(amount,0,1);
    return rgbHex(...x.map((n,i)=>n+(y[i]-n)*t));
  }
  function chooseOfficialVideo(records,track){
    if(!Array.isArray(records)||!track)return null;
    const artist=normalized(track.artist),name=normalized(track.name);
    const candidates=records.map(item=>{
      const title=normalized(item.snippet?.title),channel=normalized(item.snippet?.channelTitle);
      const originalTitle=String(item.snippet?.title||'').toLowerCase();
      if(!name||!artist||!title.includes(name)||!title.includes(artist))return null;
      if(/\b(cover|reaction|fan made|fanmade|live|remix|nightcore|slowed|sped up|karaoke|lyrics?|audio only|visualizer|instrumental|tutorial)\b/i.test(originalTitle))return null;
      const confirmedChannel=channel.includes(artist)||channel.includes(artist.replace(/ /g,''));
      const explicit=/\b(official (music )?video|official mv)\b/i.test(originalTitle);
      const vevo=channel.includes('vevo') && confirmedChannel;
      const score=(confirmedChannel?80:0)+(explicit?60:0)+(vevo?25:0)
        -(originalTitle.includes('feat')?5:0);
      const id=item.id?.videoId || item.id;
      return /^[\w-]{11}$/.test(id||'') && score>=120 ? {id,score,channel:item.snippet.channelTitle,title:item.snippet.title}:null;
    }).filter(Boolean).sort((a,b)=>b.score-a.score);
    return candidates[0]||null;
  }

  // TTML timing is in the source recording's clock, *not* inferred from tempo.
  function ttmlTime(value) {
    if(value==null || value==='') return null;
    const raw=String(value).trim();
    if (/^\d+(?:\.\d+)?ms$/.test(raw)) return Math.round(parseFloat(raw));
    if (/^\d+(?:\.\d+)?s$/.test(raw)) return Math.round(parseFloat(raw)*1000);
    if (!/^\d+(?::\d+){0,2}(?:\.\d+)?$/.test(raw)) return null;
    const numbers=raw.split(':').map(Number);
    return Math.round(numbers.reduce((acc,n)=>acc*60+n,0)*1000);
  }
  function xmlDecode(str) {
    return String(str||'').replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi,(full,x)=> {
      const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
      if(named[x.toLowerCase()])return named[x.toLowerCase()];
      const n=x[0]==='#'?(x[1].toLowerCase()==='x'?parseInt(x.slice(2),16):parseInt(x.slice(1),10)):0;
      return n>0&&n<=0x10ffff?String.fromCodePoint(n):full;
    });
  }
  function parseTTML(input) {
    const xml=String(input||'');
    if(!xml.includes('<p') && !/<[a-z0-9]+:p\b/i.test(xml))return [];
    if(xml.length>2_000_000)return [];
    const result=[];
    if(typeof DOMParser!=='undefined') {
      const doc=new DOMParser().parseFromString(xml,'application/xml');
      if(doc.querySelector('parsererror'))return [];
      const paragraphs=[...doc.getElementsByTagName('*')].filter(x=>x.localName==='p');
      for(const p of paragraphs){
        const at=ttmlTime(p.getAttribute('begin'));
        const end=ttmlTime(p.getAttribute('end'));
        if(at===null)continue;
        const words=[];
        function visit(node){
          for(const child of node.childNodes){
            if(child.nodeType!==1)continue;
            const begin=child.getAttribute('begin');
            const wAt=ttmlTime(begin);
            if(child.localName==='span'&&wAt!==null){
              const txt=child.textContent||'';
              if(txt.trim()) words.push({at:wAt,end:ttmlTime(child.getAttribute('end')),text:txt});
            }else visit(child);
          }
        }
        visit(p);
        const plain=(p.textContent||'').replace(/\s+/g,' ').trim();
        if(plain)result.push({at,end,text:plain,words,precision:words.length>1?'word':'line'});
      }
    }else{
      // Portable fallback for the flat TTML documents used in unit tests.
      const attr=(attrs,key)=>attrs.match(new RegExp('(?:^|\\s)'+key+'="([^"]+)"'))?.[1]||null;
      for(const p of xml.matchAll(/<(?:\w+:)?p\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?p>/g)){
        const at=ttmlTime(attr(p[1],'begin'));if(at===null)continue;
        const words=[];
        for(const w of p[2].matchAll(/<(?:\w+:)?span\b([^>]*)>([^<]*)<\/(?:\w+:)?span>/g)){
          const start=ttmlTime(attr(w[1],'begin'));
          if(start!==null&&w[2].trim())words.push({at:start,end:ttmlTime(attr(w[1],'end')),text:xmlDecode(w[2])});
        }
        const text=xmlDecode(p[2].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim());
        if(text)result.push({at,end:ttmlTime(attr(p[1],'end')),text,words,precision:words.length>1?'word':'line'});
      }
    }
    return result.filter(x=>Number.isFinite(x.at)).sort((a,b)=>a.at-b.at);
  }
  // This is deliberately labelled estimated. No line-only data can establish
  // the exact onset of a spoken word without additional acoustic alignment.
  function estimateWordTimings(line, nextAt, durationMs) {
    const parts=String(line.text||'').match(/\S+\s*/gu)||[];
    if(!parts.length || !Number.isFinite(line.at)) return [];
    const safeEnd=Number.isFinite(nextAt)&&nextAt>line.at?nextAt:Math.min(durationMs||Infinity,line.at+5200);
    const available=clamp(safeEnd-line.at-100,300,12500);
    const weights=parts.map(t=>Math.max(.8,Math.sqrt(t.trim().length))+( /[.!?,;:]\s*$/.test(t)?0.6:0));
    const total=weights.reduce((a,b)=>a+b,0);
    let elapsed=0;
    return parts.map((text,i)=>{
      const at=Math.round(line.at+elapsed);
      elapsed+=available*weights[i]/total;
      return {text,at,end:Math.round(line.at+elapsed),estimated:true};
    });
  }
  function phrasePalette(bg,accent,fg,index,mode='wash') {
    if(mode==='off'||index<0)return {bg,fg};
    if(mode==='flip' && (index%4===3))return {bg:fg,fg:bg};
    const sequence=[0,.19,.35,.12,.44,.27];
    return {bg:mixHex(bg,accent,sequence[index%sequence.length]),fg};
  }

  // Carefully curated, contrasting palette pairs. These colors are original.
  // Using a stable hash prevents colors from changing during a seek or re-render.
  const CINEMA_PALETTES = [
    ['#91d52e','#121a09'],['#111523','#f8ebf2'],['#f5accb','#301025'],
    ['#f9d98c','#382111'],['#0e3540','#e1fff7'],['#ebeadf','#1d2326'],
    ['#46255c','#f7e2ff'],['#103a2c','#f4e7a2'],['#ef6b6b','#220c18'],
    ['#d7e5ff','#19223d'],['#30221b','#f7d5b0'],['#dbadff','#24143f'],
    ['#f5eccb','#3c2819'],['#172f63','#dce9ff'],['#e3a26c','#30191c'],
    ['#21152d','#ffb9d4'],['#d8f3e4','#123d34'],['#663d35','#fff1dd'],
    ['#9dd6e1','#102b33'],['#f9e6f2','#411a41'],['#2b3150','#f6dca9'],
    ['#f8c9a5','#322026'],['#29594c','#f7f4cc'],['#ece4ff','#292052'],
    ['#f8a8a1','#4b171d'],['#10191b','#a1f4e0'],['#fccd64','#3f2410'],
    ['#1c1230','#dbffb6'],['#d0e1ad','#243a22'],['#3d173a','#ffd1ef'],
    ['#f4d5da','#352c4b'],['#142d43','#bfe8f4']
  ];
  function luminance(hex) {
    const vals = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
    const [r,g,b] = vals.map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
    return .2126*r+.7152*g+.0722*b;
  }
  function contrast(a,b){ const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
  function readableText(bg,preferred) {
    if(/^#[0-9a-f]{6}$/i.test(preferred||'') && contrast(bg,preferred)>=4.5)return preferred;
    return contrast(bg,'#000000') >= contrast(bg,'#ffffff') ? '#000000' : '#ffffff';
  }
  function hashString(value) {
    let n=2166136261;
    for(const ch of String(value||'')){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}
    return n>>>0;
  }
  function paletteIndex(line,cadence,seed) {
    if(line<0)return 0;
    if(cadence==='two')return Math.floor(line/2);
    if(cadence==='three')return Math.floor(line/3);
    if(cadence==='varied'){
      let group=0,pos=0;
      while(pos<=line){pos+=1+((hashString(seed+':'+group)%3));if(pos<=line)group++;}
      return group;
    }
    return line;
  }
  function cinematicPalette(trackId,group) {
    const len=CINEMA_PALETTES.length;
    const seed=hashString(trackId);
    // A stride that cycles every color before repeating.
    const idx=(seed+(group*13))%len;
    const [bg,fg]=CINEMA_PALETTES[idx];
    return {bg,fg:contrast(bg,fg)>=4.5?fg:readableText(bg,fg),accent:fg,index:idx};
  }
  function albumLinePalette(pal,group) {
    const bg=pal?.bg||'#91d52e', accent=pal?.accent||'#caff72';
    const choices=[mixHex(bg,accent,.08), mixHex(bg,accent,.3),mixHex(bg,'#ffffff',.13),mixHex(bg,'#000000',.24),mixHex(bg,accent,.48)];
    const chosen=choices[((group%choices.length)+choices.length)%choices.length];
    return {bg:chosen,fg:readableText(chosen,pal?.fg),accent};
  }

  return { CINEMA_PALETTES, luminance, contrast, readableText, hashString, paletteIndex, cinematicPalette, albumLinePalette, clamp, time, normalized, parseLRC, plainToLines, currentIndex, visibleRange, chooseMatch, videoId, hexRgb, rgbHex, mixHex, chooseOfficialVideo, ttmlTime, parseTTML, estimateWordTimings, phrasePalette };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BratStageCore;
