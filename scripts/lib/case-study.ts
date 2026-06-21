import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { assertChineseAvailable, getChineseProvider } from "./chinese";

export interface CaseStudyInput {
  date: string;
  products: PHProduct[];
  stories: HNStory[];
  maxCases: number;
}

export interface ProductCaseStudy {
  title: string;
  source: "Product Hunt" | "HackerNews";
  originalName: string;
  productName: string;
  url?: string;
  launchTime: string;
  paidGrowthSignal: string;
  evidenceLevel: "强证据" | "中证据" | "弱证据";
  whySelected: string;
  problem: string;
  users: string;
  paymentReason: string;
  technicalPrinciple: string;
  copyStrategy: string;
  smallTeamWedges: string[];
  minimumMvp: string;
  validationActions: string[];
  growthReason: string;
  monetizationPath: string;
  risks: string[];
  contentAngle: string;
  missingEvidence: string[];
}

export interface CaseStudyRejectedItem {
  name: string;
  reason: string;
}

export interface CaseStudyReport {
  date: string;
  summary: string;
  cases: ProductCaseStudy[];
  rejected: CaseStudyRejectedItem[];
}

export async function buildCaseStudyReport(
  input: CaseStudyInput
): Promise<CaseStudyReport> {
  const provider = getChineseProvider();
  if (!provider) {
    assertChineseAvailable();
    return buildFallbackCaseStudyReport(input);
  }

  try {
    return await provider.createJson<CaseStudyReport>(
      [
        "你是一个面向独立开发者、小团队和内容站站长的产品案例研究员。",
        "请把 Product Hunt 和 HackerNews 输入拆成类似「可以抄作业的闷声发财产品」的中文案例报告。",
        "目标不是总结新闻，而是拆清楚：谁付费、为什么付费、小团队能抄哪个更窄切口、哪些坑不能踩。",
        "输出必须是中文 JSON，不能包含 Markdown。",
        "PH/HN 热度只是入选线索，不等于真实付费增长。",
        "禁止编造上线时间、收入、上月付费行为陡增百分比、affiliate 计划、融资、用户数。",
        "如果输入没有明确付费增长证据，paidGrowthSignal 必须以「未验证；」开头。",
        "launchTime 没有明确证据时必须写「未验证」。",
        "每个案例必须按 PDF 风格覆盖：名字、网址、上线时间、上月付费行为陡增、解决什么问题、用户是谁、用户为什么付费、技术原理是什么、小团队怎么抄、付费陡增的原因、风险：不要踩什么坑。",
        "用户是谁必须具体到可触达群体，不能只写开发者、创业者、小团队。",
        "用户为什么付费必须离钱近，例如提高转化、降低获客成本、减少人工、提高留存、减少退款、节省 API 成本。",
        "小团队怎么抄必须把大产品缩小到垂直切口，不能建议复制完整产品。",
        "minimumMvp 必须是一周内可做的最小形态：单页、目录、计算器、模板、检查清单、对比页或手工服务。",
        "validationActions 必须是 2 到 4 个今天能做的动作。",
        "risks 必须包含 2 到 4 个具体坑。",
        "missingEvidence 必须写还缺什么证据。",
        "cases 输出 1 到 maxCases 个最值得深拆的案例。",
        "rejected 输出 1 到 3 个不建议深拆的候选及原因。",
        "必须使用英文 JSON 键名：date, summary, cases, rejected。",
        "cases 每一项必须包含这些英文键名：title, source, originalName, productName, url, launchTime, paidGrowthSignal, evidenceLevel, whySelected, problem, users, paymentReason, technicalPrinciple, copyStrategy, smallTeamWedges, minimumMvp, validationActions, growthReason, monetizationPath, risks, contentAngle, missingEvidence。",
        "rejected 每一项必须包含英文键名：name, reason。",
        "严格按这个 JSON 形状输出：",
        '{"date":"YYYY-MM-DD","summary":"中文总览","cases":[{"title":"中文案例标题","source":"Product Hunt","originalName":"原产品或新闻名","productName":"产品名","url":"https://example.com","launchTime":"未验证","paidGrowthSignal":"未验证；当前只有 PH/HN 热度和描述信号","evidenceLevel":"中证据","whySelected":"中文入选理由","problem":"中文说明解决什么问题","users":"中文具体用户","paymentReason":"中文说明用户为什么付费","technicalPrinciple":"中文技术原理","copyStrategy":"中文小团队怎么抄","smallTeamWedges":["中文小切口1"],"minimumMvp":"中文最小 MVP","validationActions":["中文验证动作1","中文验证动作2"],"growthReason":"中文说明为什么可能增长","monetizationPath":"中文变现路径","risks":["中文风险1"],"contentAngle":"中文内容选题角度","missingEvidence":["中文缺失证据1"]}],"rejected":[{"name":"中文名称","reason":"中文原因"}]}',
      ].join("\n"),
      {
        date: input.date,
        maxCases: input.maxCases,
        products: input.products.slice(0, input.maxCases * 2).map((product) => ({
          name: product.name,
          tagline: product.taglineZh || product.tagline,
          description: product.descriptionZh || product.description,
          summary: product.summaryZh,
          reviewsCount: product.reviewsCount,
          commentsCount: product.commentsCount,
          url: product.url,
        })),
        stories: input.stories.slice(0, input.maxCases * 2).map((story) => ({
          title: story.titleZh || story.title,
          summary: story.summaryZh || story.summary,
          score: story.score,
          commentsCount: story.descendants || 0,
          source: story.siteName,
          url: story.url,
        })),
      }
    ).then((report) => ensureUsefulCaseStudyReport(report, input));
  } catch (error) {
    console.error("案例拆解生成失败，使用本地兜底:", error);
    return buildFallbackCaseStudyReport(input);
  }
}

