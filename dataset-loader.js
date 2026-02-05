/**
 * Dataset loader for explore-wrongthink.
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
