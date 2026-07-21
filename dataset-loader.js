/**
 * Dataset loader for where-the-lines-are.
 *
 * Provides loadRegistry() and loadDataset(jsonPath, jsPath) functions.
 * Supports both file:// (loads .js wrappers) and http(s):// (fetches .json).
 */

function loadRegistry() {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            // file:// — load registry.js which defines window.datasetRegistry
            var script = document.createElement('script');
            script.src = 'datasets/registry.js';
            script.onload = function() {
                if (typeof window.datasetRegistry !== 'undefined') {
                    resolve(window.datasetRegistry);
                } else {
                    reject(new Error('registry.js loaded but datasetRegistry not defined'));
                }
            };
            script.onerror = function() {
                reject(new Error('Failed to load datasets/registry.js'));
            };
            document.head.appendChild(script);
        } else {
            fetch('datasets/registry.json')
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(resolve)
                .catch(reject);
        }
    });
}

function loadXref() {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            var script = document.createElement('script');
            script.src = 'datasets/xref.js';
            script.onload = function() {
                if (typeof window.dataset_xref !== 'undefined') {
                    resolve(window.dataset_xref);
                } else {
                    reject(new Error('xref.js loaded but dataset_xref not defined'));
                }
            };
            script.onerror = function() {
                // xref is optional — resolve empty if missing
                resolve([]);
            };
            document.head.appendChild(script);
        } else {
            fetch('datasets/xref.json')
                .then(function(r) {
                    if (!r.ok) return [];
                    return r.json();
                })
                .then(resolve)
                .catch(function() { resolve([]); });
        }
    });
}

function loadFuzzyXref() {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            var script = document.createElement('script');
            script.src = 'datasets/xref-fuzzy.js';
            script.onload = function() {
                if (typeof window.dataset_xref_fuzzy !== 'undefined') {
                    resolve(window.dataset_xref_fuzzy);
                } else {
                    reject(new Error('xref-fuzzy.js loaded but dataset_xref_fuzzy not defined'));
                }
            };
            script.onerror = function() {
                // fuzzy xref is optional — resolve empty if missing
                resolve([]);
            };
            document.head.appendChild(script);
        } else {
            fetch('datasets/xref-fuzzy.json')
                .then(function(r) {
                    if (!r.ok) return [];
                    return r.json();
                })
                .then(resolve)
                .catch(function() { resolve([]); });
        }
    });
}

function loadSemanticXref() {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            var script = document.createElement('script');
            script.src = 'datasets/xref-semantic.js';
            script.onload = function() {
                if (typeof window.dataset_xref_semantic !== 'undefined') {
                    resolve(window.dataset_xref_semantic);
                } else {
                    reject(new Error('xref-semantic.js loaded but dataset_xref_semantic not defined'));
                }
            };
            script.onerror = function() {
                // semantic xref is optional — resolve empty if missing
                resolve([]);
            };
            document.head.appendChild(script);
        } else {
            fetch('datasets/xref-semantic.json')
                .then(function(r) {
                    if (!r.ok) return [];
                    return r.json();
                })
                .then(resolve)
                .catch(function() { resolve([]); });
        }
    });
}

function loadCoherence(datasetId) {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            var varName = 'dataset_' + datasetId + '_coherence';
            var script = document.createElement('script');
            script.src = 'datasets/' + datasetId + '-coherence.js';
            script.onload = function() {
                if (typeof window[varName] !== 'undefined') {
                    resolve(window[varName]);
                } else {
                    reject(new Error(script.src + ' loaded but ' + varName + ' not defined'));
                }
            };
            script.onerror = function() {
                // coherence data is optional (not every dataset has been clustered) -- resolve null if missing
                resolve(null);
            };
            document.head.appendChild(script);
        } else {
            fetch('datasets/' + datasetId + '-coherence.json')
                .then(function(r) {
                    if (!r.ok) return null;
                    return r.json();
                })
                .then(resolve)
                .catch(function() { resolve(null); });
        }
    });
}

function loadOutliers(datasetId) {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            var varName = 'dataset_' + datasetId + '_outliers';
            var script = document.createElement('script');
            script.src = 'datasets/' + datasetId + '-outliers.js';
            script.onload = function() {
                if (typeof window[varName] !== 'undefined') {
                    resolve(window[varName]);
                } else {
                    reject(new Error(script.src + ' loaded but ' + varName + ' not defined'));
                }
            };
            script.onerror = function() {
                // outliers data is optional (not every dataset has been clustered) -- resolve null if missing
                resolve(null);
            };
            document.head.appendChild(script);
        } else {
            fetch('datasets/' + datasetId + '-outliers.json')
                .then(function(r) {
                    if (!r.ok) return null;
                    return r.json();
                })
                .then(resolve)
                .catch(function() { resolve(null); });
        }
    });
}

function loadDataset(jsonPath, jsPath) {
    return new Promise(function(resolve, reject) {
        if (location.protocol === 'file:') {
            // file:// — load .js wrapper which defines dataset_<id>
            var script = document.createElement('script');
            script.src = jsPath;
            script.onload = function() {
                // The .js file defines a variable like dataset_openai, dataset_beavertails, etc.
                // Extract the id from the path: "datasets/openai.js" -> "openai"
                var id = jsPath.replace(/.*\//, '').replace('.js', '');
                var varName = 'dataset_' + id;
                if (typeof window[varName] !== 'undefined') {
                    resolve(window[varName]);
                } else {
                    // Fallback: check if generic 'dataset' was set
                    reject(new Error(jsPath + ' loaded but ' + varName + ' not defined'));
                }
            };
            script.onerror = function() {
                reject(new Error('Failed to load ' + jsPath));
            };
            document.head.appendChild(script);
        } else {
            fetch(jsonPath)
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(resolve)
                .catch(reject);
        }
    });
}