function ensureUsefulCaseStudyReport(
  report: CaseStudyReport,
  input: CaseStudyInput
): CaseStudyReport {
  const hasInput = input.products.length > 0 || input.stories.length > 0;
  const hasUsefulOutput =
    Array.isArray(report.cases) &&
    report.cases.length > 0 &&
    report.cases.every(isUsefulCaseStudy) &&
    Array.isArray(report.rejected) &&
    report.rejected.every(
      (item) => isUsefulText(item.name) && isUsefulText(item.reason)
    );

  if (!hasInput || hasUsefulOutput) {
    return {
      ...report,
      date: report.date || input.date,
      summary: isUsefulText(report.summary)
        ? report.summary
        : "今天的案例拆解已生成，请重点查看用户为什么付费和小团队怎么抄。",
      cases: Array.isArray(report.cases) ? report.cases : [],
      rejected: Array.isArray(report.rejected) ? report.rejected : [],
    };
  }

  console.error("案例拆解模型输出不可用，使用本地兜底。");
  return buildFallbackCaseStudyReport(input);
}

function isUsefulCaseStudy(item: ProductCaseStudy): boolean {
  return (
    isUsefulText(item.title) &&
    (item.source === "Product Hunt" || item.source === "HackerNews") &&
    isUsefulText(item.originalName) &&
    isUsefulText(item.productName) &&
    isUsefulText(item.launchTime) &&
    isUsefulText(item.paidGrowthSignal) &&
    ["强证据", "中证据", "弱证据"].includes(item.evidenceLevel) &&
    isUsefulText(item.whySelected) &&
    isUsefulText(item.problem) &&
    isUsefulText(item.users) &&
    isUsefulText(item.paymentReason) &&
    isUsefulText(item.technicalPrinciple) &&
    isUsefulText(item.copyStrategy) &&
    Array.isArray(item.smallTeamWedges) &&
    item.smallTeamWedges.length > 0 &&
    item.smallTeamWedges.every(isUsefulText) &&
    isUsefulText(item.minimumMvp) &&
    Array.isArray(item.validationActions) &&
    item.validationActions.length > 0 &&
    item.validationActions.every(isUsefulText) &&
    isUsefulText(item.growthReason) &&
    isUsefulText(item.monetizationPath) &&
    Array.isArray(item.risks) &&
    item.risks.length > 0 &&
    item.risks.every(isUsefulText) &&
    isUsefulText(item.contentAngle) &&
    Array.isArray(item.missingEvidence) &&
    item.missingEvidence.length > 0 &&
    item.missingEvidence.every(isUsefulText)
  );
}

function isUsefulText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && value !== "undefined";
}

