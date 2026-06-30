import assert from "node:assert/strict";
import { getChineseProvider } from "./chinese";
import {
  formatOpportunityRadar,
  normalizeOpportunityRadarForTest,
  type OpportunityRadar,
} from "./opportunity";
import { selectAllOpportunities } from "./opportunity-selector";
import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";

const originalGrsAIKey = process.env.GRSAI_API_KEY;
const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalOpenAIKey = process.env.OPENAI_API_KEY;
const originalAPIMartTextKey = process.env.APIMART_TEXT_API_KEY;
const originalAPIMartKey = process.env.APIMART_API_KEY;

process.env.APIMART_TEXT_API_KEY = "test-apimart-key";
process.env.GRSAI_API_KEY = "test-grsai-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.OPENAI_API_KEY = "test-openai-key";
assert.equal(getChineseProvider()?.name, "apimart");

delete process.env.APIMART_TEXT_API_KEY;
delete process.env.APIMART_API_KEY;
assert.equal(getChineseProvider()?.name, "grsai");

restoreEnv("APIMART_TEXT_API_KEY", originalAPIMartTextKey);
restoreEnv("APIMART_API_KEY", originalAPIMartKey);
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
        painEvidence: 1,
        searchIntent: 1,
        monetizationProof: 1,
        mvpFit: 1,
        contentFit: 0,
      },
      opportunityScore: 4,
      scoreReason: "痛点明确，付费用户清晰，但还需要确认中文搜索需求。",
      evidenceLevel: "中证据",
      followUpDecision: "验证",
      nextValidationStep: "做一页会议工具对比并投放到销售社区。",
      actionToday: [
        "搜索 AI 会议助手、会议纪要工具、销售会议记录 这 3 个关键词。",
        "找 5 个竞品页面，记录是否有定价页、广告、联盟计划或模板售卖。",
        "写 1 条 45 秒短视频，讲清楚销售团队为什么需要跨会议记忆。",
      ],
      missingEvidence: [
        "没有搜索量数据。",
        "没有确认中文用户是否主动搜索。",
        "没有确认 affiliate 或模板售卖能否成交。",
      ],
      contentAngle: "销售团队开完会最怕的不是没纪要，而是下次完全接不上上次承诺。",
      buildAngle: "先做会议助手对比页和会议纪要模板页，不做完整 SaaS。",
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
assert.match(markdown, /今日最值得验证/);
assert.match(markdown, /今天优先看 AI 会议工具/);
assert.match(markdown, /一句话简介/);
assert.match(markdown, /需求判断/);
assert.match(markdown, /建站机会/);
assert.match(markdown, /AI 会议助手、会议纪要、销售跟进/);
assert.match(markdown, /评分拆解\*\*: 痛点证据 1\/1，搜索意图 1\/1，变现证据 1\/1/);
assert.match(markdown, /机会评分\*\*: 4\/5/);
assert.match(markdown, /证据等级\*\*: 中证据/);
assert.match(markdown, /是否值得跟进\*\*: 验证/);
assert.match(markdown, /今日动作/);
assert.match(markdown, /搜索 AI 会议助手、会议纪要工具、销售会议记录/);
assert.match(markdown, /缺少证据/);
assert.match(markdown, /没有搜索量数据/);
assert.match(markdown, /先做会议助手对比页和会议纪要模板页，不做完整 SaaS/);
assert.match(markdown, /短视频脚本角度/);

const databoxProduct: PHProduct = {
  id: "databox",
  name: "Databox Skills Marketplace",
  tagline: "AI analytics report skills",
  description: "A marketplace for analytics reports and AI skills.",
  url: "https://example.com/databox",
  thumbnail: { url: "" },
  reviewsCount: 2,
  commentsCount: 10,
};

const vpnStory: HNStory = {
  id: 99,
  title: "European Digital Identity Wallet is a gift to Google and Apple",
  titleZh: "欧洲数字身份钱包是送给谷歌和苹果的礼物",
  url: "https://example.com/eu-wallet",
  by: "privacy",
  score: 52,
  descendants: 18,
  time: 1_782_662_400,
  summary:
    "Privacy-focused discussion about trust, VPN alternatives, and platform lock-in.",
  summaryZh: "围绕隐私、信任和 VPN 替代品的讨论。",
  siteName: "example.com",
};

const preferred = selectAllOpportunities({
  products: [databoxProduct],
  stories: [vpnStory],
})[0];

const normalized = normalizeOpportunityRadarForTest(
  {
    date: "2026-06-30",
    dailyBrief: "今日主机会是 Databox 的 AI 分析技能库。",
    topPicks: [
      {
        title: "AI 分析技能库教程与模板站",
        why: "模型错误选择了另一个机会。",
        actionToday: "搜索 AI analytics report template。",
      },
    ],
    topOpportunities: [
      {
        title: "AI 分析技能库教程与模板站",
        source: "Product Hunt",
        originalName: "Databox Skills Marketplace",
        summary: "Databox 技能市场。",
        demand: "营销人员需要报告模板。",
        targetUsers: "营销人员",
        monetization: "广告或模板售卖",
        seoKeywords: ["AI analytics report template"],
        siteIdeas: ["AI 报告模板站"],
        scoreBreakdown: {
          painEvidence: 1,
          searchIntent: 1,
          monetizationProof: 0,
          mvpFit: 1,
          contentFit: 1,
        },
        opportunityScore: 4,
        scoreReason: "模型给出的错误主机会。",
        evidenceLevel: "中证据",
        followUpDecision: "验证",
        nextValidationStep: "搜索关键词。",
        actionToday: ["搜索 AI analytics report template。"],
        missingEvidence: ["缺少付费证据。"],
        contentAngle: "报告模板怎么做。",
        buildAngle: "教程页。",
        shortVideoAngle: "讲报告模板。",
        url: "https://example.com/databox",
      },
    ],
    keywordClusters: [
      {
        cluster: "AI 报告模板",
        keywords: ["AI analytics report template", "Databox skills"],
        why: "模型错误选择的关键词集群。",
      },
    ],
    avoidList: [
      {
        name: "泛报告资讯",
        reason: "缺少明确付费动作。",
      },
    ],
    weeklyExperiments: [
      {
        idea: "Databox 教程页",
        landingPageAngle: "写一个 AI 报告模板教程。",
        validationStep: "搜索关键词并记录竞品。",
      },
    ],
  },
  preferred,
  {
    date: "2026-06-30",
    products: [databoxProduct],
    stories: [vpnStory],
    maxItems: 3,
  }
);

assert.equal(preferred?.title, "VPN 信任度与替代品对比");
assert.equal(normalized.topPicks[0]?.title, preferred?.title);
assert.equal(normalized.topOpportunities[0]?.title, preferred?.title);
assert.match(normalized.dailyBrief, /VPN 信任度与替代品对比/);

console.log("opportunity formatter test passed");

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
