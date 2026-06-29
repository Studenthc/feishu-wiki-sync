import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";

export type SourceKind = "Product Hunt" | "HackerNews";

export interface SelectedOpportunity {
  source: SourceKind;
  originalName: string;
  title: string;
  summary: string;
  url?: string;
  score: number;
  evidenceLevel: "强证据" | "中证据" | "弱证据";
  followUpDecision: "验证" | "观察" | "放弃";
  scoreReason: string;
  targetUsers: string;
  demand: string;
  copyAngle: string;
  doNotCopy: string;
  minimumMvp: string;
  monetization: string;
  seoKeywords: string[];
  siteIdeas: string[];
  actionToday: string[];
  missingEvidence: string[];
  contentAngle: string;
  buildAngle: string;
  shortVideoAngle: string;
  killCriteria: string[];
  category: OpportunityCategory;
}

type OpportunityCategory =
  | "ats_resume"
  | "vpn_trust"
  | "ai_accounting"
  | "ph_launch_marketing"
  | "ai_dev_tools"
  | "age_compliance"
  | "security_checklist"
  | "developer_tooling"
  | "ai_visibility"
  | "generic";

interface CandidateBase {
  source: SourceKind;
  originalName: string;
  title: string;
  summary: string;
  url?: string;
  heatScore: number;
  commentsCount: number;
  reviewsOrPoints: number;
}

export function selectProductOpportunities(
  products: PHProduct[]
): SelectedOpportunity[] {
  return products
    .map((product) =>
      buildSelectedOpportunity({
        source: "Product Hunt",
        originalName: product.name,
        title: product.name,
        summary:
          product.summaryZh ||
          product.descriptionZh ||
          product.description ||
          product.taglineZh ||
          product.tagline,
        url: product.url,
        heatScore: (product.commentsCount || 0) * 3 + (product.reviewsCount || 0),
        commentsCount: product.commentsCount || 0,
        reviewsOrPoints: product.reviewsCount || 0,
      })
    )
    .sort(compareSelectedOpportunities);
}

export function selectStoryOpportunities(stories: HNStory[]): SelectedOpportunity[] {
  return stories
    .map((story) =>
      buildSelectedOpportunity({
        source: "HackerNews",
        originalName: story.title,
        title: story.titleZh || story.title,
        summary:
          story.summaryZh ||
          story.summary ||
          `围绕「${story.title}」的讨论可能代表一个内容或工具需求。`,
        url: story.url,
        heatScore: (story.descendants || 0) * 2 + (story.score || 0),
        commentsCount: story.descendants || 0,
        reviewsOrPoints: story.score || 0,
      })
    )
    .sort(compareSelectedOpportunities);
}

export function selectAllOpportunities(input: {
  products: PHProduct[];
  stories: HNStory[];
}): SelectedOpportunity[] {
  return [
    ...selectProductOpportunities(input.products),
    ...selectStoryOpportunities(input.stories),
  ].sort(compareSelectedOpportunities);
}

function buildSelectedOpportunity(candidate: CandidateBase): SelectedOpportunity {
  const category = detectCategory(candidate);
  const profile = getCategoryProfile(category, candidate);
  const score = calculateOpportunityScore(candidate, category);
  const evidenceLevel = getEvidenceLevel(score);
  const followUpDecision = getFollowUpDecision(score);

  return {
    source: candidate.source,
    originalName: candidate.originalName,
    summary: candidate.summary,
    url: candidate.url,
    score,
    evidenceLevel,
    followUpDecision,
    scoreReason: buildScoreReason(candidate, category, score),
    category,
    ...profile,
  };
}

function compareSelectedOpportunities(
  a: SelectedOpportunity,
  b: SelectedOpportunity
): number {
  return b.score * 1000 - a.score * 1000 + getCategoryPriority(b.category) - getCategoryPriority(a.category);
}

