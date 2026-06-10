var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

// Independent data-validation for the HarmBench behavior set (integrity rule 7:
// validate the data BEFORE trusting any rendering of it). Reads the shipped JSON +
// registry directly — no UI, no logic.js — and asserts schema, key domain,
// non-empty (full-text) prompts, single-label structure, and stats consistency.
// HarmBench's reason for being here is a third MEASURED column on the CBRN axis.

var DATASETS_DIR = path.join(__dirname, '..', '..', 'datasets');

var EXPECTED_ROWS = 400;            // public text "all" split: 400 behaviors
var EXPECTED_CATEGORIES = 7;        // seven HarmBench semantic categories
var CBRN_KEY = 'CB';               // chemical_biological → CBRN / biosecurity

var registry, hbEntry, keys, data;

before(function() {
    registry = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'registry.json'), 'utf8'));
    hbEntry = registry.datasets.find(function(d) { return d.id === 'harmbench'; });
    assert.ok(hbEntry, 'harmbench entry must exist in registry');
    keys = hbEntry.categories.map(function(c) { return c.key; });
    data = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'harmbench.json'), 'utf8'));
});

describe('HarmBench registry schema', function() {
    it('declares exactly 7 categories', function() {
        assert.equal(hbEntry.categories.length, EXPECTED_CATEGORIES);
    });

    it('has unique two-letter keys', function() {
        var seen = new Set(keys);
        assert.equal(seen.size, keys.length, 'keys must be unique');
        keys.forEach(function(k) { assert.match(k, /^[A-Z]{2}$/); });
    });

    it('every category has a non-empty definition and a concept', function() {
        hbEntry.categories.forEach(function(c) {
            assert.ok(c.definition && c.definition.trim().length > 0, c.key + ' needs a definition');
            assert.ok(c.concept, c.key + ' needs a concept for the Rosetta/Drift crosswalk');
        });
    });

    it('the chemical_biological category carries the CBRN/biosecurity concept', function() {
        var cb = hbEntry.categories.find(function(c) { return c.key === CBRN_KEY; });
        var concepts = Array.isArray(cb.concept) ? cb.concept : [cb.concept];
        assert.ok(concepts.indexOf('CBRN / biosecurity') !== -1,
            'chemical & biological must carry the CBRN / biosecurity concept');
    });

    it('declares MIT license and the arXiv paper', function() {
        assert.equal(hbEntry.license, 'MIT');
        assert.match(hbEntry.paper, /2402\.04249/);
    });
});

describe('HarmBench row data', function() {
    it('has the expected row count (400 behaviors)', function() {
        assert.equal(data.length, EXPECTED_ROWS, 'row count ' + data.length + ' != ' + EXPECTED_ROWS);
    });

    it('every row has exactly 7 category keys, all in {0,1}', function() {
        var keySet = new Set(keys);
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var catKeys = Object.keys(row).filter(function(k) { return k !== 'prompt'; });
            assert.equal(catKeys.length, EXPECTED_CATEGORIES, 'row ' + i + ' has ' + catKeys.length + ' keys');
            catKeys.forEach(function(k) {
                assert.ok(keySet.has(k), 'row ' + i + ' has unknown key ' + k);
                assert.ok(row[k] === 0 || row[k] === 1, 'row ' + i + ' key ' + k + ' = ' + row[k] + ' ∉ {0,1}');
            });
        }
    });

    it('every prompt is a non-empty string (full behavior text retained)', function() {
        for (var i = 0; i < data.length; i++) {
            assert.equal(typeof data[i].prompt, 'string', 'row ' + i + ' prompt not a string');
            assert.ok(data[i].prompt.trim().length > 0, 'row ' + i + ' prompt empty');
        }
    });

    it('is single-label by design (exactly one flag per row)', function() {
        for (var i = 0; i < data.length; i++) {
            var flagged = keys.reduce(function(n, k) { return n + (data[i][k] === 1 ? 1 : 0); }, 0);
            assert.equal(flagged, 1, 'row ' + i + ' has ' + flagged + ' flags (expected 1)');
        }
    });

    it('every one of the 7 categories has count > 0, CBRN populated', function() {
        var counts = {};
        keys.forEach(function(k) { counts[k] = 0; });
        data.forEach(function(row) { keys.forEach(function(k) { counts[k] += row[k]; }); });
        keys.forEach(function(k) {
            assert.ok(counts[k] > 0, 'category ' + k + ' has zero rows');
        });
        assert.ok(counts[CBRN_KEY] > 0, 'chemical_biological (CBRN) must be populated');
    });
});

describe('HarmBench stats consistency', function() {
    it('stats.totalRows matches the shipped row count', function() {
        assert.ok(hbEntry.stats, 'harmbench must have computed stats');
        assert.equal(hbEntry.stats.totalRows, data.length);
    });

    it('stats.categoryCounts match a fresh count of the data', function() {
        var counts = {};
        keys.forEach(function(k) { counts[k] = 0; });
        data.forEach(function(row) { keys.forEach(function(k) { counts[k] += row[k]; }); });
        keys.forEach(function(k) {
            assert.equal(hbEntry.stats.categoryCounts[k], counts[k], 'count mismatch for ' + k);
        });
    });

    it('reflects single-label structure (avgExclusivity 1, multiLabelRate 0)', function() {
        assert.equal(hbEntry.stats.multiLabelRate, 0);
        assert.equal(hbEntry.stats.avgExclusivity, 1.0);
    });
});
