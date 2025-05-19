if (typeof window !== 'undefined') {
  window.dataset = dataset;
} else if (typeof globalThis !== 'undefined') {
  globalThis.dataset = dataset;
}
console.log('Dataset loaded:', Array.isArray(dataset) ? dataset.length : 'unknown', 'prompts');
