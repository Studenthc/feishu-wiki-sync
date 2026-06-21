# Copyable Product Case Studies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a daily `可抄作业产品案例拆解` document that turns PH/HN candidates into PDF-style product case studies centered on who pays, why they pay, how small teams can copy a narrower wedge, and what risks to avoid.

**Architecture:** Keep the existing `每日机会雷达` as the discovery layer. Add a focused `scripts/lib/case-study.ts` module for deep case studies, wire new `--case-study` / `--case-study-only` CLI flags into `scripts/sync-daily.ts`, and update GitHub Actions so daily sync creates both the radar and the deeper case-study document. The case-study generator must mark payment-growth signals as `未验证` unless the source data contains evidence.

**Tech Stack:** TypeScript, Node.js `fetch`, `tsx`, existing `ChineseJsonProvider`, existing Feishu `lark-cli` write path, current PH/HN data models.

---

## Scope

This plan does not add paid-growth data vendors, browser scraping, or keyword-volume APIs. It creates the output structure and model prompt needed for PDF-style deep decomposition using current PH/HN inputs. Because PH/HN does not provide "上月付费行为陡增 X%" data, every report must label that field as `未验证` or explain the weaker available signal.

## File Structure

- Create: `scripts/lib/case-study.ts`
  - Defines `CaseStudyInput`, `ProductCaseStudy`, and `CaseStudyReport`.
  - Calls the existing Chinese JSON provider with a PDF-style prompt.
  - Validates model output and falls back to conservative local case studies.
  - Formats Markdown for Feishu.

- Create: `scripts/lib/case-study.test.ts`
  - Tests formatter structure and provider priority stays intact.
  - Locks the required sections: `解决什么问题`, `用户为什么付费`, `技术原理`, `小团队怎么抄`, `风险：不要踩什么坑`.

- Modify: `scripts/sync-daily.ts`
  - Adds `--case-study`, `--case-study-only`, and `--max-case-studies=N`.
  - Generates `可抄作业产品案例拆解 - YYYY-MM-DD`.
  - Keeps list docs disabled for either `--opportunity-only` or `--case-study-only`.

- Modify: `package.json`
  - Adds `test:case-study`.

- Modify: `.github/workflows/feishu-daily-sync.yml`
  - Changes the scheduled command to create the normal docs, opportunity radar, and case-study report.

- Modify: `README.md`
  - Documents the new case-study mode and clarifies that payment growth is not claimed unless verified.

## Task 1: Add Case Study Types, Formatter, And Test

**Files:**
- Create: `scripts/lib/case-study.ts`
- Create: `scripts/lib/case-study.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Create a failing formatter test**

Create `scripts/lib/case-study.test.ts` with this content:

```ts
import assert from "node:assert/strict";
import { formatCaseStudyReport, type CaseStudyReport } from "./case-study";

const report: CaseStudyReport = {
  date: "2026-06-21",
  summary:
    "今天只深拆 2 个更接近付费场景的产品。重点不是复制大产品，而是拆出小团队能做的垂直切口。",
  cases: [
    {
      title: "AI API 成本控制计算器",
      source: "Product Hunt",
      originalName: "Respan Gateway",
      productName: "Respan Gateway",
      url: "https://example.com/respan",
      launchTime: "未验证",
      paidGrowthSignal: "未验证；当前只有 PH 评论和产品描述信号",
      evidenceLevel: "中证据",
      whySelected:
        "它指向 AI API 成本控制这个离钱很近的问题，适合先做计算器或对比页验证。",
      problem:
        "小团队接多个模型后，很难看清每月 API 成本、缓存收益和模型路由策略。",
      users: "使用多个 AI API 的独立开发者、SaaS 小团队、AI 工具站站长",
      paymentReason:
        "用户付费不是为了买网关概念，而是为了少花 API 钱、减少排查时间、避免账单失控。",
      technicalPrinciple:
        "本质是统一代理层，加上模型路由、缓存、日志、成本统计和告警。",
      copyStrategy:
        "不要抄完整 AI Gateway，先抄一个更窄的 AI API 成本计算器。",
      smallTeamWedges: [
        "Claude / Gemini / DeepSeek 成本对比页",
        "AI API 月账单估算器",
        "AI API 缓存收益计算器",
      ],
      minimumMvp:
        "一个单页计算器：输入模型、调用量、输入输出 token，输出月成本和省钱建议。",
      validationActions: [
        "搜索 AI API cost calculator，记录前 10 个结果的页面形态和变现方式。",
        "找 5 个 AI 工具站开发者，问他们是否遇到 API 成本失控。",
        "用 Google Sheet 做一个成本计算器原型，发到开发者社区收反馈。",
      ],
      growthReason:
        "AI API 调用量持续增长，小团队会越来越在意成本、缓存和模型切换。",
      monetizationPath:
        "先用 SEO 和免费计算器获客，再通过模板、赞助、affiliate 或轻量监控工具变现。",
      risks: [
        "不要一开始做完整网关，基础设施产品支持成本很高。",
        "不要编造 affiliate 或付费增长数据，必须先验证。",
      ],
      contentAngle:
        "我每月 AI API 账单为什么涨到 500 美元？用一个表算清楚。",
      missingEvidence: [
        "没有真实搜索量数据。",
        "没有确认 Respan 是否有公开 affiliate。",
        "没有直接用户访谈。",
      ],
    },
  ],
  rejected: [
    {
      name: "泛 AI 新闻",
      reason: "只有话题热度，没有明确付款动作。",
    },
  ],
};

