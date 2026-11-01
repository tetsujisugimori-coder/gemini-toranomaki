// Isolated, signed-out probe. Never run in a personal browser profile.
// PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright node scripts/chapter-2-embed-poc.mjs
import process from "node:process";
import console from "node:console";
import { chromium, webkit } from "@playwright/test";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const { stdout } = await promisify(execFile)("curl", [
  "-sS",
  "-I",
  "-L",
  "--max-time",
  "30",
  "https://gemini.google.com/",
]);
const headerLines = stdout.split(/\r?\n/);
const summary = {
  observedAt: new Date().toISOString(),
  observedAtJST:
    new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }) + " JST",
  authentication: "NOT_TESTED (fresh signed-out contexts only)",
  headers: {
    statuses: headerLines.filter((x) => /^HTTP\//i.test(x)),
    xFrameOptions: headerLines.filter((x) => /^x-frame-options:/i.test(x)),
    cspFrameAncestors: headerLines
      .filter((x) => /^content-security-policy:/i.test(x))
      .map((x) => x.match(/frame-ancestors[^;]*/i)?.[0])
      .filter(Boolean),
  },
  browsers: [],
  signedIn: "NOT_TESTED",
  actualIPhoneAndroid: "NOT_TESTED",
  userDataAccess: "NONE",
};
const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    '<!doctype html><title>Isolated embed PoC</title><h1>Signed-out Gemini iframe probe</h1><iframe title="Gemini probe" src="https://gemini.google.com/"></iframe>',
  );
});
await new Promise((resolve) => server.listen(4189, "127.0.0.1", resolve));
try {
  for (const [name, type] of [
    ["chromium", chromium],
    ["webkit", webkit],
  ]) {
    const browser = await type.launch({
      proxy: process.env.HTTPS_PROXY
        ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" }
        : undefined,
    });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      const evidence = [];
      page.on("console", (m) => {
        if (/frame|X-Frame|refused/i.test(m.text()))
          evidence.push(m.text().slice(0, 600));
      });
      page.on("response", (r) => {
        if (r.url() === "https://gemini.google.com/")
          evidence.push(
            `Gemini response ${r.status()} X-Frame-Options=${r.headers()["x-frame-options"] ?? "absent"}`,
          );
      });
      page.on("requestfailed", (r) => {
        if (r.url() === "https://gemini.google.com/")
          evidence.push(`Gemini request failure: ${r.failure()?.errorText}`);
      });
      await page.goto("http://127.0.0.1:4189");
      await page.waitForTimeout(4000); // bounded observation window, not proof of auth compatibility
      summary.browsers.push({
        name,
        version: browser.version(),
        evidence,
        frameURLs: page.frames().map((f) => f.url()),
        result: evidence.some((x) =>
          /X-Frame-Options.*deny|X-Frame-Options.*DENY|refused.*display|refused.*frame/i.test(
            x,
          ),
        )
          ? "BLOCKED"
          : "UNKNOWN",
      });
      await context.close();
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
console.log(JSON.stringify(summary, null, 2));
