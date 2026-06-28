import type { PHProduct } from "./product-hunt";
import type { HNStory } from "./hacker-news";

export function formatPHProducts(products: PHProduct[], type: "popular" | "new"): string {
  const title = type === "popular" ? "Product Hunt 热门产品" : "Product Hunt 今日新品";

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `> 本文档自动抓取 Product Hunt 数据，并为每个产品补充一句中文简介，方便快速筛选。\n\n`;
  md += `---\n\n`;

  products.forEach((product, index) => {
    md += `## ${index + 1}. ${product.name}\n\n`;
    md += `**简介**: ${summarizeProduct(product)}\n\n`;
    md += `**标语**: ${product.taglineZh || product.tagline}\n\n`;
    md += `**描述**: ${product.descriptionZh || product.description || "暂无描述"}\n\n`;
    md += `- **链接**: ${product.url ? `[访问产品](${product.url})` : "未提供"}\n`;
    md += `- **评分**: ${product.reviewsCount} 个评分\n`;
    md += `- **评论数**: ${product.commentsCount} 条评论\n`;
    if (product.thumbnail?.url) {
      md += `- **封面**: ![](${product.thumbnail.url})\n`;
    }
    md += `\n---\n\n`;
  });

  return md;
}

export function formatHNStories(stories: HNStory[], type: "top" | "new"): string {
  const title = type === "top" ? "HackerNews 热门新闻" : "HackerNews 最新新闻";

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `> 本文档自动抓取 HackerNews 数据，并尽量从原文页面提取简介；无法访问原文时会根据标题生成简要说明。\n\n`;
  md += `---\n\n`;

  stories.forEach((story, index) => {
    md += `## ${index + 1}. ${story.titleZh || story.title}\n\n`;
    md += `**简介**: ${cleanSentence(story.summaryZh || story.summary || `这条 HackerNews 内容围绕「${story.title}」展开讨论。`)}\n\n`;
    md += `- **作者**: ${story.by}\n`;
    md += `- **评分**: ${story.score}\n`;
    md += `- **评论数**: ${story.descendants || 0}\n`;
    md += `- **发布时间**: ${new Date(story.time * 1000).toLocaleString("zh-CN")}\n`;
    if (story.url) {
      md += `- **链接**: [${new URL(story.url).hostname}](${story.url})\n`;
      if (story.siteName) {
        md += `- **来源**: ${story.siteName}\n`;
      }
    }
    md += `\n---\n\n`;
  });

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

function cleanSentence(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177)}...`;
}
