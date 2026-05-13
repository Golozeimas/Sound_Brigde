function isFavorite(track) {
  return state.favorites.some(f => f.trackId === track.trackId);
}

function toggleFav(track) {
  if (isFavorite(track)) {
    state.favorites = state.favorites.filter(f => f.trackId !== track.trackId);
    showToast('Removido da playlist');
  } else {
    state.favorites.push(track);
    showToast('Adicionado à playlist ♥');
  }

  saveFavorites();

  if (state.currentTrack && state.currentTrack.trackId === track.trackId) {
    el('playerFav').classList.toggle('active', isFavorite(track));
  }

  render();
}

function togglePlayerFav() {
  if (!state.currentTrack) return;
  toggleFav(state.currentTrack);
}

function toggleAlbumFav() {
  showToast('Álbum salvo na biblioteca!');
}

function suggestToRadio(track) {
  showToast(`${track.trackName || 'Faixa'} sugerida para a rádio`);
}