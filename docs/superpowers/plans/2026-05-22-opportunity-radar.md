# Opportunity Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese “每日机会雷达” document that turns Product Hunt and HackerNews items into actionable website/business opportunities for finding demand, keywords, and monetization angles.

**Architecture:** Keep the existing daily list documents intact, then add an optional `--opportunity` mode that creates one additional Feishu Wiki document from the same fetched/localized data. The new analyzer lives in a focused module and uses Gemini first, OpenAI second, with `REQUIRE_CHINESE=true` preventing English fallback in GitHub Actions.

**Tech Stack:** TypeScript, Node 20+ fetch, tsx, lark-cli, Product Hunt GraphQL API, HackerNews Firebase API, Gemini generateContent REST API, optional OpenAI Responses API fallback.

---

## File Structure

- Modify `scripts/lib/chinese.ts`: export a reusable JSON generation function so the opportunity analyzer can use the same Gemini/OpenAI provider without duplicating credentials and HTTP code.
- Create `scripts/lib/opportunity.ts`: define opportunity input/output types, build prompts, call the Chinese JSON provider, and format the opportunity radar Markdown.
- Modify `scripts/sync-daily.ts`: collect fetched PH/HN data, add `--opportunity`, `--opportunity-only`, and `--max-opportunity-items` CLI flags, and create `每日机会雷达 - YYYY-MM-DD`.
- Modify `README.md`: document the new opportunity mode, required secrets, and recommended manual/backfill commands.
- Add `scripts/lib/opportunity.test.ts`: lightweight Node assertion tests for pure formatting and selection logic.
- Modify `package.json`: add `test:opportunity` script using `tsx`.

---

### Task 1: Extract Reusable Chinese JSON Provider

**Files:**
- Modify: `scripts/lib/chinese.ts`
- Test: `pnpm typecheck`

- [ ] **Step 1: Modify `scripts/lib/chinese.ts` to export provider helpers**

Replace the private provider shape with exported types and functions while keeping existing `localizeProducts` and `localizeStories` behavior.

```ts
export interface ChineseJsonProvider {
  name: "gemini" | "openai";
  createJson: <T>(instructions: string, payload: unknown) => Promise<T>;
}

export function getChineseProvider(): ChineseJsonProvider | null {
  const geminiKey = process.env.GEMINI_API_KEY || "";
  if (geminiKey) {
    return {
      name: "gemini",
      createJson: (instructions, payload) =>
        createGeminiChineseJson(geminiKey, instructions, payload),
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY || "";
  if (openaiKey) {
    return {
      name: "openai",
      createJson: (instructions, payload) =>
        createOpenAIChineseJson(openaiKey, instructions, payload),
    };
  }

  return null;
}

export function assertChineseAvailable(cause?: unknown): void {
  if (process.env.REQUIRE_CHINESE === "true") {
    throw new Error(
      `REQUIRE_CHINESE=true, but Chinese rewriting is unavailable.${
        cause instanceof Error ? ` ${cause.message}` : ""
      }`
    );
  }
}
```

- [ ] **Step 2: Update call sites inside `scripts/lib/chinese.ts`**

Change `assertChineseNotRequired(...)` calls to `assertChineseAvailable(...)`. Remove the old private `getChineseProvider` and `assertChineseNotRequired` definitions after adding the exported versions.

```ts
const provider = getChineseProvider();
if (!provider || products.length === 0) {
  if (!provider) {
    assertChineseAvailable();
    console.log("跳过中文化 (未设置 GEMINI_API_KEY 或 OPENAI_API_KEY)");
  }
  return products;
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected: exit code `0`.

---

### Task 2: Add Opportunity Analyzer Module

**Files:**
- Create: `scripts/lib/opportunity.ts`
- Create: `scripts/lib/opportunity.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/lib/opportunity.ts`**

Add this module. It keeps AI output small and business-focused, and has a deterministic fallback only when `REQUIRE_CHINESE` is not true.

```ts
import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { assertChineseAvailable, getChineseProvider } from "./chinese";

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
  demand: string;
  targetUsers: string;
  monetization: string;
  seoKeywords: string[];
  siteIdeas: string[];
  opportunityScore: number;
  scoreReason: string;
  nextValidationStep: string;
  url?: string;
}

