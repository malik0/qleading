const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const messages = [];

  page.on("console", (message) => {
    if (message.type() === "error") messages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.stack || error.message}`));

  await page.goto(process.env.CHECK_URL || "https://q.learnhub.page", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  console.log(JSON.stringify({ title: await page.title(), messages }, null, 2));
  await browser.close();
})();
