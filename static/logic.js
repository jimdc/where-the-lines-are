/* ── Pure logic functions extracted from index.html ──
 * No DOM access, no global mutation.
 * Browser: loaded via <script> tag (globals).
 * Node:    loaded via require() (module.exports).
 */

/* ── URL State ── */
function parseHash(hashStr) {
    var h = (hashStr || '').replace(/^#/, '');
    if (!h) return { dataset: null };
    // Backward compat: bare dataset id like #openai
    if (h.indexOf('=') === -1) return { dataset: h };

    var params = {};
    h.split('&').forEach(function(part) {
        var eq = part.indexOf('=');
        if (eq > 0) {
            params[part.slice(0, eq)] = decodeURIComponent(part.slice(eq + 1));
        }
    });
    return {
        dataset: params.dataset || null,
        include: params.include ? params.include.split(',') : [],
        exclude: params.exclude ? params.exclude.split(',') : [],
        search: params.search || '',
        order: params.order || ''
    };
}

/* ── Text utilities ── */
function csvEscape(val) {
    var s = String(val == null ? '' : val);
    if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    });
}

function normalizePrompt(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function highlightPrompt(text, search, searchTerms) {
    if (!search && (!searchTerms || !searchTerms.length)) return escapeHtml(text);
    var terms = searchTerms && searchTerms.length ? searchTerms : [search];
    // Build single regex from all terms
    var escaped = terms.filter(Boolean).map(function(t) {
        return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    if (!escaped.length) return escapeHtml(text);
    var regex = new RegExp('(' + escaped.join('|') + ')', 'gi');
    var last = 0, out = '', match;
    while ((match = regex.exec(text)) !== null) {
        out += escapeHtml(text.slice(last, match.index));
        out += '<mark>' + escapeHtml(match[0]) + '</mark>';
        last = match.index + match[0].length;
    }
    out += escapeHtml(text.slice(last));
    return out;
}

/* ── Boolean Search Parser ── */
function tokenizeQuery(input) {
    var tokens = [];
    var i = 0;
    while (i < input.length) {
        // Skip whitespace
        if (input[i] === ' ' || input[i] === '\t') { i++; continue; }
        // Quoted phrase
        if (input[i] === '"') {
            var end = input.indexOf('"', i + 1);
            if (end === -1) end = input.length;
            tokens.push({ type: 'TERM', value: input.slice(i + 1, end).toLowerCase() });
            i = end + 1;
            continue;
        }
        // Read word
        var start = i;
        while (i < input.length && input[i] !== ' ' && input[i] !== '\t' && input[i] !== '"') i++;
        var word = input.slice(start, i);
        var upper = word.toUpperCase();
        if (upper === 'AND') tokens.push({ type: 'AND' });
        else if (upper === 'OR') tokens.push({ type: 'OR' });
        else if (upper === 'NOT') tokens.push({ type: 'NOT' });
        else tokens.push({ type: 'TERM', value: word.toLowerCase() });
    }
    return tokens;
}

function parseQuery(tokens) {
    var pos = 0;
    function parseOr() {
        var left = parseAnd();
        while (pos < tokens.length && tokens[pos].type === 'OR') {
            pos++;
            var right = parseAnd();
            left = { type: 'OR', left: left, right: right };
        }
        return left;
    }
    function parseAnd() {
        var left = parseNot();
        while (pos < tokens.length && (tokens[pos].type === 'AND' || tokens[pos].type === 'TERM' || tokens[pos].type === 'NOT')) {
            if (tokens[pos].type === 'AND') pos++;
            var right = parseNot();
            left = { type: 'AND', left: left, right: right };
        }
        return left;
    }
    function parseNot() {
        if (pos < tokens.length && tokens[pos].type === 'NOT') {
            pos++;
            var operand = parseNot();
            return { type: 'NOT', operand: operand };
        }
        return parsePrimary();
    }
    function parsePrimary() {
        if (pos < tokens.length && tokens[pos].type === 'TERM') {
            var node = { type: 'TERM', value: tokens[pos].value };
            pos++;
            return node;
        }
        // Fallback: treat as empty match-all
        return { type: 'TERM', value: '' };
    }
    if (tokens.length === 0) return null;
    var ast = parseOr();
    return ast;
}

function evalQuery(ast, text) {
    if (!ast) return true;
    switch (ast.type) {
        case 'TERM': return ast.value === '' || text.indexOf(ast.value) !== -1;
        case 'AND': return evalQuery(ast.left, text) && evalQuery(ast.right, text);
        case 'OR': return evalQuery(ast.left, text) || evalQuery(ast.right, text);
        case 'NOT': return !evalQuery(ast.operand, text);
    }
    return true;
}

function extractTerms(ast) {
    if (!ast) return [];
    switch (ast.type) {
        case 'TERM': return ast.value ? [ast.value] : [];
        case 'AND': return extractTerms(ast.left).concat(extractTerms(ast.right));
        case 'OR': return extractTerms(ast.left).concat(extractTerms(ast.right));
        case 'NOT': return []; // Skip NOT branches for highlighting
    }
    return [];
}

function buildSearchFn(rawQuery) {
    var query = rawQuery.trim();
    if (!query) return null;
    // Fast path: single word without operators
    if (!/\b(AND|OR|NOT)\b/.test(query) && query.indexOf('"') === -1 && query.indexOf(' ') === -1) {
        var lower = query.toLowerCase();
        return {
            test: function(text) { return text.toLowerCase().indexOf(lower) !== -1; },
            terms: [lower],
            description: lower
        };
    }
    var tokens = tokenizeQuery(query);
    var ast = parseQuery(tokens);
    if (!ast) return null;
    var terms = extractTerms(ast);
    // Build description from tokens
    var desc = tokens.map(function(t) {
        if (t.type === 'TERM') return '"' + t.value + '"';
        return t.type;
    }).join(' ');
    return {
        test: function(text) { return evalQuery(ast, text.toLowerCase()); },
        terms: terms,
        description: desc
    };
}

/* ── Counting functions ── */
function countSingleCategories(data, keys) {
    var counts = {};
    keys.forEach(function(k) { counts[k] = 0; });
    data.forEach(function(row) {
        keys.forEach(function(k) {
            if (row[k] === 1) counts[k]++;
        });
    });
    return counts;
}

function countPairwise(data, keys) {
    var counts = {};
    for (var i = 0; i < keys.length; i++) {
        for (var j = i + 1; j < keys.length; j++) {
            counts[keys[i] + '+' + keys[j]] = 0;
        }
    }
    data.forEach(function(row) {
        for (var i = 0; i < keys.length; i++) {
            for (var j = i + 1; j < keys.length; j++) {
                if (row[keys[i]] === 1 && row[keys[j]] === 1) {
                    var pair = keys[i] + '+' + keys[j];
                    counts[pair] = (counts[pair] || 0) + 1;
                }
            }
        }
    });
    return counts;
}

function countCombinations(data, keys) {
    var counts = {};
    data.forEach(function(row) {
        var keys1 = keys.filter(function(k) { return row[k] === 1; }).sort();
        var combo = keys1.join('+') || 'none';
        counts[combo] = (counts[combo] || 0) + 1;
    });
    return counts;
}

function countExclusivity(data, keys) {
    var exclusive = {};
    var shared = {};
    keys.forEach(function(k) { exclusive[k] = 0; shared[k] = 0; });

    data.forEach(function(row) {
        var flagged = keys.filter(function(k) { return row[k] === 1; });
        if (flagged.length === 1) {
            exclusive[flagged[0]]++;
        } else if (flagged.length > 1) {
            flagged.forEach(function(k) { shared[k]++; });
        }
    });

    return { exclusive: exclusive, shared: shared };
}

/* ── Surprise metric helpers ── */
function getComboKey(row, keys) {
    var flagged = keys.filter(function(k) { return row[k] === 1; }).sort();
    return flagged.join('+') || 'none';
}

function computeSurpriseScore(row, keys, comboFreqs) {
    var combo = getComboKey(row, keys);
    var freq = (comboFreqs && comboFreqs[combo]) || 1;
    return 1 / freq;
}

/* ── Math ── */
function computeCohensKappa(a11, a10, a01, a00) {
    // a11=both agree yes, a10=r0 yes r1 no, a01=r0 no r1 yes, a00=both agree no
    var total = a11 + a10 + a01 + a00;
    if (total === 0) return 0;
    var po = (a11 + a00) / total; // observed agreement
    var pe1 = ((a11 + a10) / total) * ((a11 + a01) / total);
    var pe0 = ((a00 + a01) / total) * ((a00 + a10) / total);
    var pe = pe1 + pe0; // expected agreement
    if (pe >= 1) return 1;
    return (po - pe) / (1 - pe);
}

/* ── UMD export ── */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseHash: parseHash,
        csvEscape: csvEscape,
        escapeHtml: escapeHtml,
        normalizePrompt: normalizePrompt,
        highlightPrompt: highlightPrompt,
        tokenizeQuery: tokenizeQuery,
        parseQuery: parseQuery,
        evalQuery: evalQuery,
        extractTerms: extractTerms,
        buildSearchFn: buildSearchFn,
        countSingleCategories: countSingleCategories,
        countPairwise: countPairwise,
        countCombinations: countCombinations,
        countExclusivity: countExclusivity,
        getComboKey: getComboKey,
        computeSurpriseScore: computeSurpriseScore,
        computeCohensKappa: computeCohensKappa
    };
}
