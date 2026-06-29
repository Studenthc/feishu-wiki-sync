import type { PHProduct } from "./product-hunt";
import type { HNStory } from "./hacker-news";
import {
  selectProductOpportunities,
  selectStoryOpportunities,
  type SelectedOpportunity,
} from "./opportunity-selector";

const FEATURED_LIMIT = 5;
const QUICK_PICK_LIMIT = 3;
const INDEX_LIMIT = 12;

export function formatPHProducts(products: PHProduct[], type: "popular" | "new"): string {
  const title = type === "popular" ? "Product Hunt 热门产品" : "Product Hunt 今日新品";
  const selected = selectProductOpportunities(products);
  const rankedProducts = rankProductsByOpportunity(products, selected);
  const opportunities = mapByOriginalName(selected);
  const featured = selectFeaturedProducts(rankedProducts, opportunities);
  const featuredNames = new Set(featured.map((product) => product.name));
  const indexed = rankedProducts
    .filter((product) => !featuredNames.has(product.name))
    .slice(0, INDEX_LIMIT);

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `> 这不是产品搬运列表。本次只展开达到「观察」或「验证」级别的 ${featured.length} 个候选，其余只保留索引，重点判断能不能拆成小团队可验证的页面、工具、模板或内容选题。\n\n`;
  md += formatQuickPicks(
    selected,
    "个"
  );
  md += `---\n\n`;

  featured.forEach((product, index) => {
    md += `## ${index + 1}. ${product.name}\n\n`;
    const opportunity = opportunities.get(product.name);
    md += `**一句话**: ${summarizeProduct(product)}\n\n`;
    md += `- **值不值得看**: ${buildVerdict(opportunity, getProductScore(product))}\n`;
    md += `- **可抄切口**: ${opportunity?.copyAngle || buildProductCopyAngle(product)}\n`;
    md += `- **30 分钟验证**: ${opportunity?.actionToday[0] || buildProductValidation(product)}\n`;
    md += `- **不要抄什么**: ${opportunity?.doNotCopy || "不要抄完整产品、账号体系和复杂协作流程，只看它背后的单一付费场景。"}\n`;
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
  const selected = selectStoryOpportunities(stories);
  const rankedStories = rankStoriesByOpportunity(stories, selected);
  const opportunities = mapByOriginalName(selected);
  const featured = selectFeaturedStories(rankedStories, opportunities);
  const featuredTitles = new Set(featured.map((story) => story.title));
  const indexed = rankedStories
    .filter((story) => !featuredTitles.has(story.title))
    .slice(0, INDEX_LIMIT);

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `> 这不是新闻搬运列表。本次只展开达到「观察」或「验证」级别的 ${featured.length} 条候选，重点提取需求、可抄切口和今天能验证的动作。\n\n`;
  md += formatQuickPicks(
    selected,
    "条"
  );
  md += `---\n\n`;

  featured.forEach((story, index) => {
    md += `## ${index + 1}. ${story.titleZh || story.title}\n\n`;
    const opportunity = opportunities.get(story.title);
    md += `**一句话**: ${summarizeStory(story)}\n\n`;
    md += `- **值不值得看**: ${buildVerdict(opportunity, getStoryScore(story))}\n`;
    md += `- **可抄切口**: ${opportunity?.copyAngle || buildStoryCopyAngle(story)}\n`;
    md += `- **30 分钟验证**: ${opportunity?.actionToday[0] || buildStoryValidation(story)}\n`;
    md += `- **不要抄什么**: ${opportunity?.doNotCopy || "不要复述新闻或做泛资讯站，只抄讨论背后的问题、清单、对比或小工具。"}\n`;
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

function formatQuickPicks(items: SelectedOpportunity[], unit: "个" | "条"): string {
  const diversified = diversifyQuickPicks(
    items.filter((item) => item.followUpDecision === "验证")
  );
  if (diversified.length === 0) {
    return `## 今天没有强候选\n\n没有达到「验证」级别的机会，先只浏览下面索引，不建议今天直接开做。\n\n`;
  }

  let md = `## 今天先看这 ${Math.min(diversified.length, QUICK_PICK_LIMIT)} ${unit}\n\n`;
  diversified.slice(0, QUICK_PICK_LIMIT).forEach((item, index) => {
    md += `${index + 1}. **${item.title}**：${item.copyAngle}\n`;
    md += `   - 先验证：${item.actionToday[0]}\n`;
  });
  md += `\n`;
  return md;
}

function diversifyQuickPicks(items: SelectedOpportunity[]): SelectedOpportunity[] {
  const picked: SelectedOpportunity[] = [];
  const seenTitles = new Set<string>();
  const seenCategories = new Set<string>();

  for (const item of items) {
    const titleKey = item.title.trim().toLowerCase();
    if (seenTitles.has(titleKey)) {
      continue;
    }

    const categoryKey = item.category === "generic" ? titleKey : item.category;
    if (seenCategories.has(categoryKey)) {
      continue;
    }

    picked.push(item);
    seenTitles.add(titleKey);
    seenCategories.add(categoryKey);

    if (picked.length >= QUICK_PICK_LIMIT) {
      return picked;
    }
  }

  for (const item of items) {
    const titleKey = item.title.trim().toLowerCase();
    if (!seenTitles.has(titleKey)) {
      picked.push(item);
      seenTitles.add(titleKey);
    }
    if (picked.length >= QUICK_PICK_LIMIT) {
      break;
    }
  }

  return picked;
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

function selectFeaturedProducts(
  rankedProducts: PHProduct[],
  opportunities: Map<string, SelectedOpportunity>
): PHProduct[] {
  const candidates = rankedProducts.filter(
    (product) => opportunities.get(product.name)?.followUpDecision !== "放弃"
  );
  const hasValidation = candidates.some(
    (product) => opportunities.get(product.name)?.followUpDecision === "验证"
  );

  return candidates.slice(0, hasValidation ? FEATURED_LIMIT : 2);
}

function selectFeaturedStories(
  rankedStories: HNStory[],
  opportunities: Map<string, SelectedOpportunity>
): HNStory[] {
  const candidates = rankedStories.filter(
    (story) => opportunities.get(story.title)?.followUpDecision !== "放弃"
  );
  const hasValidation = candidates.some(
    (story) => opportunities.get(story.title)?.followUpDecision === "验证"
  );

  return candidates.slice(0, hasValidation ? FEATURED_LIMIT : 2);
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

function rankProductsByOpportunity(
  products: PHProduct[],
  opportunities: SelectedOpportunity[]
): PHProduct[] {
  const productsByName = new Map(products.map((product) => [product.name, product]));
  const ranked = opportunities
    .map((opportunity) => productsByName.get(opportunity.originalName))
    .filter(isPHProduct);
  const rankedNames = new Set(ranked.map((product) => product.name));
  const leftovers = products
    .filter((product) => !rankedNames.has(product.name))
    .sort((a, b) => getProductScore(b) - getProductScore(a));

  return [...ranked, ...leftovers];
}

function rankStoriesByOpportunity(
  stories: HNStory[],
  opportunities: SelectedOpportunity[]
): HNStory[] {
  const storiesByTitle = new Map(stories.map((story) => [story.title, story]));
  const ranked = opportunities
    .map((opportunity) => storiesByTitle.get(opportunity.originalName))
    .filter(isHNStory);
  const rankedTitles = new Set(ranked.map((story) => story.title));
  const leftovers = stories
    .filter((story) => !rankedTitles.has(story.title))
    .sort((a, b) => getStoryScore(b) - getStoryScore(a));

  return [...ranked, ...leftovers];
}

function getProductScore(product: PHProduct): number {
  return (product.commentsCount || 0) * 3 + (product.reviewsCount || 0);
}

function getStoryScore(story: HNStory): number {
  return (story.descendants || 0) * 2 + (story.score || 0);
}

function buildVerdict(
  opportunity: SelectedOpportunity | undefined,
  fallbackScore: number
): string {
  if (opportunity) {
    return `${opportunity.followUpDecision}。${opportunity.scoreReason}`;
  }

  if (fallbackScore >= 80) {
    return "优先看。它至少有较强讨论或评分信号，适合拆成一个更窄的验证切口。";
  }
  if (fallbackScore >= 25) {
    return "可以看，但只当线索。先补搜索、定价和竞品证据。";
  }
  return "先观察。热度信号偏弱，不要直接开做。";
}

function mapByOriginalName(items: SelectedOpportunity[]): Map<string, SelectedOpportunity> {
  return new Map(items.map((item) => [item.originalName, item]));
}

function isSelectedOpportunity(
  item: SelectedOpportunity | undefined
): item is SelectedOpportunity {
  return item !== undefined;
}

function isPHProduct(product: PHProduct | undefined): product is PHProduct {
  return product !== undefined;
}

function isHNStory(story: HNStory | undefined): story is HNStory {
  return story !== undefined;
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

  if (/\b(recommended by ai|ai visibility|visibility audit|chatgpt recommend|perplexity recommend|claude recommend|ai seo|llm visibility|generative engine optimization)\b/i.test(text)) {
    return `做一个品牌 AI 可见度检测、竞品对比或获客诊断报告页。`;
  }
  if (/\b(age verification|age checks|kids act|online safety|child safety|moderation polic)\b|年龄验证|儿童安全|未成年人|合规/i.test(text)) {
    return `做一个年龄验证/未成年人合规自查清单，按产品类型列风险和整改动作。`;
  }
  if (/\b(security|privacy|breach|hack|exploit|vulnerability|cve|0-day|zero-day)\b|漏洞|隐私|安全/i.test(text)) {
    return `做一个面向具体人群的安全检查清单或风险自测页。`;
  }
  if (/\b(openai api|claude api|gemini api|llm ops|token|prompt|model routing|model gateway|inference cost|ai agent|ai workflow|rag|vector database)\b|模型成本|提示词|智能体/i.test(text)) {
    return `做一个 AI 工具成本、模型选择或替代品对比页。`;
  }
  if (/\b(database|postgres|sql|server|cloud|devops|api|sdk|github|library|framework|mcp|self-hosted)\b/i.test(text)) {
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
