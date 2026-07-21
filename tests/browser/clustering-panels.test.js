// @ts-check
var { test, expect } = require('@playwright/test');
var path = require('node:path');
var fs = require('node:fs');

var BASE = 'http://localhost:' + (process.env.WTLA_PORT || '8765');
var SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

var VIEWPORTS = [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'desktop-1440', width: 1440, height: 900 }
];

test.describe('Category coherence + Annotation outliers panels', function() {
    test.beforeAll(function() {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    });

    VIEWPORTS.forEach(function(vp) {
        test('renders both panels with no horizontal overflow at ' + vp.name, async function({ page }) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto(BASE + '#dataset=openai');
            await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });

            // Both panels are conditional on precomputed data loading in after the
            // main dataset switch -- wait for them to become visible rather than
            // assuming they're present on first paint.
            await page.waitForSelector('#coherenceSection', { state: 'visible', timeout: 30000 });
            await page.waitForSelector('#outliersSection', { state: 'visible', timeout: 30000 });

            var coherenceRows = await page.locator('#coherenceTable table tbody tr').count();
            var outlierRows = await page.locator('#outliersTable table tbody tr').count();
            expect(coherenceRows).toBeGreaterThan(0);
            expect(outlierRows).toBeGreaterThan(0);

            // No horizontal overflow at the page level: wide tables must scroll
            // inside their own .table-responsive container, not widen the body.
            var overflow = await page.evaluate(function() {
                return document.documentElement.scrollWidth - window.innerWidth;
            });
            expect(overflow).toBeLessThanOrEqual(1); // 1px tolerance for scrollbar rounding

            // Viewport-clipped (not full-element): the outliers table alone can
            // run to ~200 rows, so a full-element shot of either panel would be
            // an unreviewably tall image. Scroll each section's top edge to the
            // top of the viewport so the screenshot always shows its header row.
            await page.locator('#coherenceSection').evaluate(function(el) { el.scrollIntoView({ block: 'start' }); });
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'coherence-' + vp.name + '.png') });
            await page.locator('#outliersSection').evaluate(function(el) { el.scrollIntoView({ block: 'start' }); });
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'outliers-' + vp.name + '.png') });
        });
    });

    test('Category coherence table is sorted ascending and shows concept + concentration + examples', async function({ page }) {
        await page.goto(BASE + '#dataset=openai');
        await page.waitForSelector('#coherenceSection', { state: 'visible', timeout: 30000 });

        var headers = await page.locator('#coherenceTable table thead th').allInnerTexts();
        expect(headers.join(' ')).toMatch(/Concept/);
        expect(headers.join(' ')).toMatch(/concentration/i);

        var pcts = await page.locator('#coherenceTable table tbody tr td:nth-child(3) .surprise-label').allInnerTexts();
        var values = pcts.map(function(t) { return parseInt(t, 10); });
        for (var i = 1; i < values.length; i++) {
            expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
        }
    });

    test('Annotation outliers table is sorted ascending by homogeneity and shows excerpt + labels + neighbor concepts', async function({ page }) {
        await page.goto(BASE + '#dataset=openai');
        await page.waitForSelector('#outliersSection', { state: 'visible', timeout: 30000 });

        var headers = await page.locator('#outliersTable table thead th').allInnerTexts();
        expect(headers.join(' ')).toMatch(/excerpt/i);
        expect(headers.join(' ')).toMatch(/Homogeneity/);

        var firstRowExcerpt = await page.locator('#outliersTable table tbody tr').first().locator('td').first().innerText();
        expect(firstRowExcerpt.length).toBeGreaterThan(0);

        var pcts = await page.locator('#outliersTable table tbody tr td:nth-child(4) .surprise-label').allInnerTexts();
        var values = pcts.map(function(t) { return parseInt(t, 10); });
        for (var i = 1; i < values.length; i++) {
            expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
        }
    });

    test('both panels rebuild when switching datasets', async function({ page }) {
        // The hash is read only at initial boot (no hashchange listener), so
        // switching datasets in-session means clicking a dataset panel, same
        // as every other reactive-rebuild test in smoke.test.js.
        await page.goto(BASE + '#dataset=openai');
        await page.waitForSelector('#coherenceSection', { state: 'visible', timeout: 30000 });
        var openaiConcepts = await page.locator('#coherenceTable table tbody tr').count();

        await page.locator('.dataset-panel[data-id="aegis"]').click();
        await page.waitForSelector('#coherenceSection', { state: 'visible', timeout: 30000 });
        await page.waitForSelector('#outliersSection', { state: 'visible', timeout: 30000 });
        await page.waitForFunction(function() {
            return window.activeSchema && window.activeSchema.id === 'aegis';
        }, { timeout: 30000 });
        var aegisConcepts = await page.locator('#coherenceTable table tbody tr').count();

        // Aegis has far more Rosetta concepts represented than OpenAI's 6 categories.
        expect(aegisConcepts).toBeGreaterThan(openaiConcepts);
    });
});
