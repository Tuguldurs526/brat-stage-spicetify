const assert=require('node:assert/strict');
const test=require('node:test');
const C=require('../src/core.js');

test('all curated palettes have readable text contrast',()=>{
  assert.equal(C.CINEMA_PALETTES.length,32);
  for(const [bg,fg] of C.CINEMA_PALETTES) assert.ok(C.contrast(bg,fg)>=4.5,`${bg} / ${fg}`);
});
test('palette order is deterministic and track dependent',()=>{
  const a=C.cinematicPalette('spotify:track:alpha',4);
  assert.deepEqual(a,C.cinematicPalette('spotify:track:alpha',4));
  assert.notEqual(a.index,C.cinematicPalette('spotify:track:alpha',5).index);
});
test('line cadence groups do not randomly change on replay',()=>{
  assert.deepEqual([0,1,2,3,4].map(i=>C.paletteIndex(i,'two','abc')),[0,0,1,1,2]);
  assert.deepEqual([0,1,2,3,4,5].map(i=>C.paletteIndex(i,'three','abc')),[0,0,0,1,1,1]);
  const x=[...Array(50)].map((_,i)=>C.paletteIndex(i,'varied','abc'));
  assert.deepEqual(x,[...Array(50)].map((_,i)=>C.paletteIndex(i,'varied','abc')));
});
test('album colors pick contrast-safe readable text',()=>{
  for(let n=0;n<25;n++){
    const p=C.albumLinePalette({bg:'#6b637e',accent:'#d6a699',fg:'#e9ddf6'},n);
    assert.ok(C.contrast(p.bg,p.fg)>=4.5);
  }
});
test('YouTube validation accepts supported links and rejects lookalikes',()=>{
  assert.equal(C.videoId('https://youtu.be/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
  assert.equal(C.videoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),'dQw4w9WgXcQ');
  assert.equal(C.videoId('https://youtube.com.evil.net/watch?v=dQw4w9WgXcQ'),null);
});
