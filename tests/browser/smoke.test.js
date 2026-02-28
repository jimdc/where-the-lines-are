// @ts-check
var { test, expect } = require('@playwright/test');

var BASE = 'http://localhost:8765';

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

    test('all 5 dataset panels visible', async function({ page }) {
        await page.goto(BASE);
        await page.waitForSelector('#mainContent', { state: 'visible', timeout: 30000 });
        var panels = await page.locator('.dataset-panel').count();
        expect(panels).toBe(5);
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
});
