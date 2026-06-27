var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

// Integrity guard for the embedding-based cross-dataset matcher (xref-semantic).
// It is a COMPANION to xref-fuzzy, not a replacement: every entry must be a genuine
// low-lexical / high-meaning pair — cosine >= 0.72 AND token-Jaccard <= 0.50 — so the
// file is disjoint from xref-fuzzy (which keeps Jaccard >= 0.7). Each entry must pair
// two DIFFERENT, real datasets, with non-empty category codes that exist in the registry.

var DATASETS_DIR = path.join(__dirname, '..', '..', 'datasets');
var COSINE_MIN = 0.72;
var JACCARD_MAX = 0.50;

// Same tokenizer as build_semantic_xref / build_fuzzy_xref (apples-to-apples Jaccard).
var STOP_WORDS = new Set((
    'the and to a of it in i that is on for with as are was this but be have has had or ' +
    'an my if me so you we they he she them his her your their our us do does did at by ' +
    'from what who which where when why how can could should would will just not very into ' +
    'also about up down out no yes more some than'
).split(' '));

function tokenize(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .filter(function(w) { return w && w.length >= 2 && !STOP_WORDS.has(w); });
}

function jaccard(a, b) {
    var sa = new Set(tokenize(a)), sb = new Set(tokenize(b));
    if (!sa.size || !sb.size) return 0;
    var inter = 0;
    sa.forEach(function(t) { if (sb.has(t)) inter++; });
    return inter / (sa.size + sb.size - inter);
}

var semantic, registry, validKeys;

before(function() {
    semantic = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'xref-semantic.json'), 'utf8'));
    registry = JSON.parse(fs.readFileSync(path.join(DATASETS_DIR, 'registry.json'), 'utf8'));
    validKeys = {}; // dataset id -> Set of category keys
    registry.datasets.forEach(function(d) {
        validKeys[d.id] = new Set((d.categories || []).map(function(c) { return c.key; }));
    });
});

describe('xref-semantic.json is present and non-trivial', function() {
    it('is a non-empty array', function() {
        assert.ok(Array.isArray(semantic), 'xref-semantic.json must be an array');
        assert.ok(semantic.length >= 100, 'expected >=100 semantic matches, got ' + semantic.length);
    });

    it('respects the 10K cap (mirrors xref-fuzzy)', function() {
        assert.ok(semantic.length <= 10000, 'must not exceed the 10K cap');
    });

    it('ships a matching .js wrapper that defines dataset_xref_semantic', function() {
        var js = fs.readFileSync(path.join(DATASETS_DIR, 'xref-semantic.js'), 'utf8');
        assert.ok(js.startsWith('var dataset_xref_semantic ='), 'JS wrapper must define dataset_xref_semantic');
    });
});

describe('every entry is well-formed', function() {
    it('has 2 prompts, a numeric similarity, and 2 matches', function() {
        semantic.forEach(function(e, i) {
            assert.ok(Array.isArray(e.prompts) && e.prompts.length === 2, 'entry ' + i + ' needs 2 prompts');
            assert.ok(e.prompts[0] && e.prompts[1], 'entry ' + i + ' prompts must be non-empty');
            assert.equal(typeof e.similarity, 'number', 'entry ' + i + ' needs numeric similarity');
            assert.ok(Array.isArray(e.matches) && e.matches.length === 2, 'entry ' + i + ' needs 2 matches');
        });
    });

    it('similarity is within the cosine range [0.72, 1.0]', function() {
        semantic.forEach(function(e, i) {
            assert.ok(e.similarity >= COSINE_MIN && e.similarity <= 1.0,
                'entry ' + i + ' similarity ' + e.similarity + ' out of range');
        });
    });
});

describe('each match links two DIFFERENT, real datasets with valid categories', function() {
    it('the two matches are different, registry-known datasets', function() {
        semantic.forEach(function(e, i) {
            var a = e.matches[0].dataset, b = e.matches[1].dataset;
            assert.notEqual(a, b, 'entry ' + i + ' must cross two datasets');
            assert.ok(validKeys[a], 'entry ' + i + ' unknown dataset ' + a);
            assert.ok(validKeys[b], 'entry ' + i + ' unknown dataset ' + b);
        });
    });

    it('every category code is non-empty and exists in its dataset', function() {
        semantic.forEach(function(e, i) {
            e.matches.forEach(function(m) {
                assert.ok(Array.isArray(m.cats) && m.cats.length >= 1, 'entry ' + i + ' empty cats');
                m.cats.forEach(function(k) {
                    assert.ok(validKeys[m.dataset].has(k),
                        'entry ' + i + ' cat ' + k + ' not in ' + m.dataset);
                });
            });
        });
    });
});

describe('disjoint from xref-fuzzy (true semantic companion)', function() {
    it('every pair has token-Jaccard <= 0.50 (below fuzzy keep-cutoff 0.7)', function() {
        var violations = semantic.filter(function(e) {
            return jaccard(e.prompts[0], e.prompts[1]) > JACCARD_MAX;
        });
        assert.equal(violations.length, 0,
            violations.length + ' entries exceed Jaccard ' + JACCARD_MAX +
            ' (would belong to xref-fuzzy, not the semantic companion)');
    });
});
