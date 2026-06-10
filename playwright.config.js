var { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/browser',
    timeout: 60000,
    use: {
        baseURL: 'http://localhost:' + (process.env.WTLA_PORT || '8765'),
        headless: true,
    },
});
