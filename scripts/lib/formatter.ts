import type { PHProduct } from "./product-hunt";
import type { HNStory } from "./hacker-news";

const FEATURED_LIMIT = 5;
const QUICK_PICK_LIMIT = 3;
const INDEX_LIMIT = 12;

export function formatPHProducts(products: PHProduct[], type: "popular" | "new"): string {
  const title = type === "popular" ? "Product Hunt 热门产品" : "Product Hunt 今日新品";
  const rankedProducts = rankProducts(products, type);
  const featured = rankedProducts.slice(0, FEATURED_LIMIT);
  const indexed = rankedProducts.slice(FEATURED_LIMIT, INDEX_LIMIT);

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `> 这不是产品搬运列表。默认只展开最值得看的 ${featured.length} 个，其余只保留索引，重点判断能不能拆成小团队可验证的页面、工具、模板或内容选题。\n\n`;
  md += formatPHQuickPicks(featured);
  md += `---\n\n`;

  featured.forEach((product, index) => {
    md += `## ${index + 1}. ${product.name}\n\n`;
    md += `**一句话**: ${summarizeProduct(product)}\n\n`;
    md += `- **值不值得看**: ${buildProductVerdict(product)}\n`;
    md += `- **可抄切口**: ${buildProductCopyAngle(product)}\n`;
    md += `- **30 分钟验证**: ${buildProductValidation(product)}\n`;
    md += `- **不要抄什么**: 不要抄完整产品、账号体系和复杂协作流程，只看它背后的单一付费场景。\n`;
    md += `- **链接**: ${product.url ? `[访问产品](${product.url})` : "未提供"}\n`;
    md += `- **热度信号**: ${product.reviewsCount} 个评分，${product.commentsCount} 条评论\n`;
    if (product.thumbnail?.url) {
      md += `- **封面**: ![](${product.thumbnail.url})\n`;
    }
    md += `\n---\n\n`;
  });

  md += formatPHIndex(indexed);

  return md;
}

export function formatHNStories(stories: HNStory[], type: "top" | "new"): string {
  const title = type === "top" ? "HackerNews 热门新闻" : "HackerNews 最新新闻";
  const rankedStories = rankStories(stories, type);
  const featured = rankedStories.slice(0, FEATURED_LIMIT);
  const indexed = rankedStories.slice(FEATURED_LIMIT, INDEX_LIMIT);

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `> 这不是新闻搬运列表。默认只展开最值得看的 ${featured.length} 条，重点提取需求、可抄切口和今天能验证的动作。\n\n`;
  md += formatHNQuickPicks(featured);
  md += `---\n\n`;

  featured.forEach((story, index) => {
    md += `## ${index + 1}. ${story.titleZh || story.title}\n\n`;
    md += `**一句话**: ${summarizeStory(story)}\n\n`;
    md += `- **值不值得看**: ${buildStoryVerdict(story)}\n`;
    md += `- **可抄切口**: ${buildStoryCopyAngle(story)}\n`;
    md += `- **30 分钟验证**: ${buildStoryValidation(story)}\n`;
    md += `- **不要抄什么**: 不要复述新闻或做泛资讯站，只抄讨论背后的问题、清单、对比或小工具。\n`;
    md += `- **作者**: ${story.by}\n`;
    md += `- **热度信号**: ${story.score} 分，${story.descendants || 0} 条评论\n`;
    md += `- **发布时间**: ${new Date(story.time * 1000).toLocaleString("zh-CN")}\n`;
    if (story.url) {
      md += `- **链接**: [${new URL(story.url).hostname}](${story.url})\n`;
      if (story.siteName) {
        md += `- **来源**: ${story.siteName}\n`;
      }
    }
    md += `\n---\n\n`;
  });

  md += formatHNIndex(indexed);

  return md;
}

function summarizeProduct(product: PHProduct): string {
  if (product.summaryZh) {
    return cleanSentence(product.summaryZh);
  }

  const description = product.description || product.tagline;
  return cleanSentence(
    `一句话介绍：${description}。Product Hunt 标语：${product.tagline}`
  );
}

