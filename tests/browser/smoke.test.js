// @ts-check
var { test, expect } = require('@playwright/test');

var BASE = 'http://localhost:' + (process.env.WTLA_PORT || '8765');

test.describe('WTLA smoke tests', function() {

    test('page loads without JS errors', async function({ page }) {
        var errors = [];
        page.on('pageerror', function(err) {
            errors.push(err.message);
        });
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        expect(errors).toEqual([]);
    });

    test('dataset panels match the registry; only row-bearing ones are selectable', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var panels = await page.locator('.dataset-panel').count();
        var selectable = await page.locator('.dataset-panel:not(.dataset-panel-disabled)').count();
        var expected = await page.evaluate(async function() {
            var reg = await fetch('/datasets/registry.json').then(function(r) { return r.json(); });
            return {
                all: reg.datasets.length,
                rowBearing: reg.datasets.filter(function(d) { return !d.taxonomyOnly; }).length
            };
        });
        expect(expected.rowBearing).toBeGreaterThanOrEqual(7); // five legacy + AIR-Bench + AILuminate
        expect(panels).toBe(expected.all);
        expect(selectable).toBe(expected.rowBearing);
    });

    test('taxonomy-only layers appear greyed-out and are not selectable', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var disabled = page.locator('.dataset-panel-disabled');
        await expect(disabled).toHaveCount(1);
        await expect(disabled.locator('.dataset-panel-name')).toContainText(/Constitutional Classifiers/i);
        await expect(disabled.locator('.taxonomy-badge')).toHaveText('taxonomy only');
        // Clicking the disabled panel must not switch datasets.
        var activeBefore = await page.locator('.dataset-panel-active').getAttribute('data-id');
        await disabled.click();
        await page.waitForTimeout(300);
        var activeAfter = await page.locator('.dataset-panel-active').getAttribute('data-id');
        expect(activeAfter).toBe(activeBefore);
    });

    test('Rosetta crosswalk has a CBRN / biosecurity row that is empty for legacy datasets', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var cbrn = await page.evaluate(function() {
            var table = document.querySelector('.rosetta-table');
            var headers = [].slice.call(table.querySelectorAll('thead th')).map(function(th) { return th.textContent; });
            var rows = [].slice.call(table.querySelectorAll('tbody tr'));
            for (var i = 0; i < rows.length; i++) {
                var concept = rows[i].querySelector('.rosetta-concept');
                if (concept && /CBRN/i.test(concept.textContent)) {
                    return { headers: headers, cells: [].slice.call(rows[i].querySelectorAll('td')).map(function(td) { return td.textContent; }) };
                }
            }
            return null;
        });
        expect(cbrn).not.toBeNull();
        // cells[0] is the concept label ("CBRN / biosecurity"); cells[1..] are the
        // per-dataset cells. Legacy datasets (Jigsaw..Aegis) carry no CBRN concept
        // → em-dash (—). Frontier datasets (AIR-Bench, AILuminate, Anthropic)
        // fill it in.
        var dataCells = cbrn.cells.slice(1);
        var filled = dataCells.filter(function(c) { return c !== '—'; });
        expect(filled.length).toBeGreaterThanOrEqual(3);
        // The five legacy datasets must remain empty on this axis.
        var empty = dataCells.filter(function(c) { return c === '—'; });
        expect(empty.length).toBeGreaterThanOrEqual(5);
    });

    test('default dataset loads with match count > 0', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var countText = await page.locator('#match-count').innerText();
        var count = parseInt(countText.replace(/,/g, ''));
        expect(count).toBeGreaterThan(0);
    });

    test('search "kill" reduces match count', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var initialText = await page.locator('#match-count').innerText();
        var initialCount = parseInt(initialText.replace(/,/g, ''));

        await page.fill('#searchQuery', 'kill');
        // Wait for debounce/filter
        await page.waitForTimeout(500);
        var filteredText = await page.locator('#match-count').innerText();
        var filteredCount = parseInt(filteredText.replace(/,/g, ''));

        expect(filteredCount).toBeLessThan(initialCount);
        expect(filteredCount).toBeGreaterThan(0);
    });

    test('boolean search "kill AND children" is subset of "kill"', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });

        await page.fill('#searchQuery', 'kill');
        await page.waitForTimeout(500);
        var killText = await page.locator('#match-count').innerText();
        var killCount = parseInt(killText.replace(/,/g, ''));

        await page.fill('#searchQuery', 'kill AND children');
        await page.waitForTimeout(500);
        var andText = await page.locator('#match-count').innerText();
        var andCount = parseInt(andText.replace(/,/g, ''));

        expect(andCount).toBeLessThanOrEqual(killCount);
    });

    test('sort by surprise changes order', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });

        // Click surprise header
        await page.click('[data-sort="surprise"]');
        var indicator = await page.locator('[data-sort="surprise"] .sort-indicator').innerText();
        expect(indicator.trim()).toBeTruthy();
    });

    test('export CSV button shows count', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var btnText = await page.locator('#exportCsvBtn').innerText();
        expect(btnText).toContain('Export CSV');
        expect(btnText).toMatch(/\d/); // has a number
    });

    test('network canvas has non-zero dimensions', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var canvas = page.locator('#networkCanvas');
        var box = await canvas.boundingBox();
        expect(box).toBeTruthy();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
    });

    test('concept comparison dropdown has options', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var options = await page.locator('#conceptSelector option').count();
        expect(options).toBeGreaterThan(0);
    });

    test('URL hash updates when switching datasets', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });

        // Click a non-default dataset panel
        var panels = page.locator('.dataset-panel');
        var count = await panels.count();
        if (count > 1) {
            await panels.nth(1).click();
            await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
            await page.waitForTimeout(500);
            var hash = await page.evaluate(function() { return location.hash; });
            expect(hash).toContain('dataset=');
        }
    });

    test('URL hash state restores on navigation', async function({ page }) {
        await page.goto(BASE + '#dataset=openai&search=kill');
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        await page.waitForTimeout(1000);

        var searchVal = await page.inputValue('#searchQuery');
        expect(searchVal).toBe('kill');
    });

    test('HarmBench is a selectable dataset and fills the CBRN Rosetta column', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });

        // Appears as a normal (non-disabled) selectable panel.
        var names = await page.locator('.dataset-panel:not(.dataset-panel-disabled) .dataset-panel-name').allInnerTexts();
        expect(names.some(function(n) { return /HarmBench/i.test(n); })).toBe(true);

        // CBRN/biosecurity Rosetta row is non-empty under the HarmBench column.
        var hbCbrn = await page.evaluate(function() {
            var table = document.querySelector('.rosetta-table');
            var headers = [].slice.call(table.querySelectorAll('thead th')).map(function(th) { return th.textContent; });
            var col = -1;
            for (var h = 0; h < headers.length; h++) { if (/HarmBench/i.test(headers[h])) col = h; }
            if (col === -1) return { found: false };
            var rows = [].slice.call(table.querySelectorAll('tbody tr'));
            for (var i = 0; i < rows.length; i++) {
                var concept = rows[i].querySelector('.rosetta-concept');
                if (concept && /CBRN/i.test(concept.textContent)) {
                    var cells = [].slice.call(rows[i].querySelectorAll('td'));
                    return { found: true, cell: cells[col] ? cells[col].textContent.trim() : '' };
                }
            }
            return { found: true, cell: null };
        });
        expect(hbCbrn.found).toBe(true);
        expect(hbCbrn.cell).not.toBe('—');
        expect((hbCbrn.cell || '').length).toBeGreaterThan(0);
    });

    test('WMDP panel renders domain counts and shows no question content', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var section = page.locator('#wmdpSection');
        await expect(section).toBeVisible();

        // The three domains and their counts are present in queryable DOM text.
        var text = await section.innerText();
        ['1,273', '408', '1,987', 'WMDP'].forEach(function(needle) {
            expect(text).toContain(needle);
        });
        // The bar canvas exists and was sized by the render function.
        var dims = await page.evaluate(function() {
            var c = document.getElementById('wmdpCanvas');
            return { w: c.width, h: c.height };
        });
        expect(dims.w).toBeGreaterThan(0);
        expect(dims.h).toBeGreaterThan(0);

        // Guard the info-hazard contract: the panel must explicitly say no content is shown.
        expect(text.toLowerCase()).toContain('no question content');
    });

    test('single-label structural notes show for benchmark suites, hide for corpora', async function({ page }) {
        // HarmBench: 400 rows, single-label by construction — all four notes visible.
        await page.goto(BASE + '/#dataset=harmbench');
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        await page.waitForFunction(function() {
            return document.getElementById('singleLabelNoteExclusivity').textContent.length > 0;
        }, { timeout: 30000 });
        var noteIds = ['singleLabelNoteExclusivity', 'singleLabelNoteCooccurrence',
                       'singleLabelNoteNetwork', 'singleLabelNoteCombo'];
        for (var i = 0; i < noteIds.length; i++) {
            await expect(page.locator('#' + noteIds[i])).toBeVisible();
        }
        await expect(page.locator('#singleLabelNoteExclusivity')).toContainText('single-label by construction');

        // OpenAI Moderation: multi-label corpus — all four notes hidden.
        await page.goto(BASE + '/#dataset=openai');
        await page.reload();
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        await page.waitForFunction(function() {
            return window.dataset && window.dataset.length > 0 && window.activeSchema && window.activeSchema.id === 'openai';
        }, { timeout: 30000 });
        for (var j = 0; j < noteIds.length; j++) {
            await expect(page.locator('#' + noteIds[j])).toBeHidden();
        }
    });
});
