/* BRAT/STAGE v5 — native SpotiKit adapter.
 * The shared view and lyric engine use this small compatibility surface.
 * No Spicetify compatibility switch or Spicetify global is required.
 */
function createSpotiKitAdapter(kit, context) {
  if (!kit?.Player) throw new Error('SpotiKit.Player is unavailable');
  const p = kit.Player;
  const eventSubscriptions = new Map();
  const modeToNumber = mode => mode === 'track' ? 2 : mode === 'context' ? 1 : 0;
  const numberToMode = mode => Number(mode) === 2 ? 'track' : Number(mode) === 1 ? 'context' : 'off';
  const artistNames = track => (track?.artists || []).map(x=>x?.name).filter(Boolean).join(', ');
  const coverUrl = track => {
    const options = [track?.images?.[0],track?.album?.images?.[0],track?.image,track?.album?.image];
    for (const option of options) {
      const url = typeof option === 'string' ? option : option?.url;
      if (url) return url;
    }
    return track?.metadata?.image_url || '';
  };
  const stateItem = () => {
    const t = p.track || p.state?.item;
    if (!t) return null;
    const name = t.name || t.metadata?.title || 'Unknown track';
    const artist = artistNames(t) || t.metadata?.artist_name || 'Unknown artist';
    const cover = coverUrl(t);
    return {
      ...t,
      uri: t.uri || t.metadata?.uri || '',
      name,
      album: t.album || {name: t.metadata?.album_title || 'Single'},
      artists: t.artists || [{name: artist}],
      metadata: {...(t.metadata||{}),title:name,artist_name:artist,
        image_url: cover,album_title: t.album?.name || t.metadata?.album_title || 'Single'}
    };
  };
  const Player = {
    get data() { return {item:stateItem()}; },
    getProgress: () => Number(p.position || 0),
    getDuration: () => Number(p.duration || 0),
    isPlaying: () => Boolean(p.isPlaying),
    getVolume: () => Number(p.volume ?? 0),
    getMute: () => Boolean(p.muted),
    getRepeat: () => modeToNumber(p.repeat),
    play: () => p.play(),
    pause: () => p.pause(),
    togglePlay: () => p.toggle(),
    next: () => p.next(),
    back: () => p.previous(),
    seek: ms => p.seek(ms),
    setVolume: level => p.setVolume(level),
    toggleMute: () => p.setMuted(!p.muted),
    setRepeat: number => p.setRepeat(numberToMode(number)),
    addEventListener(event, handler) {
      const mapping = {songchange:'track',onplaypause:'playpause',onprogress:'progress'};
      const type = mapping[event];
      if (!type) return;
      p.on(type,handler);
      eventSubscriptions.set(handler,{type,handler});
    },
    removeEventListener(event, handler) {
      const existing = eventSubscriptions.get(handler);
      if (existing) {
        p.off(existing.type,handler);
        eventSubscriptions.delete(handler);
      }
    }
  };
  const LocalStorage = {
    get(key) {
      try {
        const local = window.localStorage.getItem(key);
        if (local !== null) return local;
      } catch {}
      try { return kit.Storage?.get(key,null) ?? null; } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key,String(value)); } catch {}
      try { kit.Storage?.set(key,String(value)); } catch {}
    },
    remove(key) {
      try { window.localStorage.removeItem(key); } catch {}
      try { kit.Storage?.remove(key); } catch {}
    }
  };
  const Playbar = {Button: class {
    constructor(label,_svg,onClick) {
      // SpotiKit accepts named icons and automatically removes these buttons on stop.
      const button=kit.Playbar.add({label,icon:'music',onClick});
      return button;
    }
  }};
  const Topbar = {Button: class {
    constructor(label,_svg,onClick) {
      return kit.Topbar.add({label,icon:'maximize',onClick,side:'right'});
    }
  }};
  return {
    Player,Platform:{},LocalStorage,Playbar,Topbar,
    showNotification: message => kit.notify?.(message),
    // Some builds expose additional analysis through legacy compatibility only.
    // Never fabricate beat timestamps for a native SpotiKit session.
  };
}