function detectCategory(candidate: CandidateBase): OpportunityCategory {
  const text = `${candidate.title} ${candidate.originalName} ${candidate.summary}`.toLowerCase();

  if (/\bats\b|\bresume\b|\bcv\b|简历|求职|hackerrank/.test(text)) {
    return "ats_resume";
  }
  if (/vpn|mullvad|privacy policy|wireguard|隐私|信任/.test(text)) {
    return "vpn_trust";
  }
  if (/\b(receipt|invoice|expense|bookkeep\w*|accounting|reimburse)\b|记账|报销|发票/.test(text)) {
    return "ai_accounting";
  }
  if (
    candidate.source === "Product Hunt" &&
    /(product hunt|\blaunch\b|maker|social media|推广|发布)/.test(text)
  ) {
    return "ph_launch_marketing";
  }
  if (/\b(age verification|age checks|kids act|online safety|child safety|moderation polic)\b|年龄验证|儿童安全|未成年人|合规/.test(text)) {
    return "age_compliance";
  }
  if (/\b(recommended by ai|ai visibility|visibility audit|chatgpt recommend|perplexity recommend|claude recommend|ai seo|llm visibility|generative engine optimization)\b|AI 可见度/.test(text)) {
    return "ai_visibility";
  }
  if (/\b(security|breach|exploit|vulnerability|cve|0-day|zero-day|privacy)\b|安全|漏洞|隐私/.test(text)) {
    return "security_checklist";
  }
  if (/\b(openai api|claude api|gemini api|llm ops|token|prompt|model routing|model gateway|inference cost|ai agent|ai workflow|rag|vector database)\b|模型成本|提示词|智能体/.test(text)) {
    return "ai_dev_tools";
  }
  if (/\b(api|sdk|github|library|framework|mcp|self-hosted|database|postgres|sql|devops|server|cloud)\b/.test(text)) {
    return "developer_tooling";
  }
  return "generic";
}

function getCategoryProfile(
  category: OpportunityCategory,
  candidate: CandidateBase
): Omit<
  SelectedOpportunity,
  | "source"
  | "originalName"
  | "summary"
  | "url"
  | "score"
  | "evidenceLevel"
  | "followUpDecision"
  | "scoreReason"
  | "category"
