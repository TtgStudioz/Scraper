const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // 1. Import cors
const app = express();
const PORT = 4000;

app.use(cors()); // 2. Enable CORS for all routes
app.get('/scrape', async (req, res) => {
    const { url, selector } = req.query; // Now accepting a 'selector' parameter

    if (!url) return res.status(400).send({ error: 'URL is required' });

    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // If a selector is provided, find that specific element. 
        // Otherwise, get the whole body.
        const data = await page.evaluate((sel) => {
            if (sel) {
                const el = document.querySelector(sel);
                return el ? el.innerText : "Selector not found";
            }
            return document.body.innerText;
        }, selector);

        await browser.close();
        res.send({ data });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Scraper API running on http://localhost:${PORT}`);
});