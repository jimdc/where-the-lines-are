var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var {
    countSingleCategories, countPairwise, countCombinations, countExclusivity
} = require('../../static/logic.js');
var { SAMPLE_DATA, SAMPLE_KEYS } = require('../fixtures/sample-data.js');

describe('countSingleCategories', function() {
    it('counts each category correctly', function() {
        var counts = countSingleCategories(SAMPLE_DATA, SAMPLE_KEYS);
        // A: 5 (A only) + 4 (A+B) + 2 (A+C) + 1 (A+B+C) = 12
        assert.equal(counts.A, 12);
        // B: 3 (B only) + 4 (A+B) + 1 (B+C) + 1 (A+B+C) = 9
        assert.equal(counts.B, 9);
        // C: 2 (C only) + 2 (A+C) + 1 (B+C) + 1 (A+B+C) = 6
        assert.equal(counts.C, 6);
    });

    it('returns zero for unused keys', function() {
        var counts = countSingleCategories(SAMPLE_DATA, ['A', 'B', 'C', 'D']);
        assert.equal(counts.D, 0);
    });

    it('handles empty data', function() {
        var counts = countSingleCategories([], SAMPLE_KEYS);
        assert.equal(counts.A, 0);
        assert.equal(counts.B, 0);
        assert.equal(counts.C, 0);
    });
});

describe('countPairwise', function() {
    it('counts co-occurrences correctly', function() {
        var counts = countPairwise(SAMPLE_DATA, SAMPLE_KEYS);
        // A+B: 4 (A+B rows) + 1 (A+B+C) = 5
        assert.equal(counts['A+B'], 5);
        // A+C: 2 (A+C rows) + 1 (A+B+C) = 3
        assert.equal(counts['A+C'], 3);
        // B+C: 1 (B+C row) + 1 (A+B+C) = 2
        assert.equal(counts['B+C'], 2);
    });

    it('handles empty data', function() {
        var counts = countPairwise([], SAMPLE_KEYS);
        assert.equal(counts['A+B'], 0);
    });
});

describe('countCombinations', function() {
    it('counts unique combinations', function() {
        var combos = countCombinations(SAMPLE_DATA, SAMPLE_KEYS);
        assert.equal(combos['A'], 5);
        assert.equal(combos['B'], 3);
        assert.equal(combos['C'], 2);
        assert.equal(combos['A+B'], 4);
        assert.equal(combos['A+C'], 2);
        assert.equal(combos['B+C'], 1);
        assert.equal(combos['A+B+C'], 1);
        assert.equal(combos['none'], 2);
    });

    it('handles empty data', function() {
        var combos = countCombinations([], SAMPLE_KEYS);
        assert.deepStrictEqual(combos, {});
    });
});

describe('countExclusivity', function() {
    it('counts exclusive vs shared correctly', function() {
        var result = countExclusivity(SAMPLE_DATA, SAMPLE_KEYS);
        // Exclusive: flagged alone
        assert.equal(result.exclusive.A, 5);  // 5 A-only rows
        assert.equal(result.exclusive.B, 3);  // 3 B-only rows
        assert.equal(result.exclusive.C, 2);  // 2 C-only rows

        // Shared: rows where category appears with others
        // A shared: 4 (A+B) + 2 (A+C) + 1 (A+B+C) = 7
        assert.equal(result.shared.A, 7);
        // B shared: 4 (A+B) + 1 (B+C) + 1 (A+B+C) = 6
        assert.equal(result.shared.B, 6);
        // C shared: 2 (A+C) + 1 (B+C) + 1 (A+B+C) = 4
        assert.equal(result.shared.C, 4);
    });

    it('handles empty data', function() {
        var result = countExclusivity([], SAMPLE_KEYS);
        assert.equal(result.exclusive.A, 0);
        assert.equal(result.shared.A, 0);
    });
});
