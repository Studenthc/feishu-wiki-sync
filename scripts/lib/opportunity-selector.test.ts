import assert from "node:assert/strict";
import { selectAllOpportunities } from "./opportunity-selector";
import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";

const products: PHProduct[] = [
  {
    id: "spira",
    name: "Spira for Product Hunt Makers",
    tagline: "AI agents for launch social media promotion",
    taglineZh: "面向 Product Hunt 发布者的 AI 社交媒体推广代理",
    description:
      "Plan, create, and publish social content for Product Hunt launches.",
    descriptionZh:
      "帮助 Product Hunt 创作者自动规划、创作和发布社交媒体内容。",
    url: "https://example.com/spira",
    thumbnail: { url: "" },
    reviewsCount: 40,
    commentsCount: 15,
  },
];

const stories: HNStory[] = [
  {
    id: 1,
    title: "HackerRank open sourced their ATS and my resume score changed",
    titleZh: "HackerRank 开源了其 ATS 系统，我的简历得分发生变化",
    url: "https://example.com/ats",
    by: "dan",
    score: 180,
    descendants: 120,
    time: 1_782_662_400,
    summary:
      "Developers discuss ATS resume scoring, resume formatting, and job-search anxiety.",
    summaryZh:
      "开发者讨论 ATS 简历评分、简历格式和求职焦虑。",
    siteName: "example.com",
  },
];

const opportunities = selectAllOpportunities({ products, stories });

assert.equal(opportunities[0].title, "ATS 简历优化检查清单");
assert.equal(opportunities[0].source, "HackerNews");
assert.match(opportunities[0].copyAngle, /程序员 ATS 简历自查清单/);
assert.match(opportunities[0].actionToday[0], /ATS 简历优化/);
assert.match(opportunities[0].doNotCopy, /完整招聘平台/);

const spira = opportunities.find(
  (item) => item.originalName === "Spira for Product Hunt Makers"
);
assert.ok(spira);
assert.match(spira.copyAngle, /Product Hunt 发布当天推广清单/);

const assistantOnly = selectAllOpportunities({
  products: [
    {
      id: "receiptor",
      name: "Receiptor AI Agent Mode",
      tagline: "An agentic bookkeeping assistant",
      description: "A bookkeeping assistant that organizes receipts.",
      url: "https://example.com/receiptor",
      thumbnail: { url: "" },
      reviewsCount: 20,
      commentsCount: 4,
    },
  ],
  stories: [],
});

assert.notEqual(assistantOnly[0]?.title, "ATS 简历优化检查清单");
assert.match(assistantOnly[0]?.title || "", /自由职业者 AI 报销\/记账助手/);

const policyAndSpace = selectAllOpportunities({
  products: [],
  stories: [
    {
      id: 2,
      title: "The KIDS Act would require age checks to get online",
      url: "https://example.com/kids-act",
      by: "eff",
      score: 572,
      descendants: 468,
      time: 1_782_662_400,
      summary:
        "Online services may need age verification, moderation policies, and compliance work.",
      siteName: "eff.org",
    },
    {
      id: 3,
      title: "RocketLab Acquires Iridium",
      url: "https://example.com/rocket",
      by: "space",
      score: 3,
      descendants: 1,
      time: 1_782_662_400,
      summary:
        "A space company combines launch capabilities with a satellite network.",
      siteName: "example.com",
    },
  ],
});

const kidsAct = policyAndSpace.find((item) =>
  item.originalName.includes("KIDS Act")
);
const rocket = policyAndSpace.find((item) =>
  item.originalName.includes("RocketLab")
);

assert.equal(kidsAct?.category, "age_compliance");
assert.match(kidsAct?.copyAngle || "", /年龄验证/);
assert.notEqual(kidsAct?.category, "ai_accounting");
assert.notEqual(rocket?.category, "ph_launch_marketing");

const brandOnly = selectAllOpportunities({
  products: [],
  stories: [
    {
      id: 4,
      title: "Entrepreneur Personal Brand Checklist",
      url: "https://example.com/brand",
      by: "founder",
      score: 8,
      descendants: 1,
      time: 1_782_662_400,
      summary:
        "A founder writes about brand positioning, SEO, social posts, and newsletter distribution.",
      siteName: "example.com",
    },
  ],
});

assert.notEqual(brandOnly[0]?.category, "ai_visibility");
assert.notEqual(brandOnly[0]?.followUpDecision, "验证");

console.log("opportunity selector test passed");
