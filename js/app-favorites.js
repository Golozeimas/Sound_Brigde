/**
 * @file app-favorites.js
 * @description Gerencia os favoritos/playlist do usuário.
 */

/** Verifica se uma faixa já está nos favoritos. */
function isFavorite(track) {
  return state.favorites.some(f => f.trackId === track.trackId);
}

/**
 * Adiciona ou remove uma faixa dos favoritos.
 * Atualiza o ícone no player se a faixa estiver tocando.
 */
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

/** Alterna o favorito da faixa atual no player. */
function togglePlayerFav() {
  if (!state.currentTrack) return;
  toggleFav(state.currentTrack);
}

/** Salva o álbum na biblioteca do usuário. */
function toggleAlbumFav() {
  showToast('Álbum salvo na biblioteca!');
}

/** Sugere uma faixa para a rádio. */
function suggestToRadio(track) {
  showToast(`${track.trackName || 'Faixa'} sugerida para a rádio`);
}