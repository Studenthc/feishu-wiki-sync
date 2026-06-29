import assert from "node:assert/strict";
import { formatHNStories, formatPHProducts } from "./formatter";
import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";

const products: PHProduct[] = Array.from({ length: 7 }, (_, index) => ({
  id: `${index + 1}`,
  name: index === 0 ? "AI Gateway" : `Product ${index + 1}`,
  tagline: index === 0 ? "Route prompts across models" : "Useful product",
  description:
    index === 0
      ? "Compare AI model cost, token usage, and prompt routing."
      : "A useful product for teams.",
  url: `https://example.com/product-${index + 1}`,
  thumbnail: { url: "" },
  reviewsCount: 30 - index,
  commentsCount: 20 - index,
}));

const phMarkdown = formatPHProducts(products, "popular");

assert.match(phMarkdown, /今天先看这 1 个/);
assert.match(phMarkdown, /可抄切口/);
assert.match(phMarkdown, /30 分钟验证/);
assert.match(phMarkdown, /不要抄什么/);
assert.match(phMarkdown, /其余候选只做索引/);
assert.match(phMarkdown, /AI 工具成本计算器或替代品对比页/);
assert.doesNotMatch(phMarkdown, /## 2\. Product 2/);

const stories: HNStory[] = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  title:
    index === 0
      ? "OpenAI API pricing is confusing"
      : index === 1
        ? "Marfa Public Radio Puts You to Sleep"
        : index === 2
          ? "Show HN: A Self-Hosted LinkedIn Profile"
          : `Story ${index + 1}`,
  url: `https://example.com/story-${index + 1}`,
  by: "pg",
  score: index === 1 ? 500 : 200 - index,
  descendants: index === 1 ? 300 : 120 - index,
  time: 1_782_662_400,
  summary:
    index === 0
      ? "Developers discuss token pricing, model choice, and operational costs."
      : index === 1
        ? "A radio station page that helps listeners sleep."
        : index === 2
          ? "A self-hosted profile page that developers can deploy."
      : "A story with discussion.",
  siteName: "example.com",
}));

const hnMarkdown = formatHNStories(stories, "top");

assert.match(hnMarkdown, /今天先看这 2 条/);
assert.match(hnMarkdown, /可抄切口/);
assert.match(hnMarkdown, /30 分钟验证/);
assert.match(hnMarkdown, /不要抄什么/);
assert.match(hnMarkdown, /其余候选只做索引/);
assert.match(hnMarkdown, /AI 工具成本计算器或替代品对比页/);
assert.match(hnMarkdown, /Self-Hosted LinkedIn Profile/);
assert.doesNotMatch(hnMarkdown, /Marfa Public Radio Puts You to Sleep\*\*：做一个 AI 工具成本/);
assert.doesNotMatch(hnMarkdown, /## 6\. Story 6/);

const aiVisibilityMarkdown = formatHNStories(
  [
    {
      id: 99,
      title: "Are You Recommended by AI?",
      url: "https://example.com/ai-visibility",
      by: "aykhanstoic",
      score: 2,
      descendants: 1,
      time: 1_782_662_400,
      summary:
        "Find out if ChatGPT, Claude, Gemini and Perplexity recommend your business or your competitors. Get your AI Visibility Audit today.",
      siteName: "example.com",
    },
  ],
  "new"
);

assert.match(aiVisibilityMarkdown, /手工版 AI 可见度审计报告/);
assert.doesNotMatch(aiVisibilityMarkdown, /安全检查清单/);

const researchMarkdown = formatHNStories(
  [
    {
      id: 100,
      title: "Programmable Probabilistic Computer with 1M p-bits",
      url: "https://example.com/research",
      by: "researcher",
      score: 1,
      descendants: 0,
      time: 1_782_662_400,
      summary:
        "Probabilistic computers have been proposed as hardware accelerators for sampling and optimizing Ising models.",
      siteName: "example.com",
    },
  ],
  "new"
);

assert.doesNotMatch(researchMarkdown, /AI 工具成本、模型选择或替代品对比页/);

const weakNewsMarkdown = formatHNStories(
  [
    {
      id: 101,
      title: "Gen Z's AI problem isn't about AI",
      url: "https://example.com/ai-opinion",
      by: "writer",
      score: 3,
      descendants: 0,
      time: 1_782_662_400,
      summary:
        "A cultural essay about students, schools, and changing technology habits.",
      siteName: "example.com",
    },
  ],
  "new"
);

assert.match(weakNewsMarkdown, /今天没有强候选/);
assert.doesNotMatch(weakNewsMarkdown, /今天先看这 1 条/);
assert.doesNotMatch(weakNewsMarkdown, /AI 工具成本、模型选择或替代品对比页/);

console.log("formatter test passed");
