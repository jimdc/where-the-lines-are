var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

// Independent data-validation for the MLCommons AILuminate v1.0 DEMO subset
// (integrity rule 7: validate the data before trusting any rendering). Reads the
// shipped JSON + registry directly — no UI, no logic.js.

var DATASETS_DIR = path.join(__dirname, '..', '..', 'datasets');

var EXPECTED_ROWS = 1200;        // public DEMO set: 1,200 prompts (10% practice subset)
var EXPECTED_CATEGORIES = 12;    // AIRR 12-hazard taxonomy
var CBRNE_KEY = 'IW';            // Indiscriminate Weapons (CBRNE) — the reason this dataset exists

var registry, entry, keys, data;

before(function() {
    registry = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'registry.json'), 'utf8'));
    entry = registry.datasets.find(function(d) { return d.id === 'ailuminate'; });
    assert.ok(entry, 'ailuminate entry must exist in registry');
    keys = entry.categories.map(function(c) { return c.key; });
    data = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'ailuminate.json'), 'utf8'));
});

describe('AILuminate registry schema', function() {
    it('declares exactly 12 categories', function() {
        assert.equal(entry.categories.length, EXPECTED_CATEGORIES);
    });

    it('has unique two-letter keys, each with a definition and concept', function() {
        var seen = new Set(keys);
        assert.equal(seen.size, keys.length);
        entry.categories.forEach(function(c) {
            assert.match(c.key, /^[A-Z]{2}$/);
            assert.ok(c.definition && c.definition.trim().length > 0, c.key + ' needs a definition');
            assert.ok(c.concept, c.key + ' needs a concept');
        });
    });

    it('includes the explicit CBRNE hazard mapped to the CBRN concept', function() {
        var iw = entry.categories.find(function(c) { return c.key === CBRNE_KEY; });
        assert.ok(iw, 'must have an Indiscriminate Weapons (CBRNE) category');
        assert.match(iw.name, /CBRNE/i);
        assert.equal(iw.concept, 'CBRN / biosecurity');
    });

    it('declares CC-BY-4.0 license and the arXiv paper', function() {
        assert.equal(entry.license, 'CC-BY-4.0');
        assert.match(entry.paper, /2503\.05731/);
    });
});

describe('AILuminate row data', function() {
    it('has exactly 1,200 rows (the DEMO release size)', function() {
        assert.equal(data.length, EXPECTED_ROWS);
    });

    it('every row has exactly 12 category keys, all in {0,1}', function() {
        var keySet = new Set(keys);
        for (var i = 0; i < data.length; i++) {
            var catKeys = Object.keys(data[i]).filter(function(k) { return k !== 'prompt'; });
            assert.equal(catKeys.length, EXPECTED_CATEGORIES, 'row ' + i + ' wrong key count');
            catKeys.forEach(function(k) {
                assert.ok(keySet.has(k), 'row ' + i + ' unknown key ' + k);
                assert.ok(data[i][k] === 0 || data[i][k] === 1, 'row ' + i + ' ' + k + ' ∉ {0,1}');
            });
        }
    });

    it('every prompt is a non-empty string', function() {
        for (var i = 0; i < data.length; i++) {
            assert.equal(typeof data[i].prompt, 'string');
            assert.ok(data[i].prompt.trim().length > 0, 'row ' + i + ' prompt empty');
        }
    });

    it('is single-label by design (exactly one flag per row)', function() {
        for (var i = 0; i < data.length; i++) {
            var flagged = keys.reduce(function(n, k) { return n + (data[i][k] === 1 ? 1 : 0); }, 0);
            assert.equal(flagged, 1, 'row ' + i + ' has ' + flagged + ' flags');
        }
    });

    it('every hazard is populated, and CBRNE specifically has 100 rows', function() {
        var counts = {};
        keys.forEach(function(k) { counts[k] = 0; });
        data.forEach(function(row) { keys.forEach(function(k) { counts[k] += row[k]; }); });
        keys.forEach(function(k) { assert.ok(counts[k] > 0, 'hazard ' + k + ' has zero rows'); });
        // The DEMO release ships 100 prompts for iwp (Indiscriminate Weapons).
        assert.equal(counts[CBRNE_KEY], 100, 'CBRNE should have 100 measured rows');
    });
});

describe('AILuminate stats consistency', function() {
    it('stats.totalRows matches the shipped row count', function() {
        assert.ok(entry.stats, 'ailuminate must have computed stats');
        assert.equal(entry.stats.totalRows, data.length);
    });

    it('stats.categoryCounts match a fresh count', function() {
        var counts = {};
        keys.forEach(function(k) { counts[k] = 0; });
        data.forEach(function(row) { keys.forEach(function(k) { counts[k] += row[k]; }); });
        keys.forEach(function(k) {
            assert.equal(entry.stats.categoryCounts[k], counts[k], 'count mismatch for ' + k);
        });
    });

    it('reflects single-label structure (avgExclusivity 1, multiLabelRate 0)', function() {
        assert.equal(entry.stats.multiLabelRate, 0);
        assert.equal(entry.stats.avgExclusivity, 1.0);
    });
});
