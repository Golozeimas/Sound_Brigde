function handleHeroSearch(e) {
  if (e.key === 'Enter') doSearch(e.target.value);
}

function quickSearch(q) {
  doSearch(q);
}

function startNewSearch() {
  state.query = '';
  state.results = [];
  state.searchError = '';
  state.activeFilter = 'all';
  navigate('search');
  requestAnimationFrame(() => {
    const input = el('searchPageSearch') || el('heroSearch');
    if (input) input.focus();
  });
}

//Consome API do Itunes para Realizar a busca
async function doSearch(q) {
  if (!q.trim()) return;
  state.query = q.trim();
  state.activeFilter = 'all';
  state.searchError = '';
  state.hasSearched = true;
  navigate('search');
  el('page').innerHTML = '<div class="loading"><div class="spinner"></div> Buscando...</div>';

  const [songs, albums, artists] = await Promise.all([
    searchITunes(q, 'song', 25),
    searchITunes(q, 'album', 15),
    searchITunes(q, 'musicArtist', 10),
  ]);

  if (!songs || !albums || !artists) {
    state.searchError = 'A busca retornou com falhas. Tente novamente.';
  }

  state.results = [...(artists || []), ...(albums || []), ...(songs || [])];
  render();
  preloadArtistArtwork(artists || []);
}

async function preloadArtistArtwork(artists) {
  const missing = artists.filter(item => item && item.artistName && !state.artistArtworkCache[item.artistName]);
  if (!missing.length) return;

  await Promise.all(missing.map(async item => {
    try {
      const results = await searchITunes(item.artistName, 'album', 1);
      const art = results && results[0] && results[0].artworkUrl100;
      if (art) state.artistArtworkCache[item.artistName] = artworkUrl(art, '300x300');
    } catch {
    }
  }));

  if (state.page === 'search' && state.query) render();
}



