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
