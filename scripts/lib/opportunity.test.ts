import assert from "node:assert/strict";
import { getChineseProvider } from "./chinese";
import { formatOpportunityRadar, type OpportunityRadar } from "./opportunity";

const originalGrsAIKey = process.env.GRSAI_API_KEY;
const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalOpenAIKey = process.env.OPENAI_API_KEY;

process.env.GRSAI_API_KEY = "test-grsai-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.OPENAI_API_KEY = "test-openai-key";
assert.equal(getChineseProvider()?.name, "grsai");

restoreEnv("GRSAI_API_KEY", originalGrsAIKey);
restoreEnv("GEMINI_API_KEY", originalGeminiKey);
restoreEnv("OPENAI_API_KEY", originalOpenAIKey);

const radar: OpportunityRadar = {
  date: "2026-05-22",
  dailyBrief: "今天优先看 AI 会议工具，因为痛点明确且有可搜索关键词。",
  topPicks: [
    {
      title: "AI 会议记忆工具",
      why: "痛点明确，目标用户愿意为效率付费。",
      actionToday: "做一页会议助手对比页并发给销售团队测试。",
    },
  ],
  topOpportunities: [
    {
      title: "AI 会议记忆工具",
      source: "Product Hunt",
      originalName: "Spellar 3.0",
      summary: "一个帮助团队记录会议、追踪决策和待办的 AI 工具。",
      demand: "团队需要跨会议追踪决策和待办。",
      targetUsers: "销售、咨询顾问、远程团队",
      monetization: "SaaS 订阅或会议模板售卖",
      seoKeywords: ["AI 会议助手", "会议纪要工具", "销售会议记录"],
      siteIdeas: ["AI 会议助手对比页", "会议纪要模板下载"],
      scoreBreakdown: {
        realPain: 1,
        searchDemand: 1,
        easyMvp: 1,
        monetizable: 1,
        contentPotential: 0,
      },
      opportunityScore: 4,
      scoreReason: "痛点明确，付费用户清晰。",
      followUpDecision: "是",
      nextValidationStep: "做一页会议工具对比并投放到销售社区。",
      shortVideoAngle: "用 45 秒讲清楚为什么销售团队需要跨会议记忆，再引出工具站机会。",
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
assert.match(markdown, /今日最值得跟进/);
assert.match(markdown, /今天优先看 AI 会议工具/);
assert.match(markdown, /一句话简介/);
assert.match(markdown, /需求判断/);
assert.match(markdown, /建站机会/);
assert.match(markdown, /AI 会议助手、会议纪要、销售跟进/);
assert.match(markdown, /评分拆解\*\*: 真实痛点 1\/1，搜索需求 1\/1/);
assert.match(markdown, /机会评分\*\*: 4\/5/);
assert.match(markdown, /是否值得跟进\*\*: 是/);
assert.match(markdown, /短视频脚本角度/);

console.log("opportunity formatter test passed");

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
