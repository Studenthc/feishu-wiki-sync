import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { assertChineseAvailable, getChineseProvider } from "./chinese";
import { selectAllOpportunities, type SelectedOpportunity } from "./opportunity-selector";

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
  copyThis?: string;
  doNotCopy?: string;
  todayExecutionPlan?: string[];
  killCriteria?: string[];
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
  const preferredOpportunity = selectAllOpportunities(input)[0];
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
        "默认只选最值得今天动手验证的少数案例。宁可少，不要泛。",
        "如果输入里有 preferredOpportunity，必须优先围绕它深拆，除非它缺少基本标题或摘要。",
        "如果没有非常明确的小团队可抄切口，cases 只输出 1 个。",
        "输出必须是中文 JSON，不能包含 Markdown。",
        "PH/HN 热度只是入选线索，不等于真实付费增长。",
        "禁止编造上线时间、收入、上月付费行为陡增百分比、affiliate 计划、融资、用户数。",
        "如果输入没有明确付费增长证据，paidGrowthSignal 必须以「未验证；」开头。",
        "launchTime 没有明确证据时必须写「未验证」。",
        "每个案例必须按 PDF 风格覆盖：名字、网址、上线时间、上月付费行为陡增、解决什么问题、用户是谁、用户为什么付费、技术原理是什么、小团队怎么抄、付费陡增的原因、风险：不要踩什么坑。",
        "用户是谁必须具体到可触达群体，不能只写开发者、创业者、小团队。",
        "用户为什么付费必须离钱近，例如提高转化、降低获客成本、减少人工、提高留存、减少退款、节省 API 成本。",
        "小团队怎么抄必须把大产品缩小到垂直切口，不能建议复制完整产品。",
        "copyThis 必须写成一句能直接照做的窄动作，例如「只做 X 人群的 Y 计算器/模板/对比页」。",
        "doNotCopy 必须明确写不要复制大产品的哪一部分。",
        "minimumMvp 必须是一周内可做的最小形态：单页、目录、计算器、模板、检查清单、对比页或手工服务。",
        "validationActions 必须是 2 到 4 个今天能做的动作。",
        "todayExecutionPlan 必须是 3 个 30 分钟内能开始的动作，不要写开发完整产品。",
        "killCriteria 必须是 2 到 3 个放弃标准，例如搜不到竞品变现、用户不承认痛点、关键词没有购买意图。",
        "risks 必须包含 2 到 4 个具体坑。",
        "missingEvidence 必须写还缺什么证据。",
        "cases 输出 1 到 maxCases 个最值得深拆的案例。",
        "rejected 输出 1 到 3 个不建议深拆的候选及原因。",
        "必须使用英文 JSON 键名：date, summary, cases, rejected。",
        "cases 每一项必须包含这些英文键名：title, source, originalName, productName, url, launchTime, paidGrowthSignal, evidenceLevel, whySelected, problem, users, paymentReason, technicalPrinciple, copyStrategy, smallTeamWedges, minimumMvp, validationActions, growthReason, monetizationPath, risks, contentAngle, missingEvidence, copyThis, doNotCopy, todayExecutionPlan, killCriteria。",
        "rejected 每一项必须包含英文键名：name, reason。",
        "严格按这个 JSON 形状输出：",
        '{"date":"YYYY-MM-DD","summary":"中文总览","cases":[{"title":"中文案例标题","source":"Product Hunt","originalName":"原产品或新闻名","productName":"产品名","url":"https://example.com","launchTime":"未验证","paidGrowthSignal":"未验证；当前只有 PH/HN 热度和描述信号","evidenceLevel":"中证据","whySelected":"中文入选理由","problem":"中文说明解决什么问题","users":"中文具体用户","paymentReason":"中文说明用户为什么付费","technicalPrinciple":"中文技术原理","copyStrategy":"中文小团队怎么抄","smallTeamWedges":["中文小切口1"],"minimumMvp":"中文最小 MVP","validationActions":["中文验证动作1","中文验证动作2"],"growthReason":"中文说明为什么可能增长","monetizationPath":"中文变现路径","risks":["中文风险1"],"contentAngle":"中文内容选题角度","missingEvidence":["中文缺失证据1"],"copyThis":"中文一句话直接照做动作","doNotCopy":"中文一句话不要抄什么","todayExecutionPlan":["中文 30 分钟动作1"],"killCriteria":["中文放弃标准1"]}],"rejected":[{"name":"中文名称","reason":"中文原因"}]}',
      ].join("\n"),
      {
        date: input.date,
        maxCases: input.maxCases,
        preferredOpportunity,
        products: input.products.slice(0, Math.max(6, input.maxCases * 2)).map((product) => ({
          name: product.name,
          tagline: product.taglineZh || product.tagline,
          description: product.descriptionZh || product.description,
          summary: product.summaryZh,
          reviewsCount: product.reviewsCount,
          commentsCount: product.commentsCount,
          url: product.url,
        })),
        stories: input.stories.slice(0, Math.max(8, input.maxCases * 2)).map((story) => ({
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
  md += `> 目标：每天只从 PH/HN 线索里挑少数可验证切口。没有真实付费增长证据时，必须标为未验证。\n\n`;
  md += `**今日判断**: ${report.summary}\n\n`;

  const mainCase = report.cases[0];
  if (mainCase) {
    md += `## 今天只看这一个\n\n`;
    md += `**${mainCase.title}**\n\n`;
    md += `- **直接抄这个**: ${mainCase.copyThis || mainCase.copyStrategy}\n`;
    md += `- **不要抄这个**: ${mainCase.doNotCopy || "不要复制完整产品，只抄一个能当天验证的小切口。"}\n`;
    md += `- **用户为什么可能付费**: ${mainCase.paymentReason}\n`;
    md += `- **今天 30 分钟执行**:\n`;
    getTodayExecutionPlan(mainCase).forEach((action) => {
      md += `  - ${action}\n`;
    });
    md += `- **放弃标准**:\n`;
    getKillCriteria(mainCase).forEach((criterion) => {
      md += `  - ${criterion}\n`;
    });
    md += `\n`;
  }

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
    md += `### 证据快照\n\n`;
    md += `- **已确认**: ${buildConfirmedEvidence(item)}\n`;
    md += `- **未验证**: ${item.paidGrowthSignal}\n`;
    md += `- **下一步补证**: ${item.missingEvidence[0] || "需要补充真实付费、搜索和竞品证据。"}\n\n`;

    md += `### 解决什么问题？\n\n${item.problem}\n\n`;
    md += `### 用户是谁？\n\n${item.users}\n\n`;
    md += `### 用户为什么付费？\n\n${item.paymentReason}\n\n`;
    md += `### 技术原理是什么？\n\n${item.technicalPrinciple}\n\n`;
    md += `### 小团队怎么抄？\n\n${item.copyStrategy}\n\n`;
    md += `**直接抄这个**: ${item.copyThis || item.copyStrategy}\n\n`;
    md += `**不要抄这个**: ${item.doNotCopy || "不要复制完整产品，只抄一个能当天验证的小切口。"}\n\n`;
    md += `可以先从这些更窄切口开始：\n`;
    item.smallTeamWedges.forEach((wedge) => {
      md += `- ${wedge}\n`;
    });
    md += `\n`;
    md += `**最小 MVP**: ${item.minimumMvp}\n\n`;

    md += `### 今天怎么验证？\n\n`;
    getTodayExecutionPlan(item).forEach((action, actionIndex) => {
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
    md += `\n`;
    md += `### 什么时候放弃？\n\n`;
    getKillCriteria(item).forEach((criterion) => {
      md += `- ${criterion}\n`;
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

function getTodayExecutionPlan(item: ProductCaseStudy): string[] {
  const actions =
    Array.isArray(item.todayExecutionPlan) && item.todayExecutionPlan.length > 0
      ? item.todayExecutionPlan
      : item.validationActions;
  return actions.slice(0, 3);
}

function getKillCriteria(item: ProductCaseStudy): string[] {
  if (Array.isArray(item.killCriteria) && item.killCriteria.length > 0) {
    return item.killCriteria.slice(0, 3);
  }

  return [
    "搜不到任何定价页、广告、affiliate、模板售卖或服务报价。",
    "找不到具体人群承认这个问题影响收入、成本、效率或风险。",
    "关键词只像资讯流量，没有购买、替代、价格、模板、工具等意图。",
  ];
}

function buildFallbackCaseStudyReport(input: CaseStudyInput): CaseStudyReport {
  const cases = selectAllOpportunities(input)
    .slice(0, input.maxCases)
    .map((opportunity) => buildFallbackOpportunityCase(opportunity));

  return {
    date: input.date,
    summary:
      cases.length > 0
        ? `今天只深拆「${cases[0].title}」。先验证搜索、竞品变现和用户痛点，不要直接开做完整产品。`
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

function buildConfirmedEvidence(item: ProductCaseStudy): string {
  const sourceLabel =
    item.source === "Product Hunt" ? "PH 产品描述/评论热度" : "HN 讨论热度/页面摘要";
  return `${sourceLabel}，来源链接：${item.url || "未提供"}`;
}

function buildFallbackOpportunityCase(
  opportunity: SelectedOpportunity
): ProductCaseStudy {
  return {
    title: `${opportunity.title}：今日主机会拆解`,
    source: opportunity.source,
    originalName: opportunity.originalName,
    productName: opportunity.title,
    url: opportunity.url,
    launchTime: "未验证",
    paidGrowthSignal: `未验证；当前只有 ${opportunity.source} 热度和描述信号`,
    evidenceLevel: opportunity.evidenceLevel,
    whySelected: opportunity.scoreReason,
    problem: opportunity.demand,
    users: opportunity.targetUsers,
    paymentReason: opportunity.monetization,
    technicalPrinciple:
      "先把需求拆成输入、判断规则、结果展示和付费/留资入口，不做完整平台。",
    copyStrategy: opportunity.copyAngle,
    copyThis: opportunity.copyAngle,
    doNotCopy: opportunity.doNotCopy,
    smallTeamWedges: opportunity.siteIdeas,
    minimumMvp: opportunity.minimumMvp,
    validationActions: opportunity.actionToday,
    todayExecutionPlan: opportunity.actionToday,
    growthReason: opportunity.scoreReason,
    monetizationPath: opportunity.monetization,
    risks: [
      "不要把 PH/HN 热度当作真实付费增长。",
      "不要在补足搜索、竞品变现和用户访谈前开做完整产品。",
      opportunity.doNotCopy,
    ],
    contentAngle: opportunity.contentAngle,
    missingEvidence: opportunity.missingEvidence,
    killCriteria: opportunity.killCriteria,
  };
}
