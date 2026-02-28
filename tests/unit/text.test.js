var { describe, it } = require('node:test');
var assert = require('node:assert/strict');
var {
    csvEscape, escapeHtml, normalizePrompt, highlightPrompt
} = require('../../static/logic.js');

describe('csvEscape', function() {
    it('plain string unchanged', function() {
        assert.equal(csvEscape('hello'), 'hello');
    });

    it('wraps string with comma', function() {
        assert.equal(csvEscape('a,b'), '"a,b"');
    });

    it('escapes double quotes', function() {
        assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
    });

    it('wraps string with newline', function() {
        assert.equal(csvEscape('a\nb'), '"a\nb"');
    });

    it('null becomes empty string', function() {
        assert.equal(csvEscape(null), '');
    });

    it('number becomes string', function() {
        assert.equal(csvEscape(42), '42');
    });
});

describe('escapeHtml', function() {
    it('escapes ampersand', function() {
        assert.equal(escapeHtml('a&b'), 'a&amp;b');
    });

    it('escapes less-than', function() {
        assert.equal(escapeHtml('<div>'), '&lt;div&gt;');
    });

    it('escapes double quote', function() {
        assert.equal(escapeHtml('"hi"'), '&quot;hi&quot;');
    });

    it('escapes single quote', function() {
        assert.equal(escapeHtml("it's"), "it&#039;s");
    });

    it('handles mixed special chars', function() {
        assert.equal(escapeHtml('<a href="x">&'), '&lt;a href=&quot;x&quot;&gt;&amp;');
    });
});

describe('normalizePrompt', function() {
    it('lowercases and trims', function() {
        assert.equal(normalizePrompt('  Hello World  '), 'hello world');
    });

    it('collapses whitespace', function() {
        assert.equal(normalizePrompt('a   b\tc'), 'a b c');
    });

    it('handles null', function() {
        assert.equal(normalizePrompt(null), '');
    });

    it('handles empty string', function() {
        assert.equal(normalizePrompt(''), '');
    });
});

describe('highlightPrompt', function() {
    it('no search returns escaped text', function() {
        assert.equal(highlightPrompt('<b>hi</b>', '', []), '&lt;b&gt;hi&lt;/b&gt;');
    });

    it('single term gets marked', function() {
        var result = highlightPrompt('kill the enemy', 'kill', ['kill']);
        assert.equal(result, '<mark>kill</mark> the enemy');
    });

    it('multi-term highlight', function() {
        var result = highlightPrompt('kill the enemy', '', ['kill', 'enemy']);
        assert.ok(result.includes('<mark>kill</mark>'));
        assert.ok(result.includes('<mark>enemy</mark>'));
    });

    it('no match returns escaped text', function() {
        var result = highlightPrompt('hello world', 'xyz', ['xyz']);
        assert.equal(result, 'hello world');
    });

    it('HTML entities in source are escaped', function() {
        var result = highlightPrompt('a < b & c', 'b', ['b']);
        assert.ok(result.includes('&lt;'));
        assert.ok(result.includes('&amp;'));
        assert.ok(result.includes('<mark>b</mark>'));
    });

    it('case-insensitive matching', function() {
        var result = highlightPrompt('Kill the Enemy', '', ['kill']);
        assert.ok(result.includes('<mark>Kill</mark>'));
    });
});