function summarizeStory(story: HNStory): string {
  return cleanSentence(
    story.summaryZh ||
      story.summary ||
      `这条 HackerNews 内容围绕「${story.title}」展开讨论。`
  );
}

function formatPHQuickPicks(products: PHProduct[]): string {
  if (products.length === 0) {
    return `## 今天没有可看的 PH 候选\n\n`;
  }

  let md = `## 今天先看这 ${Math.min(products.length, QUICK_PICK_LIMIT)} 个\n\n`;
  products.slice(0, QUICK_PICK_LIMIT).forEach((product, index) => {
    md += `${index + 1}. **${product.name}**：${buildProductCopyAngle(product)}\n`;
    md += `   - 先验证：${buildProductValidation(product)}\n`;
  });
  md += `\n`;
  return md;
}

function formatHNQuickPicks(stories: HNStory[]): string {
  if (stories.length === 0) {
    return `## 今天没有可看的 HN 候选\n\n`;
  }

  let md = `## 今天先看这 ${Math.min(stories.length, QUICK_PICK_LIMIT)} 条\n\n`;
  stories.slice(0, QUICK_PICK_LIMIT).forEach((story, index) => {
    md += `${index + 1}. **${story.titleZh || story.title}**：${buildStoryCopyAngle(story)}\n`;
    md += `   - 先验证：${buildStoryValidation(story)}\n`;
  });
  md += `\n`;
  return md;
}

function formatPHIndex(products: PHProduct[]): string {
  let md = `## 其余候选只做索引\n\n`;
  if (products.length === 0) {
    return `${md}没有更多候选。\n`;
  }

  products.forEach((product) => {
    md += `- **${product.name}**: ${cleanSentence(product.taglineZh || product.tagline)}；先不展开，除非后续发现定价页、竞品变现或明确搜索需求。\n`;
  });
  return md;
}

function formatHNIndex(stories: HNStory[]): string {
  let md = `## 其余候选只做索引\n\n`;
  if (stories.length === 0) {
    return `${md}没有更多候选。\n`;
  }

  stories.forEach((story) => {
    md += `- **${story.titleZh || story.title}**: ${story.score} 分 / ${story.descendants || 0} 评论；先不展开，除非能拆出明确工具、模板、清单或对比页。\n`;
  });
  return md;
}

function rankProducts(products: PHProduct[], type: "popular" | "new"): PHProduct[] {
  if (type === "new") {
    return [...products].sort((a, b) => getProductScore(b) - getProductScore(a));
  }

  return [...products].sort((a, b) => getProductScore(b) - getProductScore(a));
}

function rankStories(stories: HNStory[], type: "top" | "new"): HNStory[] {
  if (type === "new") {
    return [...stories].sort((a, b) => getStoryRankScore(b) - getStoryRankScore(a));
  }

  return [...stories].sort((a, b) => getStoryRankScore(b) - getStoryRankScore(a));
}

function getProductScore(product: PHProduct): number {
  return (product.commentsCount || 0) * 3 + (product.reviewsCount || 0);
}

function getStoryScore(story: HNStory): number {
  return (story.descendants || 0) * 2 + (story.score || 0);
}

function getStoryRankScore(story: HNStory): number {
  return getStoryCopyabilityScore(story) * 1000 + getStoryScore(story);
}

function getStoryCopyabilityScore(story: HNStory): number {
  const text = `${story.title} ${story.summaryZh || story.summary || ""}`.toLowerCase();
  let score = 0;

  if (/show hn|launch|tool|app|library|github|open source|self-hosted|api|sdk|database|postgres|sql|devops|server|cloud/.test(text)) {
    score += 3;
  }
  if (/(security|privacy|breach|exploit|vulnerability|cve|0-day|zero-day|compliance)/.test(text)) {
    score += 3;
  }
  if (/\b(ai|llm)\b|openai|claude|gemini|token|prompt/.test(text)) {
    score += 2;
  }
  if (/pricing|revenue|startup|marketing|sales|customer|conversion|competitor|visibility|brand|recommended by ai/.test(text)) {
    score += 2;
  }
  if (/radio|music|politics|legislature|essay|history|movie|game|research|paper|hardware|ising|probabilistic computer/.test(text)) {
    score -= 2;
  }

  return score;
}

