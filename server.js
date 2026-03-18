const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const express = require("express");

puppeteer.use(StealthPlugin());

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const app = express();
const PORT = 3000;
const TIMEOUT = 30_000;

let browser;

async function startBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });
}

app.get("/scrap", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url query parameter is required" });
  }

  let page;
  try {
    page = await browser.newPage();

    await page.setUserAgent(randomUA());
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: TIMEOUT,
    });

    const html = await page.content();
    res.type("html").send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

startBrowser().then(() => {
  app.listen(PORT, () => {
    console.log(`Scraper server running on http://localhost:${PORT}`);
  });
});
