import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { assertChineseAvailable, getChineseProvider } from "./chinese";

export interface OpportunityInput {
  date: string;
  products: PHProduct[];
  stories: HNStory[];
  maxItems: number;
}

export interface OpportunityItem {
  title: string;
  source: "Product Hunt" | "HackerNews";
  originalName: string;
  demand: string;
  targetUsers: string;
  monetization: string;
  seoKeywords: string[];
  siteIdeas: string[];
  opportunityScore: number;
  scoreReason: string;
  nextValidationStep: string;
  url?: string;
}

export interface OpportunityRadar {
  date: string;
  topOpportunities: OpportunityItem[];
  keywordClusters: {
    cluster: string;
    keywords: string[];
    why: string;
  }[];
  avoidList: {
    name: string;
    reason: string;
  }[];
  weeklyExperiments: {
    idea: string;
    landingPageAngle: string;
    validationStep: string;
  }[];
}

export async function buildOpportunityRadar(
  input: OpportunityInput
): Promise<OpportunityRadar> {
  const provider = getChineseProvider();
  if (!provider) {
    assertChineseAvailable();
    return buildFallbackRadar(input);
  }

  try {
    return await provider.createJson<OpportunityRadar>(
      [
        "你是一个面向独立开发者和内容站站长的需求挖掘分析师。",
        "请从 Product Hunt 和 HackerNews 数据中找适合上站赚钱的机会。",
        "输出必须是中文 JSON，不能包含 Markdown。",
        "判断标准：真实痛点、可搜索需求、可在一周内做 MVP、可通过 SEO/工具站/affiliate/SaaS 变现。",
        "不要只摘要新闻，要输出需求洞察和可执行站点选题。",
        "opportunityScore 必须是 1 到 5 的整数，5 代表最值得本周验证。",
        "seoKeywords 每项 3 到 6 个关键词。",
        "siteIdeas 每项 2 到 4 个具体页面或工具站想法。",
        "weeklyExperiments 给 3 个本周可做的验证实验。",
        "必须使用英文 JSON 键名：date, topOpportunities, keywordClusters, avoidList, weeklyExperiments。",
        "topOpportunities 每一项必须包含这些英文键名：title, source, originalName, demand, targetUsers, monetization, seoKeywords, siteIdeas, opportunityScore, scoreReason, nextValidationStep, url。",
        "keywordClusters 每一项必须包含这些英文键名：cluster, keywords, why。",
        "avoidList 每一项必须包含这些英文键名：name, reason。",
        "weeklyExperiments 每一项必须包含这些英文键名：idea, landingPageAngle, validationStep。",
        "只要输入 products 或 stories 非空，topOpportunities 至少输出 5 项，keywordClusters 至少输出 3 项，avoidList 至少输出 2 项，weeklyExperiments 至少输出 3 项。",
        "不要因为信息不完整而输出空数组；可以基于产品描述、评论数和标题做合理商业假设，并在验证动作里要求人工验证。",
        "严格按这个 JSON 形状输出：",
        '{"date":"YYYY-MM-DD","topOpportunities":[{"title":"中文机会标题","source":"Product Hunt","originalName":"原产品或新闻名","demand":"中文需求判断","targetUsers":"中文目标用户","monetization":"中文变现方式","seoKeywords":["中文关键词"],"siteIdeas":["中文页面或工具想法"],"opportunityScore":4,"scoreReason":"中文评分理由","nextValidationStep":"中文验证动作","url":"https://example.com"}],"keywordClusters":[{"cluster":"中文集群名","keywords":["中文关键词"],"why":"中文理由"}],"avoidList":[{"name":"中文名称","reason":"中文理由"}],"weeklyExperiments":[{"idea":"中文实验","landingPageAngle":"中文落地页角度","validationStep":"中文验证动作"}]}',
      ].join("\n"),
      {
        date: input.date,
        products: input.products.slice(0, input.maxItems).map((product) => ({
          name: product.name,
          tagline: product.taglineZh || product.tagline,
          description: product.descriptionZh || product.description,
          reviewsCount: product.reviewsCount,
          commentsCount: product.commentsCount,
          url: product.url,
        })),
        stories: input.stories.slice(0, input.maxItems).map((story) => ({
          title: story.titleZh || story.title,
          summary: story.summaryZh || story.summary,
          score: story.score,
          commentsCount: story.descendants || 0,
          source: story.siteName,
          url: story.url,
        })),
      }
    ).then((radar) => ensureUsefulRadar(radar, input));
  } catch (error) {
    console.error("机会雷达生成失败，使用本地兜底:", error);
    return buildFallbackRadar(input);
  }
}

