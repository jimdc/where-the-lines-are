if (typeof window.appendLoadingDebug === 'function') {
  appendLoadingDebug('Step 3/5: dataset-loader.js executing (protocol ' + location.protocol + ')');
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
  appendLoadingDebug('Step 4/5: Loading dataset.js');
  const script = document.createElement('script');
  script.src = 'dataset.js';
  script.onload = () => {
    if (typeof window.appendLoadingDebug === 'function') {
      const len = Array.isArray(dataset) ? dataset.length : '?';
      appendLoadingDebug('Step 5/5: dataset.js loaded, length ' + len);
    }
    window.dataset = dataset;
    if (typeof window.datasetResolve === 'function') {
      window.datasetResolve();
    }
  };
  script.onerror = err => {
    handleError(err);
  };
  document.head.appendChild(script);
} else {
  appendLoadingDebug('Step 4/5: Fetching dataset.json');
  fetch('dataset.json')
    .then(r => {
      if (typeof window.appendLoadingDebug === 'function') {
        appendLoadingDebug('Step 4/5: dataset.json HTTP status ' + r.status);
      }
      if (!r.ok) {
        throw new Error('HTTP ' + r.status + ' ' + r.statusText);
      }
      return r.json();
    })
    .then(data => {
      if (typeof window.appendLoadingDebug === 'function') {
        const len = Array.isArray(data) ? data.length : '?';
        appendLoadingDebug('Step 5/5: dataset.json parsed, length ' + len);
      }
      window.dataset = data;
      if (typeof window.datasetResolve === 'function') {
        window.datasetResolve();
      }
    })
    .catch(handleError);
}
