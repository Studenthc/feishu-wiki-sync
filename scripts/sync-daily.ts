import { config } from "dotenv";
import { getPopularProducts, getNewProducts, type PHProduct } from "./lib/product-hunt";
import { getTopStories, getNewStories, type HNStory } from "./lib/hacker-news";
import { formatPHProducts, formatHNStories } from "./lib/formatter";
import { localizeProducts, localizeStories } from "./lib/chinese";
import { buildOpportunityRadar, formatOpportunityRadar } from "./lib/opportunity";
import { execFileSync } from "child_process";
import * as fs from "fs/promises";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const today = new Date().toISOString().split("T")[0];
const SPACE_ID = "7639013663648107490";

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    return;
  }

  const dryRun = process.argv.includes("--dry-run");
  const opportunity = process.argv.includes("--opportunity");
  const opportunityOnly = process.argv.includes("--opportunity-only");
  const syncDate = getArgValue("--date") || today;
  const source = getArgValue("--source") || "all";
  if (!["all", "ph", "hn"].includes(source)) {
    throw new Error("Invalid --source. Use all, ph, or hn.");
  }
  const maxOpportunityItems = parseMaxOpportunityItems(
    getArgValue("--max-opportunity-items")
  );

  const phToken = process.env.PH_TOKEN || "";
  const feishuSpaceId = process.env.FEISHU_SPACE_ID || SPACE_ID;

  if (!dryRun) {
    console.log("检查 lark-cli 登录状态...");
    try {
      execFileSync("lark-cli", ["auth", "status"], { stdio: "pipe" });
    } catch {
      console.error("错误: 请先运行 lark-cli auth login 登录飞书");
      process.exit(1);
    }
  }

  console.log(`开始每日同步: ${syncDate}${dryRun ? " (dry-run)" : ""}`);

  const docs: { title: string; content: string }[] = [];
  const opportunityProducts: PHProduct[] = [];
  const opportunityStories: HNStory[] = [];

  if (source !== "hn" && phToken) {
    console.log("获取 Product Hunt 热门产品...");
    try {
      const phDateRange = getUtcDateRange(syncDate);
      const popularProducts = await localizeProducts(
        await getPopularProducts(phToken, 20, phDateRange)
      );
      opportunityProducts.push(...popularProducts);
      const popularMd = formatPHProducts(popularProducts, "popular");

      console.log("获取 Product Hunt 今日新品...");
      const newProducts = await localizeProducts(
        await getNewProducts(phToken, 20, phDateRange)
      );
      opportunityProducts.push(...newProducts);
      const newMd = formatPHProducts(newProducts, "new");

      if (!opportunityOnly) {
        docs.push(
          { title: `Product Hunt 热门产品 - ${syncDate}`, content: popularMd },
          { title: `Product Hunt 今日新品 - ${syncDate}`, content: newMd }
        );
      }
    } catch (error) {
      if (process.env.REQUIRE_CHINESE === "true") {
        throw error;
      }
      console.error("Product Hunt 获取失败，继续同步其他来源:", error);
    }
  } else if (source !== "hn") {
    console.log("跳过 Product Hunt (未设置 PH_TOKEN)");
  }

  if (source !== "ph") {
    console.log("获取 HackerNews 热门新闻...");
    const topStories = await localizeStories(await getTopStories(30));
    opportunityStories.push(...topStories);
    if (topStories.length > 0) {
      const topMd = formatHNStories(topStories, "top");
      if (!opportunityOnly) {
        docs.push({ title: `HackerNews 热门新闻 - ${syncDate}`, content: topMd });
      }
    } else {
      console.log("跳过 HackerNews 热门新闻 (没有获取到内容)");
    }

    console.log("获取 HackerNews 最新新闻...");
    const newStories = await localizeStories(await getNewStories(30));
    opportunityStories.push(...newStories);
    if (newStories.length > 0) {
      const newStoriesMd = formatHNStories(newStories, "new");
      if (!opportunityOnly) {
        docs.push({ title: `HackerNews 最新新闻 - ${syncDate}`, content: newStoriesMd });
      }
    } else {
      console.log("跳过 HackerNews 最新新闻 (没有获取到内容)");
    }
  }

  if (opportunity || opportunityOnly) {
    console.log("生成每日机会雷达...");
    const radar = await buildOpportunityRadar({
      date: syncDate,
      products: opportunityProducts,
      stories: opportunityStories,
      maxItems: maxOpportunityItems,
    });
    docs.push({
      title: `每日机会雷达 - ${syncDate}`,
      content: formatOpportunityRadar(normalizeOpportunityRadar(radar, syncDate)),
    });
  }

  if (docs.length === 0) {
    console.log("没有可同步内容，结束。");
    return;
  }

  for (const doc of docs) {
    console.log(`创建文档: ${doc.title}`);
    if (dryRun) {
      previewDoc(doc.title, doc.content);
    } else {
      await createWikiDoc(feishuSpaceId, doc.title, doc.content);
    }
  }

  console.log("每日同步完成!");
}