> {
  switch (category) {
    case "ats_resume":
      return {
        title: "ATS 简历优化检查清单",
        targetUsers: "正在投递技术岗位的程序员、应届生、转码求职者和简历修改服务购买者",
        demand: "求职者不知道简历为什么被 ATS 筛掉，需要能马上自查和修改的清单、模板或评分说明。",
        copyAngle: "做一个程序员 ATS 简历自查清单，附 3 个可下载模板和常见扣分项。",
        doNotCopy: "不要做完整招聘平台，也不要承诺绕过 ATS，只做可验证的简历结构优化。",
        minimumMvp: "一页检查清单：上传前自查项、关键词位置、格式坑、模板下载入口。",
        monetization: "模板包、简历修改服务导流、求职课程 affiliate、广告。",
        seoKeywords: ["ATS 简历优化", "程序员简历模板", "HackerRank ATS", "简历评分"],
        siteIdeas: ["ATS 简历检查清单", "程序员简历模板库", "HackerRank ATS 规则解读"],
        actionToday: [
          "搜索「ATS 简历优化」「程序员简历模板」，记录前 10 个页面的定价和交付物。",
          "整理 10 条 ATS 常见扣分项，做成一页检查清单草稿。",
          "去求职社区发 1 个问题：你最担心简历被 ATS 卡在哪里？",
        ],
        missingEvidence: [
          "还没有确认中文程序员是否愿意为 ATS 模板或修改服务付费。",
          "还没有真实关键词搜索量和竞品投放数据。",
        ],
        contentAngle: "为什么你的简历看起来不错，却被 ATS 直接筛掉？",
        buildAngle: "ATS 简历优化检查清单 + 程序员简历模板下载页。",
        shortVideoAngle: "用 HackerRank ATS 开源事件切入，演示 3 个简历格式坑。",
        killCriteria: [
          "前 10 个搜索结果没有模板、服务、课程或广告。",
          "求职社区反馈认为 ATS 优化不是痛点。",
          "只能写成泛求职建议，无法沉淀检查清单或模板。",
        ],
      };
    case "vpn_trust":
      return {
        title: "VPN 信任度与替代品对比",
        targetUsers: "在意隐私、跨境访问和服务商背景的 VPN 付费用户",
        demand: "VPN 用户购买的是信任，一旦品牌事件触发不安，就会搜索替代品和隐私政策对比。",
        copyAngle: "做一个 VPN 信任度对比页：公司背景、审计记录、日志政策、价格和退款政策。",
        doNotCopy: "不要做 VPN 客户端，不要写泛泛排行榜，先做可信证据表。",
        minimumMvp: "一页表格对比 8 个 VPN 的日志政策、审计、价格、公司所在地和 affiliate 情况。",
        monetization: "VPN affiliate、赞助、隐私工具导购。",
        seoKeywords: ["Mullvad 替代品", "安全 VPN 推荐", "VPN 隐私政策", "no log VPN"],
        siteIdeas: ["Mullvad 替代品对比", "VPN 信任度评分表", "无日志 VPN 清单"],
        actionToday: [
          "搜索「Mullvad 替代品」「安全 VPN 推荐」，记录前 10 个页面的 affiliate 和广告位。",
          "整理 8 个 VPN 的日志政策、审计记录和公司所在地。",
          "写一条内容：VPN 用户真正买的是速度，还是信任？",
        ],
        missingEvidence: [
          "还没有确认该热点是否带来持续搜索量。",
          "还没有确认各 VPN affiliate 门槛和佣金。",
        ],
        contentAngle: "VPN 服务商出信任危机后，用户该怎么判断替代品？",
        buildAngle: "Mullvad 替代品与 VPN 信任度对比页。",
        shortVideoAngle: "用一个品牌信任事件解释：为什么 VPN 推荐不能只看速度。",
        killCriteria: [
          "搜索结果已被高权重站垄断且无长尾切口。",
          "主流 VPN affiliate 无法申请或佣金太低。",
          "热点没有延续搜索需求，只是一次性新闻。",
        ],
      };
    case "ai_accounting":
      return {
        title: "自由职业者 AI 报销/记账助手",
        targetUsers: "自由职业者、小工作室、独立开发者和小企业主",
        demand: "这类用户不想学完整财务软件，只想把收据、订阅账单和报销材料快速整理好。",
        copyAngle: "先做自由职业者月度报销模板和收据整理清单，不做完整会计 SaaS。",
        doNotCopy: "不要碰税务合规承诺和银行对接，先做轻量模板和手工服务。",
        minimumMvp: "Google Sheet 模板 + 收据命名规范 + 月度费用分类说明页。",
        monetization: "模板售卖、记账软件 affiliate、轻量代整理服务。",
        seoKeywords: ["自由职业者记账", "AI 报销工具", "收据整理模板", "小企业报销"],
        siteIdeas: ["自由职业者报销模板", "订阅账单整理清单", "AI 记账工具对比"],
        actionToday: [
          "搜索「自由职业者记账」「AI 报销工具」，记录竞品定价和模板售卖情况。",
          "做一个月度费用分类 Sheet，列出 10 类常见订阅支出。",
          "找 3 个自由职业者问他们每月怎么整理收据。",
        ],
        missingEvidence: [
          "还没有确认用户是否愿意为模板而非完整软件付费。",
          "还没有确认不同地区税务要求带来的合规风险。",
        ],
        contentAngle: "自由职业者每月报销最烦的不是记账，是找不到收据。",
        buildAngle: "自由职业者报销模板 + AI 记账工具对比页。",
        shortVideoAngle: "演示 30 秒把一堆订阅账单整理成月度报销表。",
        killCriteria: [
          "搜索结果只有大记账软件，没有模板或服务购买意图。",
          "用户更愿意用现有会计软件，不愿为轻模板付费。",
          "合规要求复杂到无法做轻量内容站。",
        ],
      };
    case "ph_launch_marketing":
      return {
        title: `${candidate.title} 发布推广检查清单`,
        targetUsers: "准备在 Product Hunt、Reddit、X 或开发者社区发布产品的独立开发者",
        demand: "发布当天没流量会让产品首发浪费，创作者需要可复制的预热、文案和渠道清单。",
        copyAngle: "做一个 Product Hunt 发布当天推广清单和社媒文案模板生成页。",
        doNotCopy: "不要做完整社媒自动发布平台，也不要承诺刷榜。",
        minimumMvp: "输入产品名和一句话介绍，输出 X、LinkedIn、Reddit、邮件的首发文案模板。",
        monetization: "模板包、发布服务、创始人工具 affiliate、赞助。",
        seoKeywords: ["Product Hunt 推广", "Product Hunt launch checklist", "产品发布文案", "独立开发者营销"],
        siteIdeas: ["PH 发布检查清单", "首发文案生成器", "Product Hunt 案例拆解"],
        actionToday: [
          "搜索「Product Hunt launch checklist」「Product Hunt 推广」，记录是否有模板售卖或服务报价。",
          "拆 5 个成功 PH 产品的首发帖和社媒文案。",
          "写一个首发文案模板，让一个准备发布的 maker 试用。",
        ],
        missingEvidence: [
          "还没有确认 maker 是否愿意为发布模板或服务付费。",
          "还没有确认该关键词中文/英文长尾流量。",
        ],
        contentAngle: "为什么 Product Hunt 发布当天没人看？问题通常出在发布前 7 天。",
        buildAngle: "Product Hunt 发布检查清单 + 首发文案生成器。",
        shortVideoAngle: "用一个发布失败案例讲清楚 PH 首发前 7 天要做什么。",
        killCriteria: [
          "搜不到模板、课程、咨询或发布服务变现证据。",
          "maker 反馈最大问题不是文案，而是产品本身没有受众。",
          "页面只能泛讲营销，无法给出可复制模板。",
        ],
      };
    case "ai_visibility":
      return {
        title: "品牌 AI 可见度检测",
        targetUsers: "本地商家、SaaS 创始人、SEO 服务商和内容营销团队",
        demand: "越来越多用户问 AI 推荐谁，商家想知道自己有没有被 ChatGPT/Claude/Perplexity 提到。",
        copyAngle: "做一个手工版 AI 可见度审计报告：输入品牌名，返回各模型是否推荐及竞品对比。",
        doNotCopy: "不要先做自动化监控平台，先用人工查询和报告验证愿不愿付费。",
        minimumMvp: "一个表单 + 样例报告 + 24 小时人工生成审计报告。",
        monetization: "一次性审计报告、月度监控、SEO/内容服务线索。",
        seoKeywords: ["AI visibility audit", "ChatGPT recommend my business", "AI SEO", "品牌 AI 可见度"],
        siteIdeas: ["AI 可见度检测", "ChatGPT 推荐排名报告", "AI SEO 审计"],
        actionToday: [
          "搜索「AI visibility audit」「ChatGPT recommend my business」，记录定价和报告样例。",
          "选 3 个本地商家，手工查 ChatGPT/Claude/Perplexity 是否推荐。",
          "做一个 1 页样例报告截图。",
        ],
        missingEvidence: [
          "还没有确认中小商家是否理解并愿意购买 AI 可见度报告。",
          "还没有确认模型结果的稳定性和可复现性。",
        ],
        contentAngle: "你的公司在 ChatGPT 里被推荐了吗？很多老板还没意识到这会影响获客。",
        buildAngle: "AI 可见度审计报告落地页。",
        shortVideoAngle: "现场问三个 AI：附近最推荐哪家公司？看你的品牌有没有出现。",
        killCriteria: [
          "竞品没有定价或服务化证据。",
          "商家听不懂 AI 可见度的价值。",
          "模型结果波动太大，无法交付可信报告。",
        ],
      };
    case "age_compliance":
      return {
        title: "年龄验证/合规风险检查清单",
        targetUsers: "面向未成年人用户、社区内容、社交产品、教育产品或 UGC 平台的小团队",
        demand: "政策新闻会让产品方担心登录、内容审核、年龄验证和隐私处理是否踩线，需要可执行的自查清单。",
        copyAngle: "做一个年龄验证与未成年人合规自查清单，按产品类型列出风险项和整改动作。",
        doNotCopy: "不要做法律咨询或合规承诺，也不要做绕过年龄验证的工具。",
        minimumMvp: "一页自查清单：适用产品、风险问题、资料收集、家长同意、内容审核和咨询入口。",
        monetization: "合规顾问线索、模板包、律师/合规服务 affiliate、B2B 内容获客。",
        seoKeywords: ["age verification compliance", "KIDS Act", "未成年人合规", "年龄验证"],
        siteIdeas: ["年龄验证合规自查", "未成年人产品风险清单", "KIDS Act 解读"],
        actionToday: [
          "搜索「age verification compliance」「KIDS Act」「未成年人合规」，记录前 10 个页面是否有咨询、白皮书或服务报价。",
          "列出 5 类可能受影响产品：社区、教育、游戏、社交、内容平台。",
          "写一版非法律建议的风险自查清单，标明需要咨询专业人士的边界。",
        ],
        missingEvidence: [
          "还没有确认目标客户是否会为清单、模板或咨询线索付费。",
          "还没有确认具体法律适用范围，不能直接给合规结论。",
        ],
        contentAngle: "年龄验证政策变化后，小团队最容易忽略哪些产品风险？",
        buildAngle: "未成年人合规风险自查清单 + 咨询线索页。",
        shortVideoAngle: "用一个政策新闻讲清楚：哪些产品不能再假装没有未成年人用户？",
        killCriteria: [
          "搜索结果只有新闻，没有咨询、模板、白皮书或服务化证据。",
          "无法把政策影响落到具体产品类型和检查项。",
          "风险过高，必须由律师直接交付，内容站无法承接。",
        ],
      };
    case "security_checklist":
      return genericProfile(candidate, "安全风险检查清单", "安全检查清单或风险自测页");
    case "developer_tooling":
      return genericProfile(candidate, "开发者排查工具页", "配置生成器、排查清单或工具对比页");
    case "ai_dev_tools":
      return genericProfile(candidate, "AI 工具成本/替代品对比", "AI 工具成本计算器或替代品对比页");
    default:
      return genericProfile(candidate, `${candidate.title} 小切口验证`, "检查清单、模板页或替代品对比页");
  }
}

