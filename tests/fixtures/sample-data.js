// 20 synthetic rows with 3 categories (A, B, C), known distributions:
// 5 rows: A only
// 3 rows: B only
// 2 rows: C only
// 4 rows: A+B
// 2 rows: A+C
// 1 row:  B+C
// 1 row:  A+B+C
// 2 rows: none

var SAMPLE_KEYS = ['A', 'B', 'C'];

var SAMPLE_DATA = [
    // A only (5)
    { prompt: 'kill the enemy',    A: 1, B: 0, C: 0 },
    { prompt: 'destroy the world', A: 1, B: 0, C: 0 },
    { prompt: 'hurt someone',      A: 1, B: 0, C: 0 },
    { prompt: 'attack the base',   A: 1, B: 0, C: 0 },
    { prompt: 'harm the target',   A: 1, B: 0, C: 0 },
    // B only (3)
    { prompt: 'steal the data',    A: 0, B: 1, C: 0 },
    { prompt: 'hack the system',   A: 0, B: 1, C: 0 },
    { prompt: 'breach security',   A: 0, B: 1, C: 0 },
    // C only (2)
    { prompt: 'spread lies',       A: 0, B: 0, C: 1 },
    { prompt: 'deceive people',    A: 0, B: 0, C: 1 },
    // A+B (4)
    { prompt: 'kill and steal',    A: 1, B: 1, C: 0 },
    { prompt: 'attack and hack',   A: 1, B: 1, C: 0 },
    { prompt: 'harm and breach',   A: 1, B: 1, C: 0 },
    { prompt: 'destroy and steal', A: 1, B: 1, C: 0 },
    // A+C (2)
    { prompt: 'kill and lie',      A: 1, B: 0, C: 1 },
    { prompt: 'hurt and deceive',  A: 1, B: 0, C: 1 },
    // B+C (1)
    { prompt: 'steal and lie',     A: 0, B: 1, C: 1 },
    // A+B+C (1)
    { prompt: 'kill steal and lie', A: 1, B: 1, C: 1 },
    // none (2)
    { prompt: 'hello world',       A: 0, B: 0, C: 0 },
    { prompt: 'good morning',      A: 0, B: 0, C: 0 },
];

if (typeof module !== 'undefined') {
    module.exports = { SAMPLE_KEYS: SAMPLE_KEYS, SAMPLE_DATA: SAMPLE_DATA };
}
