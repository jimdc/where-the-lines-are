var { describe, it, before } = require('node:test');
var assert = require('node:assert/strict');
var crypto = require('node:crypto');
var fs = require('node:fs');
var path = require('node:path');

// Guard against the documented stale-cache failure mode (tasks/lessons.md):
// datasets or UI files change but the service worker keeps serving the old
// bytes because CACHE_NAME wasn't bumped. CACHE_NAME is auto-derived by
// scripts/preprocess.py (sync_sw_cache_name) as a content hash of every file
// in URLS_TO_CACHE. This test recomputes that hash independently and fails
// whenever CACHE_NAME is stale — i.e. someone edited a precached file
// (dataset OR static asset) without running `python3 scripts/preprocess.py sw`.
// The hashing scheme here MUST mirror sync_sw_cache_name(): resolve each URL
// ('./' -> index.html, strip leading './'), dedupe, sort, then
// sha256(path \0 bytes \0 ...) and take the first 12 hex digits.

var ROOT = path.join(__dirname, '..', '..');
var SW_PATH = path.join(ROOT, 'service-worker.js');

var sw, cacheName, urls;

before(function() {
  sw = fs.readFileSync(SW_PATH, 'utf-8');
  var nameMatch = sw.match(/const CACHE_NAME = '([^']*)';/);
  assert.ok(nameMatch, 'CACHE_NAME assignment present in service-worker.js');
  cacheName = nameMatch[1];
  var listMatch = sw.match(/const URLS_TO_CACHE = \[([\s\S]*?)\];/);
  assert.ok(listMatch, 'URLS_TO_CACHE array present in service-worker.js');
  urls = Array.from(listMatch[1].matchAll(/'([^']+)'/g), function(m) { return m[1]; });
});

describe('service worker cache name', function() {
  it('precaches at least the registry, a dataset, and the UI assets', function() {
    assert.ok(urls.includes('./datasets/registry.json'));
    assert.ok(urls.includes('./static/vis.js'));
    assert.ok(urls.includes('./static/styles.css'));
    assert.ok(urls.includes('./index.html'));
  });

  it('every precached file exists', function() {
    for (var i = 0; i < urls.length; i++) {
      var p = resolveUrl(urls[i]);
      assert.ok(fs.statSync(path.join(ROOT, p)).isFile(), p + ' is a file');
    }
  });

  it('CACHE_NAME matches the content hash of the precached files', function() {
    var paths = Array.from(new Set(urls.map(resolveUrl))).sort();
    var h = crypto.createHash('sha256');
    for (var i = 0; i < paths.length; i++) {
      h.update(paths[i], 'utf-8');
      h.update(Buffer.from([0]));
      h.update(fs.readFileSync(path.join(ROOT, paths[i])));
      h.update(Buffer.from([0]));
    }
    var expected = 'ew-cache-' + h.digest('hex').slice(0, 12);
    assert.equal(
      cacheName, expected,
      'stale CACHE_NAME — a precached file changed; run `python3 scripts/preprocess.py sw`'
    );
  });
});

function resolveUrl(u) {
  if (u === './' || u === '.') return 'index.html';
  return u.startsWith('./') ? u.slice(2) : u;
}
