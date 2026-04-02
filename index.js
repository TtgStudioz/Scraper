const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());

app.get('/scrape', async (req, res) => {
    const { url, selector } = req.query;

    if (!url) {
        return res.status(400).send({ error: 'URL is required' });
    }

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const html = await page.evaluate((sel) => {
            if (sel) {
                const el = document.querySelector(sel);
                return el ? el.innerHTML : null; // ✅ HTML instead of text
            }
            return document.body.innerHTML;
        }, selector);

        await browser.close();

        if (!html) {
            return res.status(404).send({ contents: [] });
        }

        // ✅ Match your OLD API format EXACTLY
        res.send({
            contents: [html]
        });

    } catch (e) {
        console.error(e);
        res.status(500).send({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Scraper API running on http://localhost:${PORT}`);
});
