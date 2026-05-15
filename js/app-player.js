function playTrack(idx, list) {
  if (!list || !list[idx]) return;
  state.queue = list;
  state.queueIndex = idx;
  const track = list[idx];
  state.currentTrack = track;
  updatePlayerUI(track);

  if (track.previewUrl) {
    audio.src = track.previewUrl;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  } else {
    showToast('Preview não disponível para esta faixa');
    setPlaying(false);
  }

  render();
}

function updatePlayerUI(track) {
  el('playerName').textContent = track.trackName || '—';
  el('playerArtist').textContent = track.artistName || '—';
  const artEl = el('playerArt');
  const url = artworkUrl(track.artworkUrl100, '60x60');
  if (url) {
    artEl.src = url;
    artEl.style.display = 'block';
  } else {
    artEl.style.display = 'none';
  }
  const fav = el('playerFav');
  fav.classList.toggle('active', isFavorite(track));
}

function togglePlay() {
  if (!state.currentTrack) {
    showToast('Selecione uma música primeiro');
    return;
  }
  if (audio.paused) {
    audio.play().then(() => setPlaying(true)).catch(() => {});
  } else {
    audio.pause();
    setPlaying(false);
  }
}

function setPlaying(v) {
  state.isPlaying = v;
  const icon = el('playIcon');
  if (v) {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

function nextTrack() {
  const q = state.queue;
  if (!q.length) return;
  let next = state.queueIndex + 1;
  if (state.shuffle) next = Math.floor(Math.random() * q.length);
  if (next >= q.length) next = state.repeat ? 0 : q.length - 1;
  playTrack(next, q);
}

function prevTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const q = state.queue;
  let prev = state.queueIndex - 1;
  if (prev < 0) prev = state.repeat ? q.length - 1 : 0;
  playTrack(prev, q);
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  el('shuffleBtn').classList.toggle('active', state.shuffle);
}

function toggleRepeat() {
  state.repeat = !state.repeat;
  el('repeatBtn').classList.toggle('active', state.repeat);
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  el('progressFill').style.width = pct + '%';
  el('progCur').textContent = secToTime(audio.currentTime);
  el('progTotal').textContent = secToTime(audio.duration);
});

audio.addEventListener('ended', () => {
  if (state.repeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextTrack();
  }
});

audio.addEventListener('play', () => setPlaying(true));
audio.addEventListener('pause', () => setPlaying(false));

function seekTo(e) {
  if (!audio.duration) return;
  const bar = el('progressBar');
  const rect = bar.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
}

function setVolume(v) {
  audio.volume = v / 100;
}