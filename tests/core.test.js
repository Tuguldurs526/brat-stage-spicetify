const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../src/core.js');
test('parses LRC with multiple timestamps', () => {
  const lines = Core.parseLRC('[00:01.50][00:03.70] same lyric\n[00:05.00] next');
  assert.deepEqual(lines.map(x => x.at),[1500,3700,5000]);
  assert.deepEqual(lines.map(x => x.text),['same lyric','same lyric','next']);
});
test('honors file offset, including negative', () => {
  assert.equal(Core.parseLRC('[offset:-100]\n[00:01.00]A')[0].at,900);
  assert.equal(Core.parseLRC('[offset:+100]\n[00:01.00]A')[0].at,1100);
});
test('parses enhanced timestamps without inventing word timing', () => {
  const words = Core.parseLRC('[00:02.00]<00:02.00>feel <00:02.25>alive')[0].words;
  assert.equal(words.length,2);
  assert.equal(words[1].at,2250);
  assert.equal(Core.parseLRC('[00:02.00]feel alive')[0].words.length,0);
});
test('binary searches synced lines', () => {
  const x=Core.parseLRC('[00:05.00] A\n[00:09.00] B');
  assert.equal(Core.currentIndex(x,4999),-1);
  assert.equal(Core.currentIndex(x,5000),0);
  assert.equal(Core.currentIndex(x,9000),1);
});
test('visible window is bounded and exact', () => {
  assert.deepEqual(Core.visibleRange(20,10,5),{start:8,end:13});
  assert.deepEqual(Core.visibleRange(3,2,9),{start:0,end:3});
});
test('rejects non-YouTube links and extracts valid IDs', () => {
  assert.equal(Core.videoId('https://youtu.be/dQw4w9WgXcQ'),'dQw4w9WgXcQ');
  assert.equal(Core.videoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),'dQw4w9WgXcQ');
  assert.equal(Core.videoId('https://example.com/watch?v=dQw4w9WgXcQ'),null);
});
test('lyric search preference favors matching title and artist', () => {
  const x=Core.chooseMatch([{trackName:'Other',artistName:'X',syncedLyrics:'A'},{trackName:'Blue Sky',artistName:'Artist',syncedLyrics:'B'}],{name:'Blue Sky',artist:'Artist',duration:200000});
  assert.equal(x.syncedLyrics,'B');
});

test('hex color mixing is clamped and predictable', () => {
  assert.equal(Core.mixHex('#000000','#ffffff',0),'#000000');
  assert.equal(Core.mixHex('#000000','#ffffff',1),'#ffffff');
  assert.equal(Core.mixHex('#000000','#ffffff',0.5),'#808080');
});
test('official video matcher rejects lyric and fan videos', () => {
  const track={name:'Afterglow',artist:'Neon Band'};
  const search=[
    {id:{videoId:'aaaaaaaaaaa'},snippet:{title:'Neon Band - Afterglow (Lyrics)',channelTitle:'Neon Band VEVO'}},
    {id:{videoId:'bbbbbbbbbbb'},snippet:{title:'Neon Band - Afterglow (Official Music Video)',channelTitle:'NeonBandVEVO'}},
    {id:{videoId:'ccccccccccc'},snippet:{title:'Neon Band - Afterglow official music video',channelTitle:'Random Uploads'}}
  ];
  assert.equal(Core.chooseOfficialVideo(search,track).id,'bbbbbbbbbbb');
  assert.equal(Core.chooseOfficialVideo([search[0],search[2]],track),null);
});
test('parses TTML paragraph timing and word timestamps without guessing', () => {
  const lines = Core.parseTTML('<?xml version="1.0"?><tt xmlns="http://www.w3.org/ns/ttml"><body><div><p begin="00:00:13.500" end="00:00:18.000"><span begin="00:00:13.500" end="00:00:14.000">watch </span><span begin="00:00:14.000" end="00:00:14.700">the </span><span begin="00:00:14.700" end="00:00:15.200">sky</span></p></div></body></tt>');
  assert.equal(lines.length,1);
  assert.equal(lines[0].at,13500);
  assert.equal(lines[0].end,18000);
  assert.equal(lines[0].words.length,3);
  assert.equal(lines[0].words[1].at,14000);
  assert.equal(lines[0].precision,'word');
});
test('timecode supports HH:MM:SS, M:SS, and milliseconds', () => {
  assert.equal(Core.ttmlTime('1:02:03.500'),3723500);
  assert.equal(Core.ttmlTime('2:03.125'),123125);
  assert.equal(Core.ttmlTime('1500ms'),1500);
  assert.equal(Core.ttmlTime('not time'),null);
});
test('line-only word estimation is flagged and bound by next line', () => {
  const words=Core.estimateWordTimings({at:10000,text:'watch the lights change'},13500,100000);
  assert.equal(words.length,4);
  assert.ok(words.every(x=>x.estimated));
  assert.ok(words[0].at>=10000);
  assert.ok(words.at(-1).end<=13500);
  assert.ok(words[0].at<words[1].at);
});
test('phrase color is stable for each line and independent of BPM', () => {
  const a=Core.phrasePalette('#8ace27','#c7ff63','#11150b',3,'wash');
  const b=Core.phrasePalette('#8ace27','#c7ff63','#11150b',3,'wash');
  assert.deepEqual(a,b);
  assert.equal(Core.phrasePalette('#8ace27','#c7ff63','#11150b',2,'off').bg,'#8ace27');
});
