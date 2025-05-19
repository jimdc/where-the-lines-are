if (typeof window.appendLoadingDebug === 'function') {
  appendLoadingDebug('dataset-loader.js executing');
}

function handleError(err) {
  console.error('Failed to load dataset.json', err);
  if (typeof window.appendLoadingDebug === 'function') {
    appendLoadingDebug('Error fetching dataset.json: ' + (err.message || err));
  }
  if (typeof window.datasetReject === 'function') {
    window.datasetReject(err);
  }
}

if (location.protocol === 'file:') {
  handleError(new Error('Cannot fetch dataset.json when using file:// protocol'));
} else {
  fetch('dataset.json')
    .then(r => {
      if (typeof window.appendLoadingDebug === 'function') {
        appendLoadingDebug('dataset.json fetched');
      }
      return r.json();
    })
    .then(data => {
      if (typeof window.appendLoadingDebug === 'function') {
        appendLoadingDebug('dataset.json parsed, length ' + (Array.isArray(data) ? data.length : '?'));
      }
      window.dataset = data;
      if (typeof window.datasetResolve === 'function') {
        window.datasetResolve();
      }
    })
    .catch(handleError);
}
