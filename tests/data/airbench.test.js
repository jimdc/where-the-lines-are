var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

// Independent data-validation for the AIR-Bench 2024 dataset (integrity rule 7:
// validate the data BEFORE trusting any rendering of it). These tests read the
// shipped JSON + registry directly — no UI, no logic.js — and assert schema,
// key domain, non-empty prompts, populated categories, and totals-vs-card.

var DATASETS_DIR = path.join(__dirname, '..', '..', 'datasets');

var EXPECTED_ROWS = 5694;            // paper / dataset card: 5,694 prompts
var EXPECTED_CATEGORIES = 16;        // AIR taxonomy Level 2
// The CBRN/biosecurity + cyber axes are the whole reason this dataset was added.
var CBRN_KEY = 'VE';                 // Violence & Extremism (contains Weapon Usage & Development → CBRN)
var CYBER_KEY = 'SR';                // Security Risks

var registry, airbenchEntry, keys, data;

before(function() {
    registry = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'registry.json'), 'utf8'));
    airbenchEntry = registry.datasets.find(function(d) { return d.id === 'airbench'; });
    assert.ok(airbenchEntry, 'airbench entry must exist in registry');
    keys = airbenchEntry.categories.map(function(c) { return c.key; });
    data = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'airbench.json'), 'utf8'));
});

describe('AIR-Bench registry schema', function() {
    it('declares exactly 16 categories', function() {
        assert.equal(airbenchEntry.categories.length, EXPECTED_CATEGORIES);
    });

    it('has unique two-letter keys', function() {
        var seen = new Set(keys);
        assert.equal(seen.size, keys.length, 'keys must be unique');
        keys.forEach(function(k) { assert.match(k, /^[A-Z]{2}$/); });
    });

    it('every category has a non-empty definition and a concept', function() {
        airbenchEntry.categories.forEach(function(c) {
            assert.ok(c.definition && c.definition.trim().length > 0, c.key + ' needs a definition');
            assert.ok(c.concept, c.key + ' needs a concept for the Rosetta/Drift crosswalk');
        });
    });

    it('surfaces the CBRN/biosecurity concept (the gap this dataset closes)', function() {
        var ve = airbenchEntry.categories.find(function(c) { return c.key === CBRN_KEY; });
        var concepts = Array.isArray(ve.concept) ? ve.concept : [ve.concept];
        assert.ok(concepts.indexOf('CBRN / biosecurity') !== -1,
            'Violence & Extremism must carry the CBRN / biosecurity concept');
    });

    it('declares CC-BY-4.0 license and the arXiv paper', function() {
        assert.equal(airbenchEntry.license, 'CC-BY-4.0');
        assert.match(airbenchEntry.paper, /2407\.17436/);
    });
});

describe('AIR-Bench row data', function() {
    it('has the expected row count (5,694 ± small drop)', function() {
        // Single source of truth is the card's 5,694. Allow a tiny tolerance for
        // any future empty-prompt drops, but log if it ever diverges.
        var drop = EXPECTED_ROWS - data.length;
        assert.ok(Math.abs(drop) <= 10, 'row count ' + data.length + ' too far from ' + EXPECTED_ROWS);
    });

    it('every row has exactly 16 category keys, all in {0,1}', function() {
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

    it('every prompt is a non-empty string', function() {
        for (var i = 0; i < data.length; i++) {
            assert.equal(typeof data[i].prompt, 'string', 'row ' + i + ' prompt not a string');
            assert.ok(data[i].prompt.trim().length > 0, 'row ' + i + ' prompt empty');
        }
    });

    it('is single-label by design (exactly one flag per row)', function() {
        // AIR-Bench is single-label at leaf → single-label at L2. This is the
        // honest reason its co-occurrence is near-diagonal; assert it explicitly.
        for (var i = 0; i < data.length; i++) {
            var flagged = keys.reduce(function(n, k) { return n + (data[i][k] === 1 ? 1 : 0); }, 0);
            assert.equal(flagged, 1, 'row ' + i + ' has ' + flagged + ' flags (expected 1)');
        }
    });

    it('every one of the 16 categories has count > 0', function() {
        var counts = {};
        keys.forEach(function(k) { counts[k] = 0; });
        data.forEach(function(row) { keys.forEach(function(k) { counts[k] += row[k]; }); });
        keys.forEach(function(k) {
            assert.ok(counts[k] > 0, 'category ' + k + ' has zero rows');
        });
        // The CBRN and cyber axes specifically must be populated.
        assert.ok(counts[CBRN_KEY] > 0, 'CBRN/Violence&Extremism must be populated');
        assert.ok(counts[CYBER_KEY] > 0, 'cyber/Security Risks must be populated');
    });
});

describe('AIR-Bench stats consistency', function() {
    it('stats.totalRows matches the shipped row count', function() {
        assert.ok(airbenchEntry.stats, 'airbench must have computed stats');
        assert.equal(airbenchEntry.stats.totalRows, data.length);
    });

    it('stats.categoryCounts match a fresh count of the data', function() {
        var counts = {};
        keys.forEach(function(k) { counts[k] = 0; });
        data.forEach(function(row) { keys.forEach(function(k) { counts[k] += row[k]; }); });
        keys.forEach(function(k) {
            assert.equal(airbenchEntry.stats.categoryCounts[k], counts[k], 'count mismatch for ' + k);
        });
    });

    it('reflects single-label structure (avgExclusivity 1, multiLabelRate 0)', function() {
        assert.equal(airbenchEntry.stats.multiLabelRate, 0);
        assert.equal(airbenchEntry.stats.avgExclusivity, 1.0);
    });
});
