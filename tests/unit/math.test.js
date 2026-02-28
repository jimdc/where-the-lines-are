var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var {
    computeCohensKappa, computeSurpriseScore, getComboKey
} = require('../../static/logic.js');

describe('computeCohensKappa', function() {
    it('perfect agreement returns 1', function() {
        // 50 agree yes, 50 agree no, 0 disagreements
        var kappa = computeCohensKappa(50, 0, 0, 50);
        assert.equal(kappa, 1);
    });

    it('chance agreement returns ~0', function() {
        // Even split of all 4 cells = chance agreement
        var kappa = computeCohensKappa(25, 25, 25, 25);
        assert.ok(Math.abs(kappa) < 0.01, 'kappa should be near 0, got ' + kappa);
    });

    it('all zeros returns 0', function() {
        assert.equal(computeCohensKappa(0, 0, 0, 0), 0);
    });

    it('complete disagreement returns negative', function() {
        // 0 agreement, all disagreement
        var kappa = computeCohensKappa(0, 50, 50, 0);
        assert.ok(kappa < 0, 'kappa should be negative, got ' + kappa);
    });

    it('moderate agreement returns value between 0 and 1', function() {
        var kappa = computeCohensKappa(40, 10, 5, 45);
        assert.ok(kappa > 0 && kappa < 1, 'kappa should be between 0 and 1, got ' + kappa);
    });
});

describe('getComboKey', function() {
    it('returns sorted flagged keys', function() {
        var row = { A: 1, B: 1, C: 0 };
        assert.equal(getComboKey(row, ['A', 'B', 'C']), 'A+B');
    });

    it('returns "none" when nothing flagged', function() {
        var row = { A: 0, B: 0, C: 0 };
        assert.equal(getComboKey(row, ['A', 'B', 'C']), 'none');
    });

    it('sorts keys alphabetically', function() {
        var row = { C: 1, A: 1, B: 0 };
        assert.equal(getComboKey(row, ['C', 'A', 'B']), 'A+C');
    });
});

describe('computeSurpriseScore', function() {
    it('unique combo returns high score', function() {
        var row = { A: 1, B: 1, C: 1 };
        var comboFreqs = { 'A+B+C': 1, 'A': 50, 'B': 30 };
        var score = computeSurpriseScore(row, ['A', 'B', 'C'], comboFreqs);
        assert.equal(score, 1); // 1/1
    });

    it('common combo returns low score', function() {
        var row = { A: 1, B: 0, C: 0 };
        var comboFreqs = { 'A': 100 };
        var score = computeSurpriseScore(row, ['A', 'B', 'C'], comboFreqs);
        assert.equal(score, 0.01); // 1/100
    });

    it('missing combo defaults to freq 1', function() {
        var row = { A: 0, B: 0, C: 0 };
        var comboFreqs = {};
        var score = computeSurpriseScore(row, ['A', 'B', 'C'], comboFreqs);
        assert.equal(score, 1); // 1/1 (default)
    });

    it('null comboFreqs defaults to freq 1', function() {
        var row = { A: 1, B: 0, C: 0 };
        var score = computeSurpriseScore(row, ['A', 'B', 'C'], null);
        assert.equal(score, 1);
    });
});
