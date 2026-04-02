const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());

// ✅ Simple in-memory cache
const cache = new Map();
const CACHE_TIME = 60 * 1000; // 1 minute

let browser;

// ✅ Launch browser ONCE
(async () => {
    browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    console.log('✅ Puppeteer browser launched');
})();

// ✅ Scrape endpoint
app.get('/scrape', async (req, res) => {
    const { url, selector } = req.query;

    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    const cacheKey = url + (selector || '');

    // ⚡ Return cached result if available
    if (cache.has(cacheKey)) {
        const { data, time } = cache.get(cacheKey);
        if (Date.now() - time < CACHE_TIME) {
            return res.send(data);
        }
    }

    let page;

    try {
        page = await browser.newPage();

        // ⚡ Block heavy resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // ⚡ Faster load
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        const html = await page.evaluate((sel) => {
            if (sel) {
                const el = document.querySelector(sel);
                return el ? el.innerHTML : null;
            }
            return document.body.innerHTML;
        }, selector);

        const response = {
            contents: html ? [html] : []
        };

        // ✅ Save to cache
        cache.set(cacheKey, {
            data: response,
            time: Date.now()
        });

        res.send(response);

    } catch (e) {
        console.error('❌ Error:', e.message);
        res.status(500).send({ error: e.message });
    } finally {
        if (page) await page.close();
    }
});

// ✅ Start server
app.listen(PORT, () => {
    console.log(`🚀 Scraper API running on http://localhost:${PORT}`);
});
