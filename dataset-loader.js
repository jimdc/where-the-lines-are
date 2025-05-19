fetch('dataset.json')
  .then(r => r.json())
  .then(data => {
    window.dataset = data;
    if (typeof window.datasetResolve === 'function') {
      window.datasetResolve();
    }
  })
  .catch(err => {
    console.error('Failed to load dataset.json', err);
    if (typeof window.datasetReject === 'function') {
      window.datasetReject(err);
    }
  });
