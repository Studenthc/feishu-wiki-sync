import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { assertChineseAvailable, getChineseProvider } from "./chinese";
import { selectAllOpportunities, type SelectedOpportunity } from "./opportunity-selector";

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
  summary: string;
  demand: string;
  targetUsers: string;
  monetization: string;
  seoKeywords: string[];
  siteIdeas: string[];
  scoreBreakdown: {
    painEvidence: number;
    searchIntent: number;
    monetizationProof: number;
    mvpFit: number;
    contentFit: number;
  };
  opportunityScore: number;
  scoreReason: string;
  evidenceLevel: "强证据" | "中证据" | "弱证据";
  followUpDecision: "验证" | "观察" | "放弃";
  nextValidationStep: string;
  actionToday: string[];
  missingEvidence: string[];
  contentAngle: string;
  buildAngle: string;
  shortVideoAngle: string;
  url?: string;
}

export interface OpportunityRadar {
  date: string;
  dailyBrief: string;
  topOpportunities: OpportunityItem[];
  topPicks: {
    title: string;
    why: string;
    actionToday: string;
  }[];
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
        "你是一个面向独立开发者、内容站站长和短视频创作者的需求验证分析师。",
        "请从 Product Hunt 和 HackerNews 数据中找可验证的机会，不要把热点直接包装成确定能赚钱的项目。",
        "输出必须是中文 JSON，不能包含 Markdown。",
        "核心原则：PH/HN 热度只是线索，不是需求证明。没有搜索量、竞品变现、用户抱怨或付费场景时，必须标为弱证据或观察。",
        "输出要服务四个目的：1) 今天拍什么短视频；2) 今天写什么 SEO 内容；3) 今天验证什么小工具；4) 今天明确不该做什么。",
        "不要建议直接注册域名或搭建完整网站，除非 evidenceLevel 是 强证据。",
        "每个机会都必须包含 missingEvidence，明确写出还缺什么证据。",
        "actionToday 必须是 2 到 4 个 30 分钟内能完成的动作，例如搜关键词、找竞品、看定价页、看 affiliate、写一条脚本、发一个帖子收反馈。",
        "buildAngle 必须是最小站点形态，例如对比页、计算器、模板页、检查清单、目录页、教程页。不要默认做 SaaS。",
        "contentAngle 必须像真人短视频选题，讲具体冲突、具体人群、具体场景，不要写泛泛的商业术语。",
        "评分标准是证据评分，不是想象空间评分。",
        "每个机会都必须用 1 句 summary 说明它是什么。",
        "opportunityScore 必须是 1 到 5 的整数，5 代表最值得本周验证，不代表直接开做完整产品。",
        "scoreBreakdown 是 5 个 0/1 分项：painEvidence, searchIntent, monetizationProof, mvpFit, contentFit。",
        "painEvidence=1 表示输入里能看到具体痛点或强讨论；searchIntent=1 表示能推导出明确搜索词；monetizationProof=1 表示有清晰付费、广告、affiliate、模板或工具变现路径；mvpFit=1 表示一周内能做出轻量页面或工具；contentFit=1 表示适合拍成普通人听得懂的短视频或图文。",
        "opportunityScore 必须等于 scoreBreakdown 五项之和；如果总分为 0，opportunityScore 输出 1。",
        "evidenceLevel 只能是 强证据、中证据、弱证据。只有同时具备痛点、搜索意图、变现证据时才能是强证据。",
        "followUpDecision 只能是 验证、观察、放弃。4-5 分一般是 验证，3 分一般是 观察，1-2 分一般是 放弃。",
        "topPicks 输出 1 个今日最推荐验证的机会，必须来自 topOpportunities。除非没有任何可验证线索，不要输出多个主推。",
        "topPicks.actionToday 必须是当天最小动作，不允许写注册域名、搭建完整网站、做完整 SaaS。",
        "必须在 dailyBrief 里明确写今天主机会是什么，以及为什么其他机会不如它。",
        "weeklyExperiments 给 3 个本周可做的验证实验，每个实验必须能用手工或单页完成。",
        "必须使用英文 JSON 键名：date, dailyBrief, topPicks, topOpportunities, keywordClusters, avoidList, weeklyExperiments。",
        "topPicks 每一项必须包含这些英文键名：title, why, actionToday。",
        "topOpportunities 每一项必须包含这些英文键名：title, source, originalName, summary, demand, targetUsers, monetization, seoKeywords, siteIdeas, scoreBreakdown, opportunityScore, scoreReason, evidenceLevel, followUpDecision, nextValidationStep, actionToday, missingEvidence, contentAngle, buildAngle, shortVideoAngle, url。",
        "keywordClusters 每一项必须包含这些英文键名：cluster, keywords, why。",
        "avoidList 每一项必须包含这些英文键名：name, reason。",
        "weeklyExperiments 每一项必须包含这些英文键名：idea, landingPageAngle, validationStep。",
        "只要输入 products 或 stories 非空，topOpportunities 输出 1 到 maxItems 项，不要超过 maxItems；keywordClusters 至少输出 2 项，avoidList 至少输出 2 项，weeklyExperiments 至少输出 3 项。",
        "严格按这个 JSON 形状输出：",
        '{"date":"YYYY-MM-DD","dailyBrief":"中文今日总览","topPicks":[{"title":"中文机会标题","why":"中文推荐理由","actionToday":"中文今日最小动作"}],"topOpportunities":[{"title":"中文机会标题","source":"Product Hunt","originalName":"原产品或新闻名","summary":"中文一句话简介","demand":"中文需求判断","targetUsers":"中文目标用户","monetization":"中文变现方式","seoKeywords":["中文关键词"],"siteIdeas":["中文页面或工具想法"],"scoreBreakdown":{"painEvidence":1,"searchIntent":1,"monetizationProof":0,"mvpFit":1,"contentFit":1},"opportunityScore":4,"scoreReason":"中文评分理由","evidenceLevel":"中证据","followUpDecision":"验证","nextValidationStep":"中文验证动作","actionToday":["中文今日动作1","中文今日动作2"],"missingEvidence":["中文缺失证据1"],"contentAngle":"中文内容选题角度","buildAngle":"中文最小建站角度","shortVideoAngle":"中文短视频讲法","url":"https://example.com"}],"keywordClusters":[{"cluster":"中文集群名","keywords":["中文关键词"],"why":"中文理由"}],"avoidList":[{"name":"中文名称","reason":"中文理由"}],"weeklyExperiments":[{"idea":"中文实验","landingPageAngle":"中文落地页角度","validationStep":"中文验证动作"}]}',
      ].join("\n"),
      {
        date: input.date,
        maxItems: input.maxItems,
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
      dailyBrief: isUsefulText(radar.dailyBrief)
        ? radar.dailyBrief
        : "今天的机会雷达已生成，请优先查看高分机会和本周验证动作。",
      topPicks: Array.isArray(radar.topPicks) ? radar.topPicks : [],
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
    isUsefulText(item.summary) &&
    isUsefulText(item.demand) &&
    isUsefulText(item.targetUsers) &&
    isUsefulText(item.monetization) &&
    Array.isArray(item.seoKeywords) &&
    item.seoKeywords.length > 0 &&
    item.seoKeywords.every(isUsefulText) &&
    Array.isArray(item.siteIdeas) &&
    item.siteIdeas.length > 0 &&
    item.siteIdeas.every(isUsefulText) &&
    isValidScoreBreakdown(item.scoreBreakdown) &&
    Number.isInteger(item.opportunityScore) &&
    item.opportunityScore >= 1 &&
    item.opportunityScore <= 5 &&
    item.opportunityScore === getScoreFromBreakdown(item.scoreBreakdown) &&
    isUsefulText(item.scoreReason) &&
    ["强证据", "中证据", "弱证据"].includes(item.evidenceLevel) &&
    ["验证", "观察", "放弃"].includes(item.followUpDecision) &&
    isUsefulText(item.nextValidationStep) &&
    Array.isArray(item.actionToday) &&
    item.actionToday.length > 0 &&
    item.actionToday.every(isUsefulText) &&
    Array.isArray(item.missingEvidence) &&
    item.missingEvidence.length > 0 &&
    item.missingEvidence.every(isUsefulText) &&
    isUsefulText(item.contentAngle) &&
    isUsefulText(item.buildAngle) &&
    isUsefulText(item.shortVideoAngle)
  );
}