export interface OpportunityRadar {
  date: string;
  topOpportunities: OpportunityItem[];
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
        "你是一个面向独立开发者和内容站站长的需求挖掘分析师。",
        "请从 Product Hunt 和 HackerNews 数据中找适合上站赚钱的机会。",
        "输出必须是中文 JSON，不能包含 Markdown。",
        "判断标准：真实痛点、可搜索需求、可在一周内做 MVP、可通过 SEO/工具站/affiliate/SaaS 变现。",
        "不要只摘要新闻，要输出需求洞察和可执行站点选题。",
        "opportunityScore 必须是 1 到 5 的整数，5 代表最值得本周验证。",
        "seoKeywords 每项 3 到 6 个关键词。",
        "siteIdeas 每项 2 到 4 个具体页面或工具站想法。",
        "weeklyExperiments 给 3 个本周可做的验证实验。",
      ].join("\\n"),
      {
        date: input.date,
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
    );
  } catch (error) {
    assertChineseAvailable(error);
    console.error("机会雷达生成失败，使用本地兜底:", error);
    return buildFallbackRadar(input);
  }
}

export function formatOpportunityRadar(radar: OpportunityRadar): string {
  let md = `# 每日机会雷达 - ${radar.date}\\n\\n`;
  md += `> 面向上站赚钱：从 Product Hunt / HackerNews 中提取需求、关键词、变现方式和本周验证动作。\\n\\n`;
  md += `---\\n\\n`;

  md += `## 最值得研究的机会\\n\\n`;
  radar.topOpportunities.forEach((item, index) => {
    md += `### ${index + 1}. ${item.title}\\n\\n`;
    md += `- **来源**: ${item.source} / ${item.originalName}\\n`;
    md += `- **需求判断**: ${item.demand}\\n`;
    md += `- **目标用户**: ${item.targetUsers}\\n`;
    md += `- **变现方式**: ${item.monetization}\\n`;
    md += `- **SEO 关键词**: ${item.seoKeywords.join("、")}\\n`;
    md += `- **可做选题**: ${item.siteIdeas.join("；")}\\n`;
    md += `- **机会评分**: ${item.opportunityScore}/5，${item.scoreReason}\\n`;
    md += `- **本周验证**: ${item.nextValidationStep}\\n`;
    if (item.url) {
      md += `- **链接**: ${item.url}\\n`;
    }
    md += `\\n`;
  });

  md += `---\\n\\n## 关键词集群\\n\\n`;
  radar.keywordClusters.forEach((cluster) => {
    md += `### ${cluster.cluster}\\n\\n`;
    md += `- **关键词**: ${cluster.keywords.join("、")}\\n`;
    md += `- **为什么值得看**: ${cluster.why}\\n\\n`;
  });

  md += `---\\n\\n## 不建议优先做\\n\\n`;
  radar.avoidList.forEach((item) => {
    md += `- **${item.name}**: ${item.reason}\\n`;
  });

  md += `\\n---\\n\\n## 本周可验证实验\\n\\n`;
  radar.weeklyExperiments.forEach((experiment, index) => {
    md += `${index + 1}. **${experiment.idea}**\\n`;
    md += `   - 落地页角度: ${experiment.landingPageAngle}\\n`;
    md += `   - 验证动作: ${experiment.validationStep}\\n`;
  });

  return md;
}

