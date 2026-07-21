var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

// Integrity guard for the two embedding-clustering artifacts (scripts/preprocess.py's
// embed/cluster/noise-lens subcommands): datasets/<id>-coherence.json (per-concept
// top-cluster concentration from UMAP+HDBSCAN) and datasets/<id>-outliers.json
// (per-row k-NN concept homogeneity, ranked ascending). Reads the shipped JSON +
// registry directly, no UI. Every row-bearing dataset should have both files
// (taxonomy-only anthropic-cc has no corpus to cluster).

var DATASETS_DIR = path.join(__dirname, '..', '..', 'datasets');
var MAX_OUTLIER_ROWS = 200;
var MAX_ARTIFACT_BYTES = 500 * 1024; // generous bound; measured artifacts run tens of KB

var registry, rowBearingIds, conceptsByDataset, keysByDataset;

before(function() {
    registry = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'registry.json'), 'utf8'));
    rowBearingIds = registry.datasets.filter(function(d) { return !d.taxonomyOnly; }).map(function(d) { return d.id; });
    conceptsByDataset = {};
    keysByDataset = {};
    registry.datasets.forEach(function(ds) {
        var concepts = new Set();
        var keys = new Set();
        (ds.categories || []).forEach(function(c) {
            keys.add(c.key);
            var cc = c.concept;
            if (!cc) return;
            (Array.isArray(cc) ? cc : [cc]).forEach(function(x) { concepts.add(x); });
        });
        conceptsByDataset[ds.id] = concepts;
        keysByDataset[ds.id] = keys;
    });
});

function readArtifact(id, kind) {
    var p = path.join(DATASETS_DIR, id + '-' + kind + '.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

describe('every row-bearing dataset has both clustering artifacts', function() {
    it('ships datasets/<id>-coherence.json and datasets/<id>-outliers.json', function() {
        rowBearingIds.forEach(function(id) {
            assert.ok(fs.existsSync(path.join(DATASETS_DIR, id + '-coherence.json')), id + '-coherence.json missing');
            assert.ok(fs.existsSync(path.join(DATASETS_DIR, id + '-outliers.json')), id + '-outliers.json missing');
        });
    });

    it('ships matching .js wrappers with the expected variable names', function() {
        rowBearingIds.forEach(function(id) {
            var cJs = fs.readFileSync(path.join(DATASETS_DIR, id + '-coherence.js'), 'utf8');
            assert.ok(cJs.startsWith('var dataset_' + id + '_coherence ='), id + '-coherence.js var name mismatch');
            var oJs = fs.readFileSync(path.join(DATASETS_DIR, id + '-outliers.js'), 'utf8');
            assert.ok(oJs.startsWith('var dataset_' + id + '_outliers ='), id + '-outliers.js var name mismatch');
        });
    });

    it('is bounded in size (tens of KB, not a re-shipped embedding)', function() {
        rowBearingIds.forEach(function(id) {
            ['coherence', 'outliers'].forEach(function(kind) {
                var size = fs.statSync(path.join(DATASETS_DIR, id + '-' + kind + '.json')).size;
                assert.ok(size < MAX_ARTIFACT_BYTES, id + '-' + kind + '.json is ' + size + ' bytes, expected < ' + MAX_ARTIFACT_BYTES);
            });
        });
    });
});

describe('coherence artifact schema', function() {
    it('every concept row is well-formed and references a real Rosetta concept', function() {
        rowBearingIds.forEach(function(id) {
            var c = readArtifact(id, 'coherence');
            assert.equal(c.datasetId, id);
            assert.ok(Array.isArray(c.concepts));
            c.concepts.forEach(function(entry) {
                assert.ok(conceptsByDataset[id].has(entry.concept), id + ': unknown concept ' + entry.concept);
                assert.equal(typeof entry.n, 'number');
                assert.ok(entry.n > 0, id + '/' + entry.concept + ': n must be > 0');
                assert.ok(entry.topClusterConcentration >= 0 && entry.topClusterConcentration <= 1,
                    id + '/' + entry.concept + ': concentration out of [0,1]');
                assert.ok(entry.topClusterSize <= entry.n, id + '/' + entry.concept + ': topClusterSize > n');
                assert.ok(Array.isArray(entry.examples) && entry.examples.length <= 2,
                    id + '/' + entry.concept + ': at most 2 examples');
            });
        });
    });

    it('is sorted ascending by top-cluster concentration (most fragmented first)', function() {
        rowBearingIds.forEach(function(id) {
            var c = readArtifact(id, 'coherence');
            for (var i = 1; i < c.concepts.length; i++) {
                assert.ok(c.concepts[i].topClusterConcentration >= c.concepts[i - 1].topClusterConcentration,
                    id + ': concepts not sorted ascending at index ' + i);
            }
        });
    });
});

describe('outliers artifact schema', function() {
    it('is bounded to the top-N least-homogeneous rows and well-formed', function() {
        rowBearingIds.forEach(function(id) {
            var o = readArtifact(id, 'outliers');
            assert.equal(o.datasetId, id);
            assert.equal(o.k, 15);
            assert.ok(Array.isArray(o.rows));
            assert.ok(o.rows.length <= MAX_OUTLIER_ROWS, id + ': ' + o.rows.length + ' rows > cap ' + MAX_OUTLIER_ROWS);
            o.rows.forEach(function(row) {
                assert.equal(typeof row.excerpt, 'string');
                // Truncated to 180 Unicode code points on the Python side; JS .length counts
                // UTF-16 code units, so emoji/astral-plane-heavy text can read longer here.
                assert.ok(row.excerpt.length > 0 && row.excerpt.length <= 400, id + ': excerpt out of bounds');
                assert.ok(Array.isArray(row.labels) && row.labels.length >= 1, id + ': row needs >=1 label');
                assert.ok(Array.isArray(row.neighborConcepts), id + ': neighborConcepts must be an array');
                row.neighborConcepts.forEach(function(pair) {
                    assert.ok(Array.isArray(pair) && pair.length === 2, id + ': neighborConcepts entries are [concept, count]');
                    assert.equal(typeof pair[0], 'string');
                    assert.equal(typeof pair[1], 'number');
                });
                assert.ok(row.homogeneity >= 0 && row.homogeneity <= 1, id + ': homogeneity out of [0,1]');
            });
        });
    });

    it('is sorted ascending by homogeneity (least agreement first)', function() {
        rowBearingIds.forEach(function(id) {
            var o = readArtifact(id, 'outliers');
            for (var i = 1; i < o.rows.length; i++) {
                assert.ok(o.rows[i].homogeneity >= o.rows[i - 1].homogeneity,
                    id + ': rows not sorted ascending at index ' + i);
            }
        });
    });
});
