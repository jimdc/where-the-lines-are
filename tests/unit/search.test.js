var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var {
    tokenizeQuery, parseQuery, evalQuery, extractTerms, buildSearchFn
} = require('../../static/logic.js');

describe('tokenizeQuery', function() {
    it('tokenizes single word', function() {
        var tokens = tokenizeQuery('kill');
        assert.deepStrictEqual(tokens, [{ type: 'TERM', value: 'kill' }]);
    });

    it('tokenizes AND operator', function() {
        var tokens = tokenizeQuery('kill AND children');
        assert.equal(tokens.length, 3);
        assert.equal(tokens[1].type, 'AND');
    });

    it('tokenizes OR operator', function() {
        var tokens = tokenizeQuery('kill OR harm');
        assert.equal(tokens[1].type, 'OR');
    });

    it('tokenizes NOT operator', function() {
        var tokens = tokenizeQuery('NOT kill');
        assert.equal(tokens[0].type, 'NOT');
        assert.equal(tokens[1].value, 'kill');
    });

    it('tokenizes quoted phrase', function() {
        var tokens = tokenizeQuery('"kill children"');
        assert.deepStrictEqual(tokens, [{ type: 'TERM', value: 'kill children' }]);
    });

    it('treats unclosed quote as term', function() {
        var tokens = tokenizeQuery('"kill children');
        assert.equal(tokens.length, 1);
        assert.equal(tokens[0].value, 'kill children');
    });

    it('lowercases terms', function() {
        var tokens = tokenizeQuery('Kill');
        assert.equal(tokens[0].value, 'kill');
    });
});

describe('parseQuery', function() {
    it('returns null for empty tokens', function() {
        assert.equal(parseQuery([]), null);
    });

    it('parses single term', function() {
        var ast = parseQuery([{ type: 'TERM', value: 'kill' }]);
        assert.deepStrictEqual(ast, { type: 'TERM', value: 'kill' });
    });

    it('implicit AND for bare multi-word', function() {
        var tokens = tokenizeQuery('kill children');
        var ast = parseQuery(tokens);
        assert.equal(ast.type, 'AND');
        assert.equal(ast.left.value, 'kill');
        assert.equal(ast.right.value, 'children');
    });

    it('OR has lower precedence than AND: a OR b AND c', function() {
        var tokens = tokenizeQuery('a OR b AND c');
        var ast = parseQuery(tokens);
        // Should parse as: a OR (b AND c)
        assert.equal(ast.type, 'OR');
        assert.equal(ast.left.value, 'a');
        assert.equal(ast.right.type, 'AND');
    });

    it('NOT binds tighter: NOT a AND b', function() {
        var tokens = tokenizeQuery('NOT a AND b');
        var ast = parseQuery(tokens);
        // Should parse as: (NOT a) AND b
        assert.equal(ast.type, 'AND');
        assert.equal(ast.left.type, 'NOT');
        assert.equal(ast.right.value, 'b');
    });
});

describe('evalQuery', function() {
    it('null ast matches everything', function() {
        assert.equal(evalQuery(null, 'anything'), true);
    });

    it('single term matches case-insensitively (text pre-lowered)', function() {
        var ast = { type: 'TERM', value: 'kill' };
        assert.equal(evalQuery(ast, 'kill the enemy'), true);
        assert.equal(evalQuery(ast, 'help the friend'), false);
    });

    it('AND requires both terms', function() {
        var ast = { type: 'AND',
            left: { type: 'TERM', value: 'kill' },
            right: { type: 'TERM', value: 'children' }
        };
        assert.equal(evalQuery(ast, 'kill the children'), true);
        assert.equal(evalQuery(ast, 'kill the enemy'), false);
    });

    it('OR matches either term', function() {
        var ast = { type: 'OR',
            left: { type: 'TERM', value: 'kill' },
            right: { type: 'TERM', value: 'harm' }
        };
        assert.equal(evalQuery(ast, 'kill'), true);
        assert.equal(evalQuery(ast, 'harm'), true);
        assert.equal(evalQuery(ast, 'help'), false);
    });

    it('NOT excludes term', function() {
        var ast = { type: 'NOT', operand: { type: 'TERM', value: 'kill' } };
        assert.equal(evalQuery(ast, 'kill'), false);
        assert.equal(evalQuery(ast, 'help'), true);
    });
});

describe('extractTerms', function() {
    it('returns empty for null', function() {
        assert.deepStrictEqual(extractTerms(null), []);
    });

    it('skips NOT branches', function() {
        var tokens = tokenizeQuery('kill NOT harm');
        var ast = parseQuery(tokens);
        var terms = extractTerms(ast);
        assert.ok(terms.includes('kill'));
        assert.ok(!terms.includes('harm'));
    });

    it('collects terms from AND/OR', function() {
        var tokens = tokenizeQuery('a OR b AND c');
        var ast = parseQuery(tokens);
        var terms = extractTerms(ast);
        assert.deepStrictEqual(terms.sort(), ['a', 'b', 'c']);
    });
});

describe('buildSearchFn', function() {
    it('returns null for empty query', function() {
        assert.equal(buildSearchFn(''), null);
        assert.equal(buildSearchFn('   '), null);
    });

    it('single word matches case-insensitively', function() {
        var fn = buildSearchFn('Kill');
        assert.ok(fn.test('kill the enemy'));
        assert.ok(fn.test('KILL'));
        assert.ok(!fn.test('help'));
    });

    it('quoted phrase matches exact substring', function() {
        var fn = buildSearchFn('"kill children"');
        assert.ok(fn.test('please kill children now'));
        assert.ok(!fn.test('kill the children'));
    });

    it('AND requires both terms present', function() {
        var fn = buildSearchFn('kill AND children');
        assert.ok(fn.test('kill the children'));
        assert.ok(!fn.test('kill the enemy'));
    });
});