function buildFallbackRadar(input: OpportunityInput): OpportunityRadar {
  const productItems = input.products.slice(0, input.maxItems).map((product) => ({
    title: `${product.name} 相关需求`,
    source: "Product Hunt" as const,
    originalName: product.name,
    demand: product.descriptionZh || product.description || product.taglineZh || product.tagline,
    targetUsers: "需要解决该场景问题的个人用户、团队或小企业",
    monetization: "先用内容页或轻量工具页验证搜索需求，再考虑 SaaS、模板或 affiliate",
    seoKeywords: [product.name, product.taglineZh || product.tagline, `${product.name} 替代品`],
    siteIdeas: [`${product.name} 介绍页`, `${product.name} 替代品列表`, `${product.name} 使用场景工具页`],
    opportunityScore: Math.min(5, Math.max(1, Math.ceil((product.commentsCount || 1) / 30))),
    scoreReason: "基于 Product Hunt 评论量做初步热度估计，需要再查搜索需求。",
    nextValidationStep: "搜索相关关键词，记录竞品页面、广告投放和用户抱怨。",
    url: product.url,
  }));

  const storyItems = input.stories.slice(0, input.maxItems).map((story) => ({
    title: story.titleZh || story.title,
    source: "HackerNews" as const,
    originalName: story.title,
    demand: story.summaryZh || story.summary || `围绕 ${story.title} 的讨论可能代表一个内容或工具需求。`,
    targetUsers: "关注该技术、工具或市场变化的专业用户",
    monetization: "内容站 SEO、工具页、newsletter 或相关产品 affiliate",
    seoKeywords: [story.titleZh || story.title, `${story.siteName || "相关"} 工具`, "替代方案"],
    siteIdeas: [`${story.titleZh || story.title} 解读`, "相关工具清单", "问题解决指南"],
    opportunityScore: Math.min(5, Math.max(1, Math.ceil((story.descendants || 1) / 80))),
    scoreReason: "基于 HackerNews 评论量做初步热度估计，需要验证是否有商业搜索意图。",
    nextValidationStep: "查看评论区痛点，提取反复出现的问题和付费场景。",
    url: story.url,
  }));

  return {
    date: input.date,
    topOpportunities: [...productItems, ...storyItems].slice(0, input.maxItems),
    keywordClusters: [
      {
        cluster: "AI 工具与自动化",
        keywords: ["AI 工具", "自动化工具", "替代品", "工作流"],
        why: "PH/HN 高频出现，适合做工具对比和场景页面。",
      },
    ],
    avoidList: [
      {
        name: "只有热度但无明确付费场景的新闻",
        reason: "容易变成泛资讯，SEO 和变现都不稳定。",
      },
    ],
    weeklyExperiments: [
      {
        idea: "选择评分最高的一个需求做单页验证",
        landingPageAngle: "围绕一个明确痛点写解决方案和替代品对比",
        validationStep: "发布页面后手动发到相关社区，观察点击、收藏和回复。",
      },
    ],
  };
}
```

- [ ] **Step 2: Add `scripts/lib/opportunity.test.ts`**

Add a focused test for pure formatting. This avoids external API calls.

```ts
import assert from "node:assert/strict";
import { formatOpportunityRadar, type OpportunityRadar } from "./opportunity";

const radar: OpportunityRadar = {
  date: "2026-05-22",
  topOpportunities: [
    {
      title: "AI 会议记忆工具",
      source: "Product Hunt",
      originalName: "Spellar 3.0",
      demand: "团队需要跨会议追踪决策和待办。",
      targetUsers: "销售、咨询顾问、远程团队",
      monetization: "SaaS 订阅或会议模板售卖",
      seoKeywords: ["AI 会议助手", "会议纪要工具", "销售会议记录"],
      siteIdeas: ["AI 会议助手对比页", "会议纪要模板下载"],
      opportunityScore: 4,
      scoreReason: "痛点明确，付费用户清晰。",
      nextValidationStep: "做一页会议工具对比并投放到销售社区。",
      url: "https://example.com/spellar",
    },
  ],
  keywordClusters: [
    {
      cluster: "AI 会议工具",
      keywords: ["AI 会议助手", "会议纪要", "销售跟进"],
      why: "远程团队和销售团队有持续需求。",
    },
  ],
  avoidList: [
    {
      name: "泛 AI 新闻",
      reason: "缺少明确购买动作。",
    },
  ],
  weeklyExperiments: [
    {
      idea: "AI 会议助手对比页",
      landingPageAngle: "对比不同工具在销售跟进中的效果",
      validationStep: "发给 10 个销售团队负责人收反馈。",
    },
  ],
};

const markdown = formatOpportunityRadar(radar);