function genericProfile(
  candidate: CandidateBase,
  title: string,
  shape: string
): ReturnType<typeof getCategoryProfile> {
  return {
    title,
    targetUsers: "需要解决该具体问题的垂直用户，仍需通过搜索和社区反馈缩小。",
    demand: candidate.summary,
    copyAngle: `做一个「${candidate.title}」相关的${shape}，先验证搜索和点击。`,
    doNotCopy: "不要做泛资讯站或完整平台，只做一个能验证购买意图的小页面。",
    minimumMvp: `一页${shape}，包含问题、步骤、对比和留资或下载入口。`,
    monetization: "模板售卖、affiliate、赞助、轻量服务或广告。",
    seoKeywords: [candidate.title, `${candidate.title} 替代品`, `${candidate.title} 工具`],
    siteIdeas: [`${candidate.title} 检查清单`, `${candidate.title} 工具对比`, `${candidate.title} 模板`],
    actionToday: [
      `搜索「${candidate.title} pricing / alternative / template」，记录前 10 个商业页面。`,
      "找 5 个相邻竞品，记录它们靠订阅、广告、affiliate、模板还是咨询变现。",
      "写一个单页 MVP 草图，发给 3 个潜在用户或相关社区收反馈。",
    ],
    missingEvidence: [
      "没有真实搜索量数据。",
      "没有竞品变现证据。",
      "没有目标用户访谈。",
    ],
    contentAngle: `这条热点背后，真正能抄的是哪个小工具或模板？`,
    buildAngle: `${candidate.title} 的${shape}。`,
    shortVideoAngle: `用 30 秒讲清楚 ${candidate.title} 背后的具体痛点和一个可做页面。`,
    killCriteria: [
      "前 10 个搜索结果没有任何商业化页面或明确替代品。",
      "找不到愿意承认该问题影响收入、成本或效率的具体用户。",
      "最小页面只能写成泛介绍，无法落到工具、模板、清单或对比页。",
    ],
  };
}

