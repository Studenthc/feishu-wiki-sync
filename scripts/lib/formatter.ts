import type { PHProduct } from "./product-hunt";
import type { HNStory } from "./hacker-news";

export function formatPHProducts(products: PHProduct[], type: "popular" | "new"): string {
  const title = type === "popular" ? "Product Hunt 热门产品" : "Product Hunt 今日新品";

  let md = `# ${title}\n\n`;
  md += `> 更新时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  md += `---\n\n`;

  products.forEach((product, index) => {
    md += `## ${index + 1}. ${product.name}\n\n`;
    md += `**标语**: ${product.tagline}\n\n`;
    md += `**描述**: ${product.description || "暂无描述"}\n\n`;
    md += `- **链接**: [访问产品](${product.url})\n`;
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
  md += `---\n\n`;

  stories.forEach((story, index) => {
    md += `## ${index + 1}. ${story.title}\n\n`;
    md += `- **作者**: ${story.by}\n`;
    md += `- **评分**: ${story.score}\n`;
    md += `- **评论数**: ${story.descendants || 0}\n`;
    md += `- **发布时间**: ${new Date(story.time * 1000).toLocaleString("zh-CN")}\n`;
    if (story.url) {
      md += `- **链接**: [${new URL(story.url).hostname}](${story.url})\n`;
    }
    md += `\n---\n\n`;
  });

  return md;
}