import { getPopularProducts, getNewProducts } from "./lib/product-hunt";
import { getTopStories, getNewStories } from "./lib/hacker-news";
import { formatPHProducts, formatHNStories } from "./lib/formatter";
import { execSync } from "child_process";
import * as fs from "fs/promises";

const today = new Date().toISOString().split("T")[0];
const SPACE_ID = "7639013663648107490";

async function main() {
  const phToken = process.env.PH_TOKEN || "";
  const feishuSpaceId = process.env.FEISHU_SPACE_ID || SPACE_ID;

  console.log("检查 lark-cli 登录状态...");
  try {
    execSync("lark-cli auth status", { stdio: "pipe" });
  } catch {
    console.error("错误: 请先运行 lark-cli auth login 登录飞书");
    process.exit(1);
  }

  console.log(`开始每日同步: ${today}`);

  const docs: { title: string; content: string }[] = [];

  if (phToken) {
    console.log("获取 Product Hunt 热门产品...");
    const popularProducts = await getPopularProducts(phToken, 20);
    const popularMd = formatPHProducts(popularProducts, "popular");

    console.log("获取 Product Hunt 今日新品...");
    const newProducts = await getNewProducts(phToken, 20);
    const newMd = formatPHProducts(newProducts, "new");

    docs.push(
      { title: `Product Hunt 热门产品 - ${today}`, content: popularMd },
      { title: `Product Hunt 今日新品 - ${today}`, content: newMd }
    );
  } else {
    console.log("跳过 Product Hunt (未设置 PH_TOKEN)");
  }

  console.log("获取 HackerNews 热门新闻...");
  const topStories = await getTopStories(30);
  const topMd = formatHNStories(topStories, "top");

  console.log("获取 HackerNews 最新新闻...");
  const newStories = await getNewStories(30);
  const newStoriesMd = formatHNStories(newStories, "new");

  docs.push(
    { title: `HackerNews 热门新闻 - ${today}`, content: topMd },
    { title: `HackerNews 最新新闻 - ${today}`, content: newStoriesMd }
  );

  for (const doc of docs) {
    console.log(`创建文档: ${doc.title}`);
    await createWikiDoc(feishuSpaceId, doc.title, doc.content);
  }

  console.log("每日同步完成!");
}

async function createWikiDoc(spaceId: string, title: string, content: string) {
  const tempFile = `/tmp/feishu-wiki-${Date.now()}.md`;
  await fs.writeFile(tempFile, content, "utf-8");
  
  const cmd = `lark-cli docs +create --title "${title}" --markdown @${tempFile} --wiki-space ${spaceId}`;

  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`  创建成功: ${title}`);
  } catch (error) {
    console.error(`  创建失败: ${title}`, error);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

main().catch(console.error);