function ensureUsefulRadar(
  radar: OpportunityRadar,
  input: OpportunityInput
): OpportunityRadar {
  const hasInput = input.products.length > 0 || input.stories.length > 0;
  const hasUsefulOutput =
    Array.isArray(radar.topOpportunities) &&
    radar.topOpportunities.length > 0 &&
    radar.topOpportunities.every(isUsefulOpportunityItem) &&
    Array.isArray(radar.keywordClusters) &&
    radar.keywordClusters.length > 0 &&
    radar.keywordClusters.every(
      (cluster) =>
        isUsefulText(cluster.cluster) &&
        Array.isArray(cluster.keywords) &&
        cluster.keywords.length > 0 &&
        isUsefulText(cluster.why)
    ) &&
    Array.isArray(radar.weeklyExperiments) &&
    radar.weeklyExperiments.length > 0 &&
    radar.weeklyExperiments.every(
      (experiment) =>
        isUsefulText(experiment.idea) &&
        isUsefulText(experiment.landingPageAngle) &&
        isUsefulText(experiment.validationStep)
    );

  if (!hasInput || hasUsefulOutput) {
    return {
      ...radar,
      date: radar.date || input.date,
      topOpportunities: Array.isArray(radar.topOpportunities)
        ? radar.topOpportunities
        : [],
      keywordClusters: Array.isArray(radar.keywordClusters)
        ? radar.keywordClusters
        : [],
      avoidList: Array.isArray(radar.avoidList) ? radar.avoidList : [],
      weeklyExperiments: Array.isArray(radar.weeklyExperiments)
        ? radar.weeklyExperiments
        : [],
    };
  }

  console.error("机会雷达模型输出为空，使用本地兜底。");
  return buildFallbackRadar(input);
}

function isUsefulOpportunityItem(item: OpportunityItem): boolean {
  return (
    isUsefulText(item.title) &&
    (item.source === "Product Hunt" || item.source === "HackerNews") &&
    isUsefulText(item.originalName) &&
    isUsefulText(item.demand) &&
    isUsefulText(item.targetUsers) &&
    isUsefulText(item.monetization) &&
    Array.isArray(item.seoKeywords) &&
    item.seoKeywords.length > 0 &&
    item.seoKeywords.every(isUsefulText) &&
    Array.isArray(item.siteIdeas) &&
    item.siteIdeas.length > 0 &&
    item.siteIdeas.every(isUsefulText) &&
    Number.isInteger(item.opportunityScore) &&
    item.opportunityScore >= 1 &&
    item.opportunityScore <= 5 &&
    isUsefulText(item.scoreReason) &&
    isUsefulText(item.nextValidationStep)
  );
}

function isUsefulText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && value !== "undefined";
}

export function formatOpportunityRadar(radar: OpportunityRadar): string {
  let md = `# 每日机会雷达 - ${radar.date}\n\n`;
  md += `> 面向上站赚钱：从 Product Hunt / HackerNews 中提取需求、关键词、变现方式和本周验证动作。\n\n`;
  md += `---\n\n`;

  md += `## 最值得研究的机会\n\n`;
  radar.topOpportunities.forEach((item, index) => {
    md += `### ${index + 1}. ${item.title}\n\n`;
    md += `- **来源**: ${item.source} / ${item.originalName}\n`;
    md += `- **需求判断**: ${item.demand}\n`;
    md += `- **目标用户**: ${item.targetUsers}\n`;
    md += `- **变现方式**: ${item.monetization}\n`;
    md += `- **SEO 关键词**: ${item.seoKeywords.join("、")}\n`;
    md += `- **可做选题**: ${item.siteIdeas.join("；")}\n`;
    md += `- **机会评分**: ${item.opportunityScore}/5，${item.scoreReason}\n`;
    md += `- **本周验证**: ${item.nextValidationStep}\n`;
    if (item.url) {
      md += `- **链接**: ${item.url}\n`;
    }
    md += `\n`;
  });

  md += `---\n\n## 关键词集群\n\n`;
  radar.keywordClusters.forEach((cluster) => {
    md += `### ${cluster.cluster}\n\n`;
    md += `- **关键词**: ${cluster.keywords.join("、")}\n`;
    md += `- **为什么值得看**: ${cluster.why}\n\n`;
  });

  md += `---\n\n## 不建议优先做\n\n`;
  radar.avoidList.forEach((item) => {
    md += `- **${item.name}**: ${item.reason}\n`;
  });

  md += `\n---\n\n## 本周可验证实验\n\n`;
  radar.weeklyExperiments.forEach((experiment, index) => {
    md += `${index + 1}. **${experiment.idea}**\n`;
    md += `   - 落地页角度: ${experiment.landingPageAngle}\n`;
    md += `   - 验证动作: ${experiment.validationStep}\n`;
  });

  return md;
}

