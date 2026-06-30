import assert from "node:assert/strict";
import {
  buildCaseStudyReport,
  formatCaseStudyReport,
  normalizeCaseStudyReportForTest,
  type CaseStudyReport,
} from "./case-study";
import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { selectAllOpportunities } from "./opportunity-selector";

const report: CaseStudyReport = {
  date: "2026-06-21",
  summary:
    "今天只深拆 2 个更接近付费场景的产品。重点不是复制大产品，而是拆出小团队能做的垂直切口。",
  cases: [
    {
      title: "AI API 成本控制计算器",
      source: "Product Hunt",
      originalName: "Respan Gateway",
      productName: "Respan Gateway",
      url: "https://example.com/respan",
      launchTime: "未验证",
      paidGrowthSignal: "未验证；当前只有 PH 评论和产品描述信号",
      evidenceLevel: "中证据",
      whySelected:
        "它指向 AI API 成本控制这个离钱很近的问题，适合先做计算器或对比页验证。",
      problem:
        "小团队接多个模型后，很难看清每月 API 成本、缓存收益和模型路由策略。",
      users: "使用多个 AI API 的独立开发者、SaaS 小团队、AI 工具站站长",
      paymentReason:
        "用户付费不是为了买网关概念，而是为了少花 API 钱、减少排查时间、避免账单失控。",
      technicalPrinciple:
        "本质是统一代理层，加上模型路由、缓存、日志、成本统计和告警。",
      copyStrategy:
        "不要抄完整 AI Gateway，先抄一个更窄的 AI API 成本计算器。",
      copyThis:
        "只做 AI API 月账单估算器，面向已有 AI 工具站的独立开发者。",
      doNotCopy: "不要做完整网关、统一代理层和团队权限系统。",
      smallTeamWedges: [
        "Claude / Gemini / DeepSeek 成本对比页",
        "AI API 月账单估算器",
        "AI API 缓存收益计算器",
      ],
      minimumMvp:
        "一个单页计算器：输入模型、调用量、输入输出 token，输出月成本和省钱建议。",
      validationActions: [
        "搜索 AI API cost calculator，记录前 10 个结果的页面形态和变现方式。",
        "找 5 个 AI 工具站开发者，问他们是否遇到 API 成本失控。",
        "用 Google Sheet 做一个成本计算器原型，发到开发者社区收反馈。",
      ],
      todayExecutionPlan: [
        "搜索 AI API cost calculator 和 AI API pricing calculator，截图前 10 个页面。",
        "写一个页面标题：AI API 月账单估算器。",
        "用表格列出 5 个常用模型的输入输出价格。",
      ],
      growthReason:
        "AI API 调用量持续增长，小团队会越来越在意成本、缓存和模型切换。",
      monetizationPath:
        "先用 SEO 和免费计算器获客，再通过模板、赞助、affiliate 或轻量监控工具变现。",
      risks: [
        "不要一开始做完整网关，基础设施产品支持成本很高。",
        "不要编造 affiliate 或付费增长数据，必须先验证。",
      ],
      contentAngle:
        "我每月 AI API 账单为什么涨到 500 美元？用一个表算清楚。",
      missingEvidence: [
        "没有真实搜索量数据。",
        "没有确认 Respan 是否有公开 affiliate。",
        "没有直接用户访谈。",
      ],
      killCriteria: [
        "搜索结果没有任何商业化页面。",
        "5 个开发者都说 API 成本不是当前痛点。",
        "页面无法做成计算器、模板或对比页。",
      ],
    },
  ],
  rejected: [
    {
      name: "泛 AI 新闻",
      reason: "只有话题热度，没有明确付款动作。",
    },
  ],
};

const markdown = formatCaseStudyReport(report);