export function formatCaseStudyReport(report: CaseStudyReport): string {
  let md = `# 可抄作业产品案例拆解 - ${report.date}\n\n`;
  md += `> 目标：从 PH/HN 线索里拆出更像「已付费产品案例」的结构。没有真实付费增长证据时，必须标为未验证。\n\n`;
  md += `**今日判断**: ${report.summary}\n\n`;
  md += `---\n\n`;

  report.cases.forEach((item, index) => {
    md += `## ${index + 1}. ${item.title}\n\n`;
    md += `- **名字**: ${item.productName}\n`;
    md += `- **来源**: ${item.source} / ${item.originalName}\n`;
    md += `- **网址**: ${item.url || "未提供"}\n`;
    md += `- **上线时间**: ${item.launchTime}\n`;
    md += `- **上月付费行为陡增**: ${item.paidGrowthSignal}\n`;
    md += `- **证据等级**: ${item.evidenceLevel}\n`;
    md += `- **为什么入选**: ${item.whySelected}\n\n`;

    md += `### 解决什么问题？\n\n${item.problem}\n\n`;
    md += `### 用户是谁？\n\n${item.users}\n\n`;
    md += `### 用户为什么付费？\n\n${item.paymentReason}\n\n`;
    md += `### 技术原理是什么？\n\n${item.technicalPrinciple}\n\n`;
    md += `### 小团队怎么抄？\n\n${item.copyStrategy}\n\n`;
    md += `可以先从这些更窄切口开始：\n`;
    item.smallTeamWedges.forEach((wedge) => {
      md += `- ${wedge}\n`;
    });
    md += `\n`;
    md += `**最小 MVP**: ${item.minimumMvp}\n\n`;

    md += `### 今天怎么验证？\n\n`;
    item.validationActions.forEach((action, actionIndex) => {
      md += `${actionIndex + 1}. ${action}\n`;
    });
    md += `\n`;

    md += `### 付费陡增的原因\n\n${item.growthReason}\n\n`;
    md += `### 变现路径\n\n${item.monetizationPath}\n\n`;
    md += `### 内容选题角度\n\n${item.contentAngle}\n\n`;
    md += `### 风险：不要踩什么坑\n\n`;
    item.risks.forEach((risk) => {
      md += `- ${risk}\n`;
    });
    md += `\n`;
    md += `### 还缺什么证据？\n\n`;
    item.missingEvidence.forEach((evidence) => {
      md += `- ${evidence}\n`;
    });
    md += `\n---\n\n`;
  });

  md += `## 不建议深拆\n\n`;
  if (report.rejected.length === 0) {
    md += `今天没有明确需要排除的候选。\n`;
  } else {
    report.rejected.forEach((item) => {
      md += `- **${item.name}**: ${item.reason}\n`;
    });
  }

  return md;
}

function buildFallbackCaseStudyReport(input: CaseStudyInput): CaseStudyReport {
  const productCases = input.products.slice(0, input.maxCases).map((product) =>
    buildFallbackProductCase(product)
  );
  const remaining = Math.max(0, input.maxCases - productCases.length);
  const storyCases = input.stories.slice(0, remaining).map((story) =>
    buildFallbackStoryCase(story)
  );
  const cases = [...productCases, ...storyCases];

  return {
    date: input.date,
    summary:
      cases.length > 0
        ? "今天先把 PH/HN 热点当作线索，拆成更接近付费产品案例的结构。所有付费增长信号都需要继续验证。"
        : "今天没有抓到可拆解的候选。",
    cases,
    rejected: [
      {
        name: "只有热度但没有付款动作的泛新闻",
        reason: "这类内容适合做选题，不适合直接当作可抄产品案例。",
      },
    ],
  };
}