function isValidScoreBreakdown(value: unknown): value is OpportunityItem["scoreBreakdown"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const breakdown = value as Record<string, unknown>;
  return [
    breakdown.painEvidence,
    breakdown.searchIntent,
    breakdown.monetizationProof,
    breakdown.mvpFit,
    breakdown.contentFit,
  ].every((score) => score === 0 || score === 1);
}

function getScoreFromBreakdown(
  breakdown: OpportunityItem["scoreBreakdown"]
): number {
  const score =
    breakdown.painEvidence +
    breakdown.searchIntent +
    breakdown.monetizationProof +
    breakdown.mvpFit +
    breakdown.contentFit;

  return Math.max(1, score);
}

function isUsefulText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && value !== "undefined";
}

export function formatOpportunityRadar(radar: OpportunityRadar): string {
  let md = `# 每日机会雷达 - ${radar.date}\n\n`;
  md += `> 面向上站赚钱：从 Product Hunt / HackerNews 中提取需求、关键词、变现方式、验证动作和自媒体选题角度。\n\n`;
  md += `**今日判断**: ${radar.dailyBrief}\n\n`;
  md += formatMainOpportunity(radar);
  md += `---\n\n`;

  md += `## 今日最值得验证\n\n`;
  if (radar.topPicks.length === 0) {
    md += `今天没有明显值得马上验证的机会，建议只观察关键词和讨论方向。\n\n`;
  } else {
    radar.topPicks.forEach((pick, index) => {
      md += `${index + 1}. **${pick.title}**\n`;
      md += `   - 推荐理由: ${pick.why}\n`;
      md += `   - 今日最小动作: ${pick.actionToday}\n`;
    });
    md += `\n`;
  }

  md += `---\n\n`;

  md += `## 最值得研究的机会\n\n`;
  radar.topOpportunities.forEach((item, index) => {
    md += `### ${index + 1}. ${item.title}\n\n`;
    md += `- **来源**: ${item.source} / ${item.originalName}\n`;
    md += `- **一句话简介**: ${item.summary}\n`;
    md += `- **需求判断**: ${item.demand}\n`;
    md += `- **目标用户**: ${item.targetUsers}\n`;
    md += `- **建站机会**: ${item.siteIdeas.join("；")}\n`;
    md += `- **SEO 关键词**: ${item.seoKeywords.join("、")}\n`;
    md += `- **变现方式**: ${item.monetization}\n`;
    md += `- **评分拆解**: 痛点证据 ${item.scoreBreakdown.painEvidence}/1，搜索意图 ${item.scoreBreakdown.searchIntent}/1，变现证据 ${item.scoreBreakdown.monetizationProof}/1，MVP 适配 ${item.scoreBreakdown.mvpFit}/1，内容适配 ${item.scoreBreakdown.contentFit}/1\n`;
    md += `- **机会评分**: ${item.opportunityScore}/5，${item.scoreReason}\n`;
    md += `- **证据等级**: ${item.evidenceLevel}\n`;
    md += `- **是否值得跟进**: ${item.followUpDecision}\n`;
    md += `- **最小建站角度**: ${item.buildAngle}\n`;
    md += `- **内容选题角度**: ${item.contentAngle}\n`;
    md += `- **本周验证**: ${item.nextValidationStep}\n`;
    md += `- **今日动作**:\n`;
    item.actionToday.forEach((action) => {
      md += `  - ${action}\n`;
    });
    md += `- **缺少证据**:\n`;
    item.missingEvidence.forEach((evidence) => {
      md += `  - ${evidence}\n`;
    });
    md += `- **短视频脚本角度**: ${item.shortVideoAngle}\n`;
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

function formatMainOpportunity(radar: OpportunityRadar): string {
  const main = getMainOpportunity(radar);
  if (!main) {
    return `## 今日主机会\n\n今天没有足够明确的主机会，建议只观察，不要开做。\n\n`;
  }

  return [
    "## 今日主机会",
    "",
    `**${main.title}**`,
    "",
    `- **为什么是它**: ${main.scoreReason}`,
    `- **先做什么**: ${main.buildAngle}`,
    `- **今天 30 分钟动作**: ${main.actionToday[0] || main.nextValidationStep}`,
    `- **不要做什么**: 不要做完整 SaaS，不要注册一堆域名，不要把热点当作付费证据。`,
    `- **放弃标准**: ${main.missingEvidence[0] || "如果找不到搜索、竞品变现或用户痛点证据，今天就降级为素材。"}`,
    "",
  ].join("\n");
}

function getMainOpportunity(radar: OpportunityRadar): OpportunityItem | undefined {
  const pickTitle = radar.topPicks[0]?.title;
  const byPick = radar.topOpportunities.find((item) => item.title === pickTitle);
  if (byPick) {
    return byPick;
  }

  return [...radar.topOpportunities].sort((a, b) => {
    const scoreDelta = b.opportunityScore - a.opportunityScore;
    if (scoreDelta !== 0) {
      return scoreDelta;
    }
    return Number(b.followUpDecision === "验证") - Number(a.followUpDecision === "验证");
  })[0];
}

function buildFallbackActions(keywords: string[]): string[] {
  const keywordText = keywords.filter(Boolean).slice(0, 3).join("、");
  return [
    `搜索 ${keywordText}，记录前 10 个结果是否有工具页、对比页、广告或定价页。`,
    "找 5 个竞品或相邻页面，记录它们靠订阅、广告、联盟、模板还是咨询变现。",
    "写 1 条 45 秒短视频脚本，只讲一个具体痛点和一个最小验证动作。",
  ];
}

function buildFallbackMissingEvidence(): string[] {
  return [
    "还没有搜索量数据。",
    "还没有确认竞品是否真实变现。",
    "还没有从目标用户处拿到直接反馈。",
  ];
}

function buildFallbackRadar(input: OpportunityInput): OpportunityRadar {
  const selected = selectAllOpportunities(input).slice(0, input.maxItems);
  const topOpportunities = selected.map(toOpportunityItem);
  const main = topOpportunities[0];

  return {
    date: input.date,
    dailyBrief:
      main
        ? `今天主机会是「${main.title}」。先用 30 分钟验证搜索、竞品变现和用户痛点；其他热点只当素材，不要分散开做。`
        : "今天没有抓到可分析内容。",
    topPicks: topOpportunities
      .slice(0, 1)
      .map((item) => ({
        title: item.title,
        why: `${item.evidenceLevel}，${item.scoreReason}`,
        actionToday: item.actionToday[0],
      })),
    topOpportunities,
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

function toOpportunityItem(item: SelectedOpportunity): OpportunityItem {
  return {
    title: item.title,
    source: item.source,
    originalName: item.originalName,
    summary: item.summary,
    demand: item.demand,
    targetUsers: item.targetUsers,
    monetization: item.monetization,
    seoKeywords: item.seoKeywords,
    siteIdeas: item.siteIdeas,
    scoreBreakdown: buildFallbackScoreBreakdown(item.score),
    opportunityScore: item.score,
    scoreReason: item.scoreReason,
    evidenceLevel: item.evidenceLevel,
    followUpDecision: item.followUpDecision,
    nextValidationStep: item.actionToday[0],
    actionToday: item.actionToday,
    missingEvidence: item.missingEvidence,
    contentAngle: item.contentAngle,
    buildAngle: item.buildAngle,
    shortVideoAngle: item.shortVideoAngle,
    url: item.url,
  };
}

function buildFallbackScoreBreakdown(
  score: number
): OpportunityItem["scoreBreakdown"] {
  return {
    painEvidence: score >= 1 ? 1 : 0,
    searchIntent: score >= 2 ? 1 : 0,
    monetizationProof: score >= 4 ? 1 : 0,
    mvpFit: score >= 3 ? 1 : 0,
    contentFit: score >= 5 ? 1 : 0,
  };
}

function getFollowUpDecision(score: number): OpportunityItem["followUpDecision"] {
  if (score >= 4) {
    return "验证";
  }

  if (score === 3) {
    return "观察";
  }

  return "放弃";
}

function getEvidenceLevel(score: number): OpportunityItem["evidenceLevel"] {
  if (score >= 5) {
    return "强证据";
  }

  if (score >= 3) {
    return "中证据";
  }

  return "弱证据";
}