function buildFallbackRadar(input: OpportunityInput): OpportunityRadar {
  const productItems = input.products.slice(0, input.maxItems).map((product) => ({
    title: `${product.name} 相关需求`,
    source: "Product Hunt" as const,
    originalName: product.name,
    demand:
      product.descriptionZh ||
      product.description ||
      product.taglineZh ||
      product.tagline,
    targetUsers: "需要解决该场景问题的个人用户、团队或小企业",
    monetization: "先用内容页或轻量工具页验证搜索需求，再考虑 SaaS、模板或 affiliate",
    seoKeywords: [
      product.name,
      product.taglineZh || product.tagline,
      `${product.name} 替代品`,
    ],
    siteIdeas: [
      `${product.name} 介绍页`,
      `${product.name} 替代品列表`,
      `${product.name} 使用场景工具页`,
    ],
    opportunityScore: Math.min(5, Math.max(1, Math.ceil((product.commentsCount || 1) / 30))),
    scoreReason: "基于 Product Hunt 评论量做初步热度估计，需要再查搜索需求。",
    nextValidationStep: "搜索相关关键词，记录竞品页面、广告投放和用户抱怨。",
    url: product.url,
  }));

  const storyItems = input.stories.slice(0, input.maxItems).map((story) => ({
    title: story.titleZh || story.title,
    source: "HackerNews" as const,
    originalName: story.title,
    demand:
      story.summaryZh ||
      story.summary ||
      `围绕 ${story.title} 的讨论可能代表一个内容或工具需求。`,
    targetUsers: "关注该技术、工具或市场变化的专业用户",
    monetization: "内容站 SEO、工具页、newsletter 或相关产品 affiliate",
    seoKeywords: [
      story.titleZh || story.title,
      `${story.siteName || "相关"} 工具`,
      "替代方案",
    ],
    siteIdeas: [
      `${story.titleZh || story.title} 解读`,
      "相关工具清单",
      "问题解决指南",
    ],
    opportunityScore: Math.min(5, Math.max(1, Math.ceil((story.descendants || 1) / 80))),
    scoreReason: "基于 HackerNews 评论量做初步热度估计，需要验证是否有商业搜索意图。",
    nextValidationStep: "查看评论区痛点，提取反复出现的问题和付费场景。",
    url: story.url,
  }));

  return {
    date: input.date,
    topOpportunities: [...productItems, ...storyItems].slice(0, input.maxItems),
    keywordClusters: [
      {
        cluster: "AI 工具与自动化",
        keywords: ["AI 工具", "自动化工具", "替代品", "工作流"],
        why: "PH/HN 高频出现，适合做工具对比和场景页面。",
      },
      {
        cluster: "垂直行业小工具",
        keywords: ["在线生成器", "计算器", "模板", "替代品"],
        why: "适合做轻量 SEO 工具页，用搜索流量验证需求。",
      },
      {
        cluster: "合规与效率软件",
        keywords: ["考勤系统", "文档生成", "自动化流程", "小企业软件"],
        why: "目标用户更明确，若痛点强，付费意愿通常高于泛资讯内容。",
      },
    ],
    avoidList: [
      {
        name: "只有热度但无明确付费场景的新闻",
        reason: "容易变成泛资讯，SEO 和变现都不稳定。",
      },
      {
        name: "只适合大型团队的重基础设施产品",
        reason: "个人站长很难复刻，也不容易通过内容站直接变现。",
      },
    ],
    weeklyExperiments: [
      {
        idea: "选择评分最高的一个需求做单页验证",
        landingPageAngle: "围绕一个明确痛点写解决方案和替代品对比",
        validationStep: "发布页面后手动发到相关社区，观察点击、收藏和回复。",
      },
      {
        idea: "做一个长尾关键词工具页",
        landingPageAngle: "把产品描述里的具体任务变成在线生成器、计算器或模板页",
        validationStep: "用 Google 搜索和竞品页面确认是否有自然搜索需求。",
      },
      {
        idea: "写一篇替代品对比页",
        landingPageAngle: "面向预算更低或场景更窄的用户，比较 3 到 5 个替代方案",
        validationStep: "发布后记录收录、点击和外部社区回复，决定是否继续做站群页面。",
      },
    ],
  };
}