function buildFallbackProductCase(product: PHProduct): ProductCaseStudy {
  const summary =
    product.summaryZh ||
    product.descriptionZh ||
    product.description ||
    product.taglineZh ||
    product.tagline;

  return {
    title: `${product.name}：可抄小切口`,
    source: "Product Hunt",
    originalName: product.name,
    productName: product.name,
    url: product.url,
    launchTime: "未验证",
    paidGrowthSignal: "未验证；当前只有 PH 热度和产品描述信号",
    evidenceLevel: "弱证据",
    whySelected: `它在 PH 上有讨论热度，可能代表一个具体场景需求：${summary}`,
    problem: summary,
    users: "需要解决该场景问题的垂直用户，仍需通过搜索和访谈确认。",
    paymentReason:
      "这是待验证假设：如果它能提高收入、减少人工、降低成本或提升交付体验，用户才可能付费。",
    technicalPrinciple:
      "先把产品拆成数据输入、规则处理、页面展示、权限或自动化动作几个基础模块。",
    copyStrategy: "不要复制完整产品，先缩成一个垂直人群的单页工具或模板。",
    smallTeamWedges: [
      `${product.name} 替代品对比页`,
      `${product.name} 使用场景模板`,
      `${product.name} 相关检查清单`,
    ],
    minimumMvp: "一个单页对比页或模板页，先验证搜索和点击，不做完整 SaaS。",
    validationActions: buildFallbackValidationActions([
      product.name,
      product.taglineZh || product.tagline,
      `${product.name} pricing`,
    ]),
    growthReason:
      "如果该方向增长，通常来自目标用户想节省时间、降低成本或提升转化，但当前还没有付费增长证据。",
    monetizationPath:
      "先用 SEO 页面或模板获客，再验证广告、affiliate、模板售卖或轻量订阅。",
    risks: [
      "不要把 PH 评论热度当作真实付费增长。",
      "不要一开始复制完整产品，支持和获客成本会过高。",
    ],
    contentAngle: `为什么 ${product.name} 这个方向可能有人付费？先拆一个更小切口。`,
    missingEvidence: buildFallbackMissingEvidence(),
  };
}

function buildFallbackStoryCase(story: HNStory): ProductCaseStudy {
  const name = story.titleZh || story.title;
  const summary =
    story.summaryZh ||
    story.summary ||
    `围绕「${story.title}」的讨论可能代表一个内容或工具需求。`;

  return {
    title: `${name}：可抄小切口`,
    source: "HackerNews",
    originalName: story.title,
    productName: name,
    url: story.url,
    launchTime: "未验证",
    paidGrowthSignal: "未验证；当前只有 HN 讨论热度和页面摘要信号",
    evidenceLevel: "弱证据",
    whySelected: `它在 HN 上有讨论，可能暴露了一个开发者或专业用户痛点：${summary}`,
    problem: summary,
    users: "关注该技术、工具或市场变化的专业用户，仍需继续缩小人群。",
    paymentReason:
      "这是待验证假设：只有当该问题影响收入、成本、效率或风险时，才有付费理由。",
    technicalPrinciple:
      "先把讨论拆成问题库、检查清单、对比页、计算器或模板，不默认做平台。",
    copyStrategy: "不要复制新闻本身，应该复制它背后的问题解决路径。",
    smallTeamWedges: [
      `${name} 解读页`,
      "相关工具清单",
      "问题检查清单",
    ],
    minimumMvp: "一个问题清单或工具目录页，先验证搜索需求和社区反馈。",
    validationActions: buildFallbackValidationActions([
      name,
      story.siteName || "相关工具",
      "alternative",
    ]),
    growthReason:
      "如果该方向增长，通常来自讨论背后的风险、成本或效率问题被更多用户遇到。",
    monetizationPath:
      "先用内容页获得搜索或社区流量，再验证赞助、affiliate、模板或咨询转化。",
    risks: [
      "不要把 HN 情绪当作真实购买意图。",
      "不要做泛资讯站，必须落到具体工具或模板。",
    ],
    contentAngle: `这条 HN 讨论背后，真正能抄的是哪个小工具？`,
    missingEvidence: buildFallbackMissingEvidence(),
  };
}

function buildFallbackValidationActions(keywords: string[]): string[] {
  const keywordText = keywords.filter(Boolean).slice(0, 3).join("、");
  return [
    `搜索 ${keywordText}，记录前 10 个结果的页面形态和变现方式。`,
    "找 5 个相邻竞品，记录它们是否有定价页、广告、affiliate 或模板售卖。",
    "写一个单页 MVP 草图，发给 3 个潜在用户或相关社区收反馈。",
  ];
}

function buildFallbackMissingEvidence(): string[] {
  return [
    "没有真实付费增长数据。",
    "没有搜索量数据。",
    "没有竞品变现证据。",
    "没有目标用户访谈。",
  ];
}
