var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var { parseHash } = require('../../static/logic.js');

describe('parseHash', function() {
    it('empty string returns dataset null', function() {
        assert.deepStrictEqual(parseHash(''), { dataset: null });
    });

    it('bare dataset id (backward compat)', function() {
        var result = parseHash('openai');
        assert.equal(result.dataset, 'openai');
    });

    it('handles leading # gracefully', function() {
        var result = parseHash('#openai');
        assert.equal(result.dataset, 'openai');
    });

    it('full hash with all params', function() {
        var result = parseHash('dataset=aegis&include=TX,ST&exclude=OB&search=kill');
        assert.equal(result.dataset, 'aegis');
        assert.deepStrictEqual(result.include, ['TX', 'ST']);
        assert.deepStrictEqual(result.exclude, ['OB']);
        assert.equal(result.search, 'kill');
    });

    it('encoded search', function() {
        var result = parseHash('dataset=openai&search=kill%20AND%20children');
        assert.equal(result.search, 'kill AND children');
    });

    it('missing optional params default to empty', function() {
        var result = parseHash('dataset=openai');
        assert.deepStrictEqual(result.include, []);
        assert.deepStrictEqual(result.exclude, []);
        assert.equal(result.search, '');
        assert.equal(result.order, '');
    });

    it('order param preserved', function() {
        var result = parseHash('dataset=openai&order=frequency');
        assert.equal(result.order, 'frequency');
    });

    it('null/undefined input returns dataset null', function() {
        assert.deepStrictEqual(parseHash(null), { dataset: null });
        assert.deepStrictEqual(parseHash(undefined), { dataset: null });
    });
});
