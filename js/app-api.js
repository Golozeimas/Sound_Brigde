let cbCount = 0;

function jsonpFetch(url) {
  return new Promise((resolve, reject) => {
    const cbName = `_itunes_cb_${cbCount++}`;
    const finalUrl = url.replace('itunesCallback', cbName);
    const s = document.createElement('script');
    const cleanup = () => {
      delete window[cbName];
      s.remove();
    };

    window[cbName] = data => {
      cleanup();
      resolve(data);
    };

    s.src = finalUrl;
    s.onerror = () => {
      cleanup();
      reject(new Error('JSONP error'));
    };
    document.body.appendChild(s);
  });
}

async function searchITunes(term, entity = 'allArtist', limit = 20, collectionId = null) {
  try {
    const url = collectionId
      ? `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=50&callback=itunesCallback`
      : `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=${limit}&country=br&callback=itunesCallback`;
    const data = await jsonpFetch(url);
    return data.results || [];
  } catch (e) {
    console.error(e);
    return null;
  }
}