assert.match(markdown, /# 可抄作业产品案例拆解 - 2026-06-21/);
assert.match(markdown, /解决什么问题/);
assert.match(markdown, /用户为什么付费/);
assert.match(markdown, /技术原理是什么/);
assert.match(markdown, /小团队怎么抄/);
assert.match(markdown, /证据快照/);
assert.match(markdown, /已确认/);
assert.match(markdown, /未验证/);
assert.match(markdown, /下一步补证/);
assert.match(markdown, /今天只看这一个/);
assert.match(markdown, /直接抄这个/);
assert.match(markdown, /不要抄这个/);
assert.match(markdown, /今天 30 分钟执行/);
assert.match(markdown, /什么时候放弃/);
assert.match(markdown, /放弃标准/);
assert.match(markdown, /风险：不要踩什么坑/);
assert.match(markdown, /上月付费行为陡增\*\*: 未验证/);
assert.match(markdown, /AI API 月账单估算器/);
assert.match(markdown, /今天只深拆 2 个/);

console.log("case study formatter test passed");

const originalKeys = {
  APIMART_TEXT_API_KEY: process.env.APIMART_TEXT_API_KEY,
  APIMART_API_KEY: process.env.APIMART_API_KEY,
  GRSAI_API_KEY: process.env.GRSAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  REQUIRE_CHINESE: process.env.REQUIRE_CHINESE,
};

delete process.env.APIMART_TEXT_API_KEY;
delete process.env.APIMART_API_KEY;
delete process.env.GRSAI_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.OPENAI_API_KEY;
delete process.env.REQUIRE_CHINESE;

const fallbackProducts: PHProduct[] = [
  {
    id: "spira",
    name: "Spira for Product Hunt Makers",
    tagline: "AI agents for Product Hunt launch promotion",
    description: "Create and publish social posts for Product Hunt launches.",
    url: "https://example.com/spira",
    thumbnail: { url: "" },
    reviewsCount: 60,
    commentsCount: 20,
  },
];

const fallbackStories: HNStory[] = [
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
    siteName: "example.com",
  },
];

const fallbackReport = await buildCaseStudyReport({
  date: "2026-06-29",
  products: fallbackProducts,
  stories: fallbackStories,
  maxCases: 1,
});

assert.equal(fallbackReport.cases[0]?.productName, "ATS 简历优化检查清单");
assert.match(fallbackReport.cases[0]?.copyThis || "", /程序员 ATS 简历自查清单/);
assert.match(fallbackReport.summary, /ATS 简历优化检查清单/);

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

const preferredCaseOpportunity = selectAllOpportunities({
  products: [databoxProduct],
  stories: [vpnStory],
})[0];

const normalizedCaseReport = normalizeCaseStudyReportForTest(
  {
    date: "2026-06-30",
    summary: "本次分析围绕 Databox 展开。",
    cases: [
      {
        title: "Databox AI 报告模板站",
        source: "Product Hunt",
        originalName: "Databox Skills Marketplace",
        productName: "Databox",
        url: "https://example.com/databox",
        launchTime: "未验证",
        paidGrowthSignal: "未验证；当前只有 PH 热度。",
        evidenceLevel: "中证据",
        whySelected: "模型错误选择 Databox。",
        problem: "需要报告模板。",
        users: "营销人员",
        paymentReason: "节省报告制作时间。",
        technicalPrinciple: "模板整理。",
        copyStrategy: "做报告模板站。",
        smallTeamWedges: ["报告模板"],
        minimumMvp: "一页模板目录。",
        validationActions: ["搜索 AI analytics report template。"],
        growthReason: "报告需求。",
        monetizationPath: "广告。",
        risks: ["不要编造付费数据。"],
        contentAngle: "报告模板。",
        missingEvidence: ["缺少付费证据。"],
        copyThis: "做报告模板站。",
        doNotCopy: "不要做完整 BI。",
        todayExecutionPlan: ["搜索关键词。"],
        killCriteria: ["没有商业页面就放弃。"],
      },
    ],
    rejected: [],
  },
  preferredCaseOpportunity,
  {
    date: "2026-06-30",
    products: [databoxProduct],
    stories: [vpnStory],
    maxCases: 1,
  }
);

assert.equal(preferredCaseOpportunity?.title, "VPN 信任度与替代品对比");
assert.equal(
  normalizedCaseReport.cases[0]?.productName,
  preferredCaseOpportunity?.title
);
assert.match(normalizedCaseReport.summary, /VPN 信任度与替代品对比/);

restoreKeys(originalKeys);

function restoreKeys(values: Record<string, string | undefined>) {
  Object.entries(values).forEach(([name, value]) => {
    if (value === undefined) {
      delete process.env[name];
      return;
    }
    process.env[name] = value;
  });
}
