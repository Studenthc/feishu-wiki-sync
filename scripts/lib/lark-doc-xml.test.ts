import assert from "node:assert/strict";
import { formatPHProducts } from "./formatter";
import { markdownToLarkXml, sanitizeLarkMarkdown } from "./lark-doc-xml";
import type { PHProduct } from "./product-hunt";

const product: PHProduct = {
  id: "1",
  name: "Skybridge & Co",
  tagline: "Build MCP apps",
  taglineZh: "构建 MCP 应用",
  description: "A framework for apps inside AI assistants.",
  descriptionZh: "一个运行在 AI 助手里的应用框架。",
  summaryZh: "用 React 构建 MCP 应用。",
  url: "https://www.producthunt.com/products/skybridge?utm_campaign=x&utm_medium=y",
  thumbnail: {
    url: "https://ph-files.imgix.net/example.png?auto=format",
  },
  reviewsCount: 12,
  commentsCount: 3,
};

const markdown = formatPHProducts([product], "popular");
const xml = markdownToLarkXml("Product Hunt 热门产品 - 2026-06-22", markdown);

assert.match(xml, /^<title>Product Hunt 热门产品 - 2026-06-22<\/title>/);
assert.match(xml, /<h2>今天先看这 1 个<\/h2>/);
assert.match(xml, /<h2>1\. Skybridge &amp; Co<\/h2>/);
assert.match(xml, /<p><b>一句话<\/b>: 用 React 构建 MCP 应用。<\/p>/);
assert.match(xml, /<b>可抄切口<\/b>/);
assert.match(xml, /<b>30 分钟验证<\/b>/);
assert.match(
  xml,
  /<li><b>链接<\/b>: <a href="https:\/\/www\.producthunt\.com\/products\/skybridge\?utm_campaign=x&amp;utm_medium=y">访问产品<\/a><\/li>/
);
assert.doesNotMatch(xml, /\]\(null\)/);

const sanitized = sanitizeLarkMarkdown(markdown);
assert.match(sanitized, /## 1\. Skybridge & Co/);
assert.match(sanitized, /\[访问产品\]\(https:\/\/www\.producthunt\.com\/products\/skybridge/);
assert.doesNotMatch(sanitized, /!\[\]\(/);

console.log("lark doc xml formatter test passed");