function calculateOpportunityScore(
  candidate: CandidateBase,
  category: OpportunityCategory
): number {
  let score = 1;
  const priority = getCategoryPriority(category);

  if (priority >= 4) {
    score += 1;
  }
  if (candidate.commentsCount >= 30 || candidate.heatScore >= 80) {
    score += 1;
  }
  if (["ats_resume", "vpn_trust", "ai_accounting", "ai_visibility"].includes(category)) {
    score += 1;
  }
  if (category !== "generic") {
    score += 1;
  }

  const capped = Math.min(5, score);
  if (candidate.commentsCount < 5 && candidate.heatScore < 30) {
    return Math.min(3, capped);
  }

  return capped;
}

function getCategoryPriority(category: OpportunityCategory): number {
  switch (category) {
    case "ats_resume":
      return 8;
    case "vpn_trust":
      return 7;
    case "ai_accounting":
      return 7;
    case "ai_visibility":
      return 6;
    case "age_compliance":
      return 6;
    case "ph_launch_marketing":
      return 5;
    case "security_checklist":
      return 5;
    case "developer_tooling":
      return 4;
    case "ai_dev_tools":
      return 4;
    default:
      return 1;
  }
}

function buildScoreReason(
  candidate: CandidateBase,
  category: OpportunityCategory,
  score: number
): string {
  const categoryLabel = category === "generic" ? "泛线索" : "可落地垂直切口";
  return `${categoryLabel}；热度信号 ${candidate.reviewsOrPoints} 分/评分、${candidate.commentsCount} 条评论。评分 ${score}/5 代表值得验证程度，不代表已经证明能赚钱。`;
}

function getEvidenceLevel(score: number): SelectedOpportunity["evidenceLevel"] {
  if (score >= 5) {
    return "强证据";
  }
  if (score >= 3) {
    return "中证据";
  }
  return "弱证据";
}

function getFollowUpDecision(score: number): SelectedOpportunity["followUpDecision"] {
  if (score >= 4) {
    return "验证";
  }
  if (score >= 3) {
    return "观察";
  }
  return "放弃";
}