assert.match(markdown, /# 每日机会雷达 - 2026-05-22/);
assert.match(markdown, /需求判断/);
assert.match(markdown, /AI 会议助手、会议纪要、销售跟进/);
assert.match(markdown, /机会评分\\*\\*: 4\\/5/);

console.log("opportunity formatter test passed");
```

- [ ] **Step 3: Add test script to `package.json`**

Add:

```json
"test:opportunity": "tsx scripts/lib/opportunity.test.ts"
```

Keep existing scripts.

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm test:opportunity
pnpm typecheck
```

Expected:

```text
opportunity formatter test passed
```

and typecheck exit code `0`.

---

### Task 3: Integrate Opportunity Radar Into Daily Sync

**Files:**
- Modify: `scripts/sync-daily.ts`
- Test: `pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only --dry-run`

- [ ] **Step 1: Import analyzer functions**

Add:

```ts
import { buildOpportunityRadar, formatOpportunityRadar } from "./lib/opportunity";
import type { HNStory } from "./lib/hacker-news";
import type { PHProduct } from "./lib/product-hunt";
```

- [ ] **Step 2: Parse new flags**

Add after `source` parsing:

```ts
const includeOpportunity = process.argv.includes("--opportunity") || process.argv.includes("--opportunity-only");
const opportunityOnly = process.argv.includes("--opportunity-only");
const maxOpportunityItems = Number.parseInt(getArgValue("--max-opportunity-items") || "8", 10);
if (!Number.isInteger(maxOpportunityItems) || maxOpportunityItems < 1 || maxOpportunityItems > 20) {
  throw new Error("--max-opportunity-items must be an integer from 1 to 20");
}
```

- [ ] **Step 3: Store fetched localized items**

Add before PH/HN fetching:

```ts
const opportunityProducts: PHProduct[] = [];
const opportunityStories: HNStory[] = [];
```

After each localized PH fetch, push:

```ts
opportunityProducts.push(...popularProducts, ...newProducts);
```

After each localized HN fetch, push:

```ts
opportunityStories.push(...topStories, ...newStories);
```

- [ ] **Step 4: Respect `--opportunity-only` for list documents**

Wrap existing list document pushes so they only run when `!opportunityOnly`.

For PH:

```ts
if (!opportunityOnly) {
  docs.push(
    { title: `Product Hunt 热门产品 - ${syncDate}`, content: popularMd },
    { title: `Product Hunt 今日新品 - ${syncDate}`, content: newMd }
  );
}
```

For HN:

```ts
if (!opportunityOnly) {
  docs.push({ title: `HackerNews 热门新闻 - ${syncDate}`, content: topMd });
}
```

and similarly for new stories.

- [ ] **Step 5: Add opportunity document creation**

After PH/HN fetching and before `if (docs.length === 0)`, add:

```ts
if (includeOpportunity) {
  console.log("生成每日机会雷达...");
  const radar = await buildOpportunityRadar({
    date: syncDate,
    products: opportunityProducts,
    stories: opportunityStories,
    maxItems: maxOpportunityItems,
  });
  docs.push({
    title: `每日机会雷达 - ${syncDate}`,
    content: formatOpportunityRadar(radar),
  });
}
```

- [ ] **Step 6: Update usage text**

Add:

```ts
"  pnpm sync:daily -- --date=2026-05-14 --source=all --opportunity",
"  pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only",
```

Add options:

```ts
"  --opportunity             Also create a business opportunity radar document",
"  --opportunity-only        Create only the opportunity radar document",
"  --max-opportunity-items=N Analyze 1-20 items per source group, default 8",
```

- [ ] **Step 7: Verify PH-only opportunity dry-run**

Run:

```bash
REQUIRE_CHINESE=true pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only --dry-run
```

Expected:

- Output includes `生成每日机会雷达...`
- Output includes `创建文档: 每日机会雷达 - 2026-05-14`
- Output does not include `创建文档: Product Hunt 热门产品 - 2026-05-14`
- Markdown contains `## 最值得研究的机会`, `## 关键词集群`, `## 本周可验证实验`

---

### Task 4: Document Workflow and Run Final Verification

**Files:**
- Modify: `README.md`
- Verify: `pnpm test:opportunity`, `pnpm typecheck`, opportunity dry-run

- [ ] **Step 1: Update `README.md` with opportunity commands**

Add this section after “内容格式”:

```md
## 机会雷达

除了普通 PH/HN 列表，也可以生成面向上站赚钱的机会分析文档：

```bash
pnpm sync:daily -- --date=2026-05-14 --source=all --opportunity
```

只生成机会雷达，不生成普通列表：

```bash
pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only
```

机会雷达会输出：

- 今日最值得研究的需求机会
- 目标用户
- 变现方式
- SEO 关键词
- 可做选题
- 机会评分
- 本周验证动作
```
```

- [ ] **Step 2: Run final verification**

Run:

```bash
pnpm test:opportunity
pnpm typecheck
REQUIRE_CHINESE=true pnpm sync:daily -- --date=2026-05-14 --source=ph --opportunity-only --dry-run
```

Expected:

- `pnpm test:opportunity` prints `opportunity formatter test passed`
- `pnpm typecheck` exits `0`
- dry-run prints exactly one document creation preview: `每日机会雷达 - 2026-05-14`

---

## Self-Review

**Spec coverage:** The plan adds a business opportunity analysis layer for daily PH/HN inputs, keeps normal list documents, supports backfill/date/source flags, uses Gemini/OpenAI中文化, and protects GitHub Actions from publishing English content with `REQUIRE_CHINESE=true`.

**Placeholder scan:** No `TBD`, `TODO`, “implement later”, or unspecified “add tests” instructions remain. Every code task includes exact code or exact command expectations.

**Type consistency:** `OpportunityInput`, `OpportunityItem`, `OpportunityRadar`, `buildOpportunityRadar`, and `formatOpportunityRadar` are defined in Task 2 and referenced consistently in Task 3. `PHProduct` and `HNStory` match existing module names.

