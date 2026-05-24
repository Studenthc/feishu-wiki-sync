import assert from "node:assert/strict";
import { formatOpportunityRadar, type OpportunityRadar } from "./opportunity";

const radar: OpportunityRadar = {
  date: "2026-05-22",
  topOpportunities: [
    {
      title: "AI 会议记忆工具",
      source: "Product Hunt",
      originalName: "Spellar 3.0",
      demand: "团队需要跨会议追踪决策和待办。",
      targetUsers: "销售、咨询顾问、远程团队",
      monetization: "SaaS 订阅或会议模板售卖",
      seoKeywords: ["AI 会议助手", "会议纪要工具", "销售会议记录"],
      siteIdeas: ["AI 会议助手对比页", "会议纪要模板下载"],
      opportunityScore: 4,
      scoreReason: "痛点明确，付费用户清晰。",
      nextValidationStep: "做一页会议工具对比并投放到销售社区。",
      url: "https://example.com/spellar",
    },
  ],
  keywordClusters: [
    {
      cluster: "AI 会议工具",
      keywords: ["AI 会议助手", "会议纪要", "销售跟进"],
      why: "远程团队和销售团队有持续需求。",
    },
  ],
  avoidList: [
    {
      name: "泛 AI 新闻",
      reason: "缺少明确购买动作。",
    },
  ],
  weeklyExperiments: [
    {
      idea: "AI 会议助手对比页",
      landingPageAngle: "对比不同工具在销售跟进中的效果",
      validationStep: "发给 10 个销售团队负责人收反馈。",
    },
  ],
};

const markdown = formatOpportunityRadar(radar);

assert.match(markdown, /# 每日机会雷达 - 2026-05-22/);
assert.match(markdown, /需求判断/);
assert.match(markdown, /AI 会议助手、会议纪要、销售跟进/);
assert.match(markdown, /机会评分\*\*: 4\/5/);

console.log("opportunity formatter test passed");
