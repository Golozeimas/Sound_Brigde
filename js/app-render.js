function navigate(page, data) {
  state.page = page;
  if (data !== undefined) state.pageData = data;
  document.querySelectorAll('.nav-item[data-page], .mob-nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  render();
}

function render() {
  const pg = el('page');
  const pages = {
    home: renderHome,
    search: renderSearch,
    album: () => renderAlbum(state.pageData),
    library: renderLibrary,
  };
  const view = pages[state.page] || renderHome;
  pg.innerHTML = view();
  if (state.page === 'home') loadFeatured();
}

function renderHome() {
  return `
  <div class="hero">
    <h1>O que vamos ouvir hoje?</h1>
    <p>Explore milhões de faixas em alta fidelidade no ${BRAND}.</p>
    <div class="hero-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="heroSearch" placeholder="Pesquisar por músicas, artistas, álbuns..." onkeydown="handleHeroSearch(event)">
    </div>
    <div class="quick-tags">
      <span class="quick-tag" onclick="quickSearch('Rock Progressivo')">Rock Progressivo</span>
      <span class="quick-tag" onclick="quickSearch('Synthwave')">Synthwave</span>
      <span class="quick-tag" onclick="quickSearch('Jazz Fusion')">Jazz Fusion</span>
      <span class="quick-tag" onclick="quickSearch('Lo-fi Hip Hop')">Lo-fi Hip Hop</span>
    </div>
  </div>
  <div id="featuredSection">
    <div class="loading"><div class="spinner"></div> Carregando...</div>
  </div>`;
}

async function loadFeatured() {
  const sec = el('featuredSection');
  if (!sec) return;
  const terms = ['The Beatles', 'Daft Punk', 'Radiohead', 'Miles Davis'];
  const sections = await Promise.all(
    terms.map(async term => ({ term, items: await searchITunes(term, 'album', 4) }))
  );
  sec.innerHTML = sections
    .filter(({ items }) => items && items.length)
    .map(({ term, items }) => `
      <div class="section-header">
        <span class="section-title">${term}</span>
        <span class="see-all" onclick="quickSearch('${term}')">Ver tudo →</span>
      </div>
      <div class="cards-grid">${items.map(cardHTML).join('')}</div>
    `)
    .join('') || '<p style="color:var(--text3);padding:20px">Sem conteúdo.</p>';
}

function cardHTML(item) {
  const art = artworkUrl(item.artworkUrl100, '300x300');
  const name = item.collectionName || item.trackName || '—';
  const sub = item.artistName || '—';
  return `
  <div class="card" onclick="openItem(${inlineJSON(item)})">
    <div class="card-art">
      ${art ? `<img src="${art}" alt="" loading="lazy">` : `<div class="card-art-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`}
      <div class="play-overlay"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
    </div>
    <div class="card-name" title="${name}">${name}</div>
    <div class="card-sub">${sub}</div>
  </div>`;
}

function renderSearch() {
  const q = state.query;
  if (!q) return `
  <div class="search-page">
    <div class="hero" style="padding:56px 0 36px">
      <h1>Pesquisar</h1>
      <p>Encontre músicas, álbuns e artistas no SoundBrigde.</p>
      <div class="hero-search" style="margin-top:24px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="searchPageSearch" placeholder="Pesquisar por músicas, artistas, álbuns..." onkeydown="handleHeroSearch(event)">
      </div>
      <div class="quick-tags">
        <span class="quick-tag" onclick="quickSearch('Rock Progressivo')">Rock Progressivo</span>
        <span class="quick-tag" onclick="quickSearch('Synthwave')">Synthwave</span>
        <span class="quick-tag" onclick="quickSearch('Jazz Fusion')">Jazz Fusion</span>
        <span class="quick-tag" onclick="quickSearch('Lo-fi Hip Hop')">Lo-fi Hip Hop</span>
      </div>
    </div>
  </div>`;

  const r = filterExplicitItems(state.results);
  const albums = r.filter(x => x.wrapperType === 'collection' || x.collectionType === 'Album');
  const tracks = r.filter(isTrackItem);
  const artists = r.filter(x => x.wrapperType === 'artist' || x.artistType === 'Artist');
  const cur = state.activeFilter;

  return `
  <div class="search-page">
    <div class="search-results-header">
      <div class="search-results-meta">
        <span>Resultados para <b>"${q}"</b></span>
        <span class="result-count">${r.length} encontrados</span>
      </div>
      <button class="search-btn search-btn-ghost" onclick="startNewSearch()">Nova pesquisa</button>
    </div>
    ${state.searchError ? `<div class="loading" style="justify-content:flex-start;padding:12px 0 20px;color:var(--red)">${state.searchError}</div>` : ''}
    <div class="filter-tabs">
      <button class="filter-tab ${cur==='all'?'active':''}" onclick="setFilter('all')">Todos</button>
      <button class="filter-tab ${cur==='artists'?'active':''}" onclick="setFilter('artists')">Artistas</button>
      <button class="filter-tab ${cur==='albums'?'active':''}" onclick="setFilter('albums')">Álbuns</button>
      <button class="filter-tab ${cur==='tracks'?'active':''}" onclick="setFilter('tracks')">Músicas</button>
      <button class="filter-tab ${state.allowExplicit ? 'active' : ''}" onclick="toggleExplicitContent()">Explícitos</button>
    </div>
    ${(cur === 'all' || cur === 'artists') && artists.length ? `
    <div class="section-header"><span class="section-title">Artistas</span></div>
    <div class="cards-grid">${artists.slice(0,8).map(artistCardHTML).join('')}</div>` : ''}
    ${(cur === 'all' || cur === 'albums') && albums.length ? `
    <div class="section-header"><span class="section-title">Álbuns</span></div>
    <div class="cards-grid">${albums.slice(0,8).map(cardHTML).join('')}</div>` : ''}
    ${(cur === 'all' || cur === 'tracks') && tracks.length ? `
    <div class="section-header" style="margin-top:28px"><span class="section-title">Músicas</span></div>
    <div class="track-list">${tracks.slice(0,20).map((t,i) => trackItemHTML(t, i, tracks)).join('')}</div>` : ''}
    ${!albums.length && !tracks.length ? `
    <div class="search-empty" style="padding-top:40px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>Nenhum resultado encontrado para "${q}"</p>
    </div>` : ''}
  </div>`;
}

function setFilter(f) {
  state.activeFilter = f;
  el('page').innerHTML = renderSearch();
}

function toggleExplicitContent() {
  state.allowExplicit = !state.allowExplicit;
  el('page').innerHTML = renderSearch();
}

function trackItemHTML(track, idx, list) {
  const art = artworkUrl(track.artworkUrl100, '60x60');
  const isFav = isFavorite(track);
  const isPlay = state.currentTrack && state.currentTrack.trackId === track.trackId;
  const dur = track.trackTimeMillis ? msToTime(track.trackTimeMillis) : '--';
  return `
  <div class="track-item ${isPlay ? 'playing' : ''}" onclick="playTrack(${idx}, ${inlineJSON(list)})">
    <div class="track-num">
      ${isPlay && state.isPlaying ? '<div class="eq-bars"><span></span><span></span><span></span></div>' : `<span>${idx+1}</span>`}
    </div>
    <div class="track-art">${art ? `<img src="${art}" alt="" loading="lazy">` : ''}</div>
    <div class="track-info">
      <div class="track-name">${track.trackName||'—'}</div>
      <div class="track-artist">${track.artistName||'—'}</div>
    </div>
    <div class="track-actions">
      ${track.trackPrice ? `<span class="track-price">${formatBRL(track.trackPrice)}</span>` : ''}
      <span class="track-duration">${dur}</span>
      <button class="track-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav(${inlineJSON(track)})">
        <svg viewBox="0 0 24 24" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <button class="track-fav" onclick="event.stopPropagation();suggestToRadio(${inlineJSON(track)})" title="Sugerir para a rádio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6"/><path d="M12 8v4l3 2"/><path d="M4 12H2"/><path d="M22 12h-2"/></svg>
      </button>
    </div>
  </div>`;
}

function artistCardHTML(item) {
  const name = item.artistName || '—';
  const genre = item.primaryGenreName || 'Artista';
  const art = getArtistArtwork(item);
  return `
  <div class="card" onclick="doSearch(${inlineJSON(name)})">
    <div class="card-art">
      ${art
        ? `<img src="${art}" alt="${name}" loading="lazy">`
        : `<div class="card-art-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 14a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>
          </div>`}
      <div class="play-overlay"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>
    </div>
    <div class="card-name" title="${name}">${name}</div>
    <div class="card-sub">${genre}</div>
  </div>`;
}

function renderAlbum(album) {
  if (!album) return '<div class="loading"><div class="spinner"></div></div>';
  const art = artworkUrl(album.artworkUrl100, '600x600');
  const tracks = filterExplicitItems(album.tracks || []);
  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : '';
  const genre = album.collectionGenreName || album.primaryGenreName || '';
  const totalDuration = tracks.reduce((sum, track) => sum + (track.trackTimeMillis || 0), 0);
  const price = album.collectionPrice ? formatBRL(album.collectionPrice) : '';

  return `
  <div class="album-header">
    <div class="album-art">${art ? `<img src="${art}" alt="">` : ''}</div>
    <div class="album-meta">
      <div class="album-badge">Featured Album</div>
      <h1 class="album-title">${album.collectionName || '—'}</h1>
      <div class="album-sub">
        ${album.artistName || ''}
        ${genre ? `<span>•</span> ${genre}` : ''}
        ${year ? `<span>•</span> ${year}` : ''}
        ${tracks.length ? `<span>•</span> ${tracks.length} Tracks` : ''}
        ${totalDuration ? `<span>•</span> ${msToTime(totalDuration)}` : ''}
      </div>
      <div class="album-actions">
        ${price ? `<button class="btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>${price}</button>` : ''}
        <button class="btn-secondary" onclick="playAlbum()" title="Preview">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Preview
        </button>
        <button class="btn-icon" onclick="toggleAlbumFav()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
  </div>
  <div class="tracks-section">
    <div class="section-title" style="margin-bottom:16px">Album Tracks</div>
    <div class="tracks-head">
      <span>#</span><span>TÍTULO</span><span style="text-align:right" class="th-price">PRICE</span><span style="text-align:right">DURAÇÃO</span><span></span>
    </div>
    <div class="track-list">
      ${tracks.length
        ? tracks.map((t, i) => albumTrackHTML(t, i, tracks)).join('')
        : '<div class="loading" style="padding:20px 0"><div class="spinner"></div> Carregando faixas...</div>'}
    </div>
  </div>`;
}

function albumTrackHTML(track, idx, list) {
  const isFav = isFavorite(track);
  const isPlay = state.currentTrack && state.currentTrack.trackId === track.trackId;
  const dur = track.trackTimeMillis ? msToTime(track.trackTimeMillis) : '--';
  const price = track.trackPrice ? formatBRL(track.trackPrice) : '—';
  return `
  <div class="album-track-item ${isPlay ? 'playing' : ''}" onclick="playTrack(${idx}, ${inlineJSON(list)})">
    <div class="tr-num">${isPlay && state.isPlaying ? '<div class="eq-bars"><span></span><span></span><span></span></div>' : idx+1}</div>
    <div class="tr-info">
      <div class="tr-name">${track.trackName||'—'}</div>
      <div class="tr-artist">${track.artistName||'—'}</div>
    </div>
    <div class="tr-price">${price}</div>
    <div class="tr-dur">${dur}</div>
    <div class="tr-fav">
      <button class="track-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav(${inlineJSON(track)})">
        <svg viewBox="0 0 24 24" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <button class="track-fav" onclick="event.stopPropagation();suggestToRadio(${inlineJSON(track)})" title="Sugerir para a rádio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6"/><path d="M12 8v4l3 2"/><path d="M4 12H2"/><path d="M22 12h-2"/></svg>
      </button>
    </div>
  </div>`;
}

function renderLibrary() {
  const favs = state.favorites;
  return `
  <div class="search-page">
    <div class="section-header">
      <span class="section-title">Sua Playlist</span>
      <span class="result-count" style="font-size:11px;color:var(--text3)">${favs.length} músicas</span>
    </div>
    ${favs.length === 0
      ? `<div class="lib-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <p>Nenhuma música na playlist ainda<br><span style="font-size:11px">Curta músicas para salvá-las aqui</span></p>
        </div>`
      : `<div class="track-list">${favs.map((t, i) => trackItemHTML(t, i, favs)).join('')}</div>`
    }
  </div>`;
}

async function openItem(item) {
  if (item.wrapperType === 'artist') {
    doSearch(item.artistName || item.artist || '');
    return;
  }
  if (item.wrapperType === 'track') {
    const list = state.results.filter(isTrackItem);
    const idx = list.findIndex(t => t.trackId === item.trackId);
    playTrack(Math.max(0, idx), list);
    return;
  }
  state.pageData = { ...item, tracks: [] };
  navigate('album', state.pageData);
  const data = await searchITunes('', 'song', 50, item.collectionId);
  if (data) {
    const tracks = filterExplicitItems(
      data.filter(x => x.wrapperType === 'track')
    ).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
    state.pageData.tracks = tracks;
    if (state.page === 'album') render();
  }
}

function playAlbum() {
  const tracks = state.pageData && state.pageData.tracks;
  const visibleTracks = filterExplicitItems(tracks || []);
  if (visibleTracks.length) playTrack(0, visibleTracks);
}