function buildProductVerdict(product: PHProduct): string {
  const score = getProductScore(product);
  if (score >= 80) {
    return "优先看。它至少有较强讨论或评分信号，适合拆成一个更窄的验证切口。";
  }
  if (score >= 25) {
    return "可以看，但只当线索。先补搜索、定价和竞品证据。";
  }
  return "先观察。热度信号偏弱，不要直接开做。";
}

function buildStoryVerdict(story: HNStory): string {
  const comments = story.descendants || 0;
  if (comments >= 100) {
    return "优先看。评论多，通常能从争议里提取真实痛点。";
  }
  if ((story.score || 0) >= 100 || comments >= 30) {
    return "可以看，但要先确认是不是商业需求，不要只做资讯解读。";
  }
  return "先观察。讨论不足时，只适合做素材，不适合直接立项。";
}

function buildProductCopyAngle(product: PHProduct): string {
  const name = product.name;
  const text = `${product.name} ${product.taglineZh || product.tagline} ${
    product.descriptionZh || product.description
  }`.toLowerCase();

  if (/\b(api|model|llm|ai|token|gateway|prompt)\b/i.test(text)) {
    return `做一个面向小团队的「${name} 成本/模型/替代品」计算器或对比页。`;
  }
  if (/\b(design|image|video|creative|content)\b|生成|图片|视频/i.test(text)) {
    return `做一个垂直场景的模板库或生成器，不做完整创作平台。`;
  }
  if (/\b(sales|crm|email|lead|marketing|customer)\b/i.test(text)) {
    return `做一个单一获客场景的检查清单、话术模板或 ROI 计算器。`;
  }
  if (/\b(privacy|security|compliance|gdpr|audit)\b/i.test(text)) {
    return `做一个合规/隐私检查清单或风险自测页，先服务一个小行业。`;
  }
  return `做一个「${name} 替代品 / 使用场景 / 模板」单页，先验证搜索和点击。`;
}

function buildStoryCopyAngle(story: HNStory): string {
  const title = story.titleZh || story.title;
  const text = `${story.title} ${story.summaryZh || story.summary || ""}`.toLowerCase();

  if (/\b(recommended by ai|ai visibility|visibility audit|brand|competitor|seo|marketing|customer acquisition)\b/i.test(text)) {
    return `做一个品牌 AI 可见度检测、竞品对比或获客诊断报告页。`;
  }
  if (/\b(security|privacy|breach|hack|exploit|vulnerability|cve|0-day|zero-day|compliance)\b|漏洞|隐私|安全/i.test(text)) {
    return `做一个面向具体人群的安全检查清单或风险自测页。`;
  }
  if (/\b(ai|llm|openai|claude|gemini|token|prompt)\b/i.test(text)) {
    return `做一个 AI 工具成本、模型选择或替代品对比页。`;
  }
  if (/\b(database|postgres|sql|server|cloud|devops|api|sdk|github|library|self-hosted)\b/i.test(text)) {
    return `做一个开发者问题排查清单、配置生成器或工具对比页。`;
  }
  if (/\b(startup|pricing|funding|revenue|market|sales|marketing|customer)\b/i.test(text)) {
    return `做一个定价、增长或市场判断模板，面向独立开发者和小团队。`;
  }
  return `做一页「${title} 背后的问题清单/工具清单/替代方案」，不要做新闻复述。`;
}

function buildProductValidation(product: PHProduct): string {
  const keyword = product.name;
  return `搜「${keyword} pricing / alternative / template」，看前 10 个结果有没有定价页、广告、模板售卖或强购买词。`;
}

function buildStoryValidation(story: HNStory): string {
  const keyword = cleanSearchKeyword(story.titleZh || story.title);
  return `搜「${keyword} tool / template / alternative / pricing」，只要没有商业页面，就先降级为素材。`;
}

function cleanSearchKeyword(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function cleanSentence(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177)}...`;
}
