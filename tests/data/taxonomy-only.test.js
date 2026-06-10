var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

// Integrity guard for taxonomy-only deployment-classifier layers (RULES rule 3:
// "Never fabricate rows"). These entries publish a category list but have NO
// public row-level corpus, so they must carry NO statistics and NO dataset file,
// and every category must trace to a source URL.

var DATASETS_DIR = path.join(__dirname, '..', '..', 'datasets');

var registry, taxonomyOnly;

before(function() {
    registry = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'registry.json'), 'utf8'));
    taxonomyOnly = registry.datasets.filter(function(d) { return d.taxonomyOnly; });
});

describe('taxonomy-only entries exist and are well-formed', function() {
    it('at least one taxonomy-only deployment classifier is present', function() {
        assert.ok(taxonomyOnly.length >= 1, 'expected a taxonomy-only layer (Anthropic Constitutional Classifiers)');
    });

    it('the Anthropic Constitutional Classifiers entry is present with 4 CBRN categories', function() {
        var cc = registry.datasets.find(function(d) { return d.id === 'anthropic-cc'; });
        assert.ok(cc, 'anthropic-cc must exist');
        assert.equal(cc.taxonomyOnly, true);
        var names = cc.categories.map(function(c) { return c.name; }).join('|').toLowerCase();
        ['chemical', 'biological', 'radiological', 'nuclear'].forEach(function(w) {
            assert.ok(names.indexOf(w) !== -1, 'CBRN must include ' + w);
        });
    });
});

describe('taxonomy-only entries fabricate NO data', function() {
    it('carry rows:null and NO stats block (no fabricated counts/co-occurrence)', function() {
        taxonomyOnly.forEach(function(d) {
            assert.equal(d.rows, null, d.id + ' must have rows:null');
            assert.ok(!('stats' in d), d.id + ' must NOT have a stats block');
        });
    });

    it('have no on-disk dataset file', function() {
        taxonomyOnly.forEach(function(d) {
            var jsonPath = path.join(DATASETS_DIR, d.id + '.json');
            assert.ok(!fs.existsSync(jsonPath), d.id + '.json must not exist');
            if (d.file) {
                assert.ok(!fs.existsSync(path.join(DATASETS_DIR, '..', d.file)),
                    d.id + ' file must not exist on disk');
            }
        });
    });

    it('every category traces to a source URL', function() {
        taxonomyOnly.forEach(function(d) {
            d.categories.forEach(function(c) {
                assert.ok(c.sourceUrl && /^https?:\/\//.test(c.sourceUrl),
                    d.id + '/' + c.key + ' must carry a source URL');
            });
        });
    });

    it('are NOT included in the row-data exclusivity-trend population (filtered by ds.stats)', function() {
        // Mirror the UI guard (drawExclusivityTrend filters on ds.stats): a
        // taxonomy-only entry has no stats, so it can never enter that chart.
        var withStats = registry.datasets.filter(function(d) { return d.stats; });
        taxonomyOnly.forEach(function(d) {
            assert.ok(withStats.indexOf(d) === -1, d.id + ' must be excluded from stat charts');
        });
    });
});

describe('measured datasets remain distinguishable', function() {
    it('every non-taxonomy-only dataset has a stats block and a real row count', function() {
        registry.datasets.filter(function(d) { return !d.taxonomyOnly; }).forEach(function(d) {
            assert.ok(d.stats, d.id + ' (measured) must have stats');
            assert.ok(d.stats.totalRows > 0, d.id + ' must have rows');
        });
    });
});