const markdown = formatCaseStudyReport(report);

assert.match(markdown, /# 可抄作业产品案例拆解 - 2026-06-21/);
assert.match(markdown, /解决什么问题/);
assert.match(markdown, /用户为什么付费/);
assert.match(markdown, /技术原理是什么/);
assert.match(markdown, /小团队怎么抄/);
assert.match(markdown, /风险：不要踩什么坑/);
assert.match(markdown, /上月付费行为陡增\*\*: 未验证/);
assert.match(markdown, /AI API 月账单估算器/);
assert.match(markdown, /今天只深拆 2 个/);

console.log("case study formatter test passed");
```

- [ ] **Step 2: Add the test script**

Modify `package.json` scripts to include:

```json
"test:case-study": "tsx scripts/lib/case-study.test.ts"
```

- [ ] **Step 3: Run test and verify it fails**

Run:

```bash
pnpm test:case-study
```

Expected: FAIL with module not found for `./case-study`.

- [ ] **Step 4: Create `scripts/lib/case-study.ts` with types and formatter**

Create `scripts/lib/case-study.ts` with the implementation described in Task 2 and Task 3.

- [ ] **Step 5: Run formatter test**

Run:

```bash
pnpm test:case-study
```

Expected: PASS and prints `case study formatter test passed`.

## Task 2: Implement Case Study Generator

**Files:**
- Create: `scripts/lib/case-study.ts`

- [ ] **Step 1: Add imports and interfaces**

`scripts/lib/case-study.ts` must import `PHProduct`, `HNStory`, and the existing Chinese provider:

```ts
import type { HNStory } from "./hacker-news";
import type { PHProduct } from "./product-hunt";
import { assertChineseAvailable, getChineseProvider } from "./chinese";
```

Define:

```ts
export interface CaseStudyInput {
  date: string;
  products: PHProduct[];
  stories: HNStory[];
  maxCases: number;
}
```

Define `ProductCaseStudy`, `CaseStudyReport`, and `CaseStudyRejectedItem` with the exact fields used by the test.

- [ ] **Step 2: Implement `buildCaseStudyReport`**

The function must:

- Use `getChineseProvider()`.
- If no provider exists, call `assertChineseAvailable()` and return fallback.
- Send at most `maxCases * 2` PH products and `maxCases * 2` HN stories to the provider.
- Prompt for the PDF-style structure:
  - `名字 / 网址 / 上线时间 / 上月付费行为陡增`
  - `解决什么问题`
  - `用户是谁`
  - `用户为什么付费`
  - `技术原理是什么`
  - `小团队怎么抄`
  - `付费陡增的原因`
  - `风险：不要踩什么坑`
- Explicitly forbid fabricated paid-growth numbers.
- Require `paidGrowthSignal` to be `未验证；...` unless data contains a verified signal.

- [ ] **Step 3: Implement validation**

Add `ensureUsefulCaseStudyReport`, `isUsefulCaseStudy`, and `isUsefulText`.

If model output is malformed or has empty cases while input exists, log:

```ts
console.error("案例拆解模型输出不可用，使用本地兜底。");
```

Then return fallback.

- [ ] **Step 4: Implement fallback**

Fallback must create conservative cases from PH first, then HN:

- Product fallback title: `${product.name}：可抄小切口`
- HN fallback title: `${story.titleZh || story.title}：可抄小切口`
- `launchTime`: `未验证`
- `paidGrowthSignal`: `未验证；当前只有 PH/HN 热度和描述信号`
- `evidenceLevel`: `弱证据`
- `paymentReason`: must say this is a hypothesis, not proof.
- `copyStrategy`: must say "不要复制完整产品".
- `minimumMvp`: a single page, checklist, calculator, directory, or template.

## Task 3: Wire CLI Flags Into Daily Sync

**Files:**
- Modify: `scripts/sync-daily.ts`

- [ ] **Step 1: Import case-study functions**

Add:

```ts
import { buildCaseStudyReport, formatCaseStudyReport } from "./lib/case-study";
```

- [ ] **Step 2: Parse flags**

Add:

```ts
const caseStudy = process.argv.includes("--case-study");
const caseStudyOnly = process.argv.includes("--case-study-only");
const maxCaseStudies = parseMaxCaseStudies(getArgValue("--max-case-studies"));
const analysisOnly = opportunityOnly || caseStudyOnly;
```

- [ ] **Step 3: Suppress list docs in analysis-only modes**

Replace every `if (!opportunityOnly)` check that controls normal PH/HN list docs with:

```ts
if (!analysisOnly) {
```

- [ ] **Step 4: Add case-study doc creation**

After opportunity radar creation, add:

```ts
if (caseStudy || caseStudyOnly) {
  console.log("生成可抄作业产品案例拆解...");
  const report = await buildCaseStudyReport({
    date: syncDate,
    products: opportunityProducts,
    stories: opportunityStories,
    maxCases: maxCaseStudies,
  });
  docs.push({
    title: `可抄作业产品案例拆解 - ${syncDate}`,
    content: formatCaseStudyReport(normalizeCaseStudyReport(report, syncDate)),
  });
}
```

- [ ] **Step 5: Add parser and normalizer**

Add `parseMaxCaseStudies` with allowed range 1-5 and default 3.

Add `normalizeCaseStudyReport` that ensures `date`, `cases`, and `rejected` arrays exist.

- [ ] **Step 6: Update usage help**

Add help lines for:

- `--case-study`
- `--case-study-only`
- `--max-case-studies=N`

## Task 4: Update Workflow, Docs, And Verification

**Files:**
- Modify: `.github/workflows/feishu-daily-sync.yml`
- Modify: `README.md`

- [ ] **Step 1: Update scheduled command**

Change workflow command from:

```yaml
run: pnpm sync:daily -- --opportunity
```

to:

```yaml
run: pnpm sync:daily -- --opportunity --case-study
```

- [ ] **Step 2: Document local commands**

Add README section:

```md
## 可抄作业产品案例拆解

生成类似「付费产品案例拆解」的深度文档：

```bash
pnpm sync:daily -- --source=all --case-study-only --max-case-studies=3 --dry-run
```

每天定时任务会在机会雷达之外，额外创建一篇 `可抄作业产品案例拆解 - YYYY-MM-DD`。

注意：PH/HN 本身没有真实「上月付费行为陡增」数据，所以文档会把该字段标为 `未验证`，不会编造增长百分比。
```

- [ ] **Step 3: Run full checks**

Run:

```bash
pnpm typecheck
pnpm test:opportunity
pnpm test:case-study
```

Expected: all pass.

- [ ] **Step 4: Run dry-run**

Run:

```bash
pnpm sync:daily -- --source=all --case-study-only --max-case-studies=2 --dry-run
```

Expected output includes:

- `生成可抄作业产品案例拆解...`
- `创建文档: 可抄作业产品案例拆解 - YYYY-MM-DD`
- `解决什么问题`
- `用户为什么付费`
- `小团队怎么抄`
- `风险：不要踩什么坑`

## Self-Review

### Spec Coverage

- Adds a PDF-style deep case-study output.
- Keeps current opportunity radar intact.
- Marks paid-growth signals as unverified when not available.
- Updates scheduled workflow to create the new document daily.
- Provides tests and dry-run verification.

### Placeholder Scan

No placeholder work remains in this plan. The implementation steps name every file, command, and expected output.

### Type Consistency

The plan consistently uses:

- `CaseStudyInput`
- `ProductCaseStudy`
- `CaseStudyReport`
- `buildCaseStudyReport`
- `formatCaseStudyReport`
- `--case-study`
- `--case-study-only`
- `--max-case-studies`