function usage() {
  console.log(
    [
      "Usage:",
      "  pnpm sync:daily",
      "  pnpm sync:daily -- --dry-run",
      "  pnpm sync:daily -- --date=2026-05-14 --source=ph",
      "  pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only --dry-run",
      "",
      "Options:",
      "  --date=YYYY-MM-DD            Date used in titles and Product Hunt date filter",
      "  --source=all|ph|hn           Sync all sources, Product Hunt only, or HackerNews only",
      "  --opportunity                Create an additional daily opportunity radar doc",
      "  --opportunity-only           Create only the daily opportunity radar doc",
      "  --max-opportunity-items=N    Max radar input/output items, 1-20, default 8",
      "  --dry-run                    Preview docs without creating Feishu wiki pages",
      "",
      "Environment:",
      "  PH_TOKEN          Product Hunt developer token, optional",
      "  FEISHU_SPACE_ID   Feishu wiki space id, optional",
      "  OPENAI_API_KEY    Enables Chinese rewriting for titles and summaries",
      "  OPENAI_MODEL      Optional OpenAI model override",
    ].join("\n")
  );
}

function getArgValue(name: string): string | undefined {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) {
    return direct.slice(name.length + 1);
  }

  const index = process.argv.indexOf(name);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
}

function parseMaxOpportunityItems(value: string | undefined): number {
  if (value === undefined) {
    return 8;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("--max-opportunity-items must be an integer between 1 and 20");
  }

  const parsed = Number.parseInt(value, 10);
  if (parsed < 1 || parsed > 20) {
    throw new Error("--max-opportunity-items must be an integer between 1 and 20");
  }

  return parsed;
}

function normalizeOpportunityRadar(
  radar: Awaited<ReturnType<typeof buildOpportunityRadar>>,
  fallbackDate: string
): Awaited<ReturnType<typeof buildOpportunityRadar>> {
  return {
    ...radar,
    date: radar.date || fallbackDate,
    topOpportunities: Array.isArray(radar.topOpportunities)
      ? radar.topOpportunities
      : [],
    keywordClusters: Array.isArray(radar.keywordClusters) ? radar.keywordClusters : [],
    avoidList: Array.isArray(radar.avoidList) ? radar.avoidList : [],
    weeklyExperiments: Array.isArray(radar.weeklyExperiments)
      ? radar.weeklyExperiments
      : [],
  };
}

function getUtcDateRange(date: string): { postedAfter: string; postedBefore: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("--date must use YYYY-MM-DD format");
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    postedAfter: start.toISOString(),
    postedBefore: end.toISOString(),
  };
}

function previewDoc(title: string, content: string) {
  console.log(`  [dry-run] ${title}`);
  console.log(content.slice(0, 1200));
  if (content.length > 1200) {
    console.log("  [dry-run] ...");
  }
}

async function createWikiDoc(spaceId: string, title: string, content: string) {
  const tempFile = `./temp-wiki-${Date.now()}.md`;
  await fs.writeFile(tempFile, content, "utf-8");

  try {
    execFileSync(
      "lark-cli",
      [
        "docs",
        "+create",
        "--title",
        title,
        "--markdown",
        `@${tempFile}`,
        "--wiki-space",
        spaceId,
      ],
      { stdio: "inherit" }
    );
    console.log(`  创建成功: ${title}`);
  } catch (error) {
    console.error(`  创建失败: ${title}`, error);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